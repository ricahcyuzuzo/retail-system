import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

 type Product = {
  _id: string;
  name: string;
  retailPrice: number;
  wholesalePrice?: number;
  purchasePrice: number;
  inventory: number;
};

 type Sale = {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleType: 'retail' | 'wholesale';
  profit: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
};

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const selectedProduct = useMemo(() => products.find(p => p._id === productId), [products, productId]);

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    } as const;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const [salesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sales`, { headers }),
        fetch(`${API_BASE_URL}/products`, { headers }),
      ]);
      if (!salesRes.ok) throw new Error('Failed to fetch sales');
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const [salesData, productsData] = await Promise.all([salesRes.json(), productsRes.json()])
      setSales(salesData);
      setProducts(productsData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const openModal = () => {
    setProductId('');
    setQuantity('1');
    setSaleType('retail');
    setCustomerName('');
    setCustomerPhone('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSave = useCallback(async () => {
    if (!productId || !quantity) {
      Alert.alert('Validation', 'Product and quantity are required.');
      return;
    }
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const body = JSON.stringify({
        productId,
        quantity: Number(quantity),
        saleType,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      });
      const res = await fetch(`${API_BASE_URL}/sales`, { method: 'POST', headers, body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to record sale');
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record sale');
    } finally {
      setSaving(false);
    }
  }, [productId, quantity, saleType, customerName, customerPhone, getAuthHeaders, fetchData]);

  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0), [sales]);
  const totalProfit = useMemo(() => sales.reduce((sum, s) => sum + (s.profit || 0), 0), [sales]);

  const renderItem = ({ item }: { item: Sale }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.productName}</Text>
        <Text style={styles.rowSub}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.rowSub}>Qty: {item.quantity} • Type: {item.saleType}</Text>
        <Text style={styles.rowSub}>Total: RWF {item.totalAmount.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>+ Record Sale</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardGreen]}> 
          <Text style={styles.cardLabel}>Total Revenue</Text>
          <Text style={styles.cardValue}>RWF {totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, styles.cardBlue]}> 
          <Text style={styles.cardLabel}>Total Profit</Text>
          <Text style={styles.cardValue}>RWF {totalProfit.toLocaleString()}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading sales...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 40 }]}>No sales</Text>}
        />
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Sale</Text>

            {/* Product selector as a simple list for now */}
            <Text style={styles.inputLabel}>Product</Text>
            <View style={styles.selectorBox}>
              {products.length === 0 ? (
                <Text style={styles.muted}>No products available</Text>
              ) : (
                <FlatList
                  data={products}
                  keyExtractor={(p) => p._id}
                  style={{ maxHeight: 160 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.selectorItem, productId === item._id && styles.selectorItemActive]}
                      onPress={() => setProductId(item._id)}
                    >
                      <Text style={styles.selectorItemTitle}>{item.name}</Text>
                      <Text style={styles.selectorItemSub}>Stock: {item.inventory}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>

            <Text style={styles.inputLabel}>Sale Type</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.pill, saleType === 'retail' ? styles.pillActive : styles.pillInactive]}
                onPress={() => setSaleType('retail')}
              >
                <Text style={styles.pillText}>Retail</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, saleType === 'wholesale' ? styles.pillActive : styles.pillInactive]}
                onPress={() => setSaleType('wholesale')}
              >
                <Text style={styles.pillText}>Wholesale</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Quantity"
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            {selectedProduct && (
              <View style={styles.calcBox}>
                <Text style={styles.mutedSmall}>
                  Unit Price: RWF {(
                    saleType === 'wholesale'
                      ? (selectedProduct.wholesalePrice || selectedProduct.retailPrice)
                      : selectedProduct.retailPrice
                  ).toLocaleString()}
                </Text>
                <Text style={styles.mutedSmall}>
                  Total: RWF {(
                    (saleType === 'wholesale'
                      ? (selectedProduct.wholesalePrice || selectedProduct.retailPrice)
                      : selectedProduct.retailPrice) * (Number(quantity) || 0)
                  ).toLocaleString()}
                </Text>
              </View>
            )}

            <TextInput
              placeholder="Customer Name (optional)"
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              placeholder="Customer Phone (optional)"
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />

            <TouchableOpacity style={[styles.btn, styles.btnGreen, { marginTop: 8 }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Saving...' : 'Record Sale'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGrey, { marginTop: 8 }]} onPress={closeModal}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  addBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  center: { alignItems: 'center', marginTop: 40 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#dc2626' },
  retryBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  retryBtnText: { color: '#fff' },

  cardsRow: { flexDirection: 'row', gap: 12 as any, paddingHorizontal: 16, marginTop: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  cardGreen: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  cardBlue: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },

  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowSub: { color: '#6b7280', marginTop: 2 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 520,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#111827' },
  input: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  inputLabel: { marginTop: 8, color: '#374151', fontWeight: '700' },
  selectorBox: {
    backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 8,
  },
  selectorItem: { paddingVertical: 8, borderBottomColor: '#e5e7eb', borderBottomWidth: StyleSheet.hairlineWidth },
  selectorItemActive: { backgroundColor: '#ecfeff' },
  selectorItemTitle: { fontWeight: '700', color: '#111827' },
  selectorItemSub: { color: '#6b7280' },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999 },
  pillActive: { backgroundColor: '#059669' },
  pillInactive: { backgroundColor: '#e5e7eb' },
  pillText: { color: '#fff', fontWeight: '700' },
  calcBox: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginTop: 8 },
  mutedSmall: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGreen: { backgroundColor: '#059669' },
  btnGrey: { backgroundColor: '#374151' },
});
