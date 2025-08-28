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
  inventory: number;
};

 type CreditSale = {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleType: 'retail' | 'wholesale';
  customerName: string;
  customerPhone?: string;
  dueDate: string;
  payments: { amount: number; paidAt: string }[];
  outstanding: number;
  createdAt: string;
};

export default function CreditSalesScreen() {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Credit Sale form
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState(''); // YYYY-MM-DD

  // Payment form
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);
  const [payAmount, setPayAmount] = useState('');

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
        fetch(`${API_BASE_URL}/credit-sales`, { headers }),
        fetch(`${API_BASE_URL}/products`, { headers }),
      ]);
      if (!salesRes.ok) throw new Error('Failed to fetch credit sales');
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const [salesData, productsData] = await Promise.all([salesRes.json(), productsRes.json()]);
      setCreditSales(salesData);
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

  const openSaleModal = () => {
    setProductId('');
    setQuantity('1');
    setSaleType('retail');
    setCustomerName('');
    setCustomerPhone('');
    setDueDate('');
    setShowSaleModal(true);
  };
  const closeSaleModal = () => setShowSaleModal(false);

  const openPayModal = (sale: CreditSale) => {
    setSelectedSale(sale);
    setPayAmount('');
    setShowPayModal(true);
  };
  const closePayModal = () => {
    setSelectedSale(null);
    setPayAmount('');
    setShowPayModal(false);
  };

  const handleRecordCreditSale = useCallback(async () => {
    if (!productId || !quantity || !customerName || !dueDate) {
      Alert.alert('Validation', 'Product, quantity, customer name and due date are required.');
      return;
    }
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const body = JSON.stringify({
        productId,
        quantity: Number(quantity),
        saleType,
        customerName,
        customerPhone: customerPhone || undefined,
        dueDate,
      });
      const res = await fetch(`${API_BASE_URL}/credit-sales`, { method: 'POST', headers, body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to record credit sale');
      }
      closeSaleModal();
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record credit sale');
    } finally {
      setSaving(false);
    }
  }, [productId, quantity, saleType, customerName, customerPhone, dueDate, getAuthHeaders, fetchData]);

  const handleRecordPayment = useCallback(async () => {
    const amountNum = Number(payAmount);
    if (!selectedSale || !amountNum || amountNum <= 0) {
      Alert.alert('Validation', 'Enter a valid payment amount.');
      return;
    }
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/credit-sales/${selectedSale._id}/pay`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ amount: amountNum }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to record payment');
      }
      closePayModal();
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }, [selectedSale, payAmount, getAuthHeaders, fetchData]);

  const totalOutstanding = useMemo(() => creditSales.reduce((sum, s) => sum + (s.outstanding || 0), 0), [creditSales]);
  const totalCreditSales = useMemo(() => creditSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0), [creditSales]);
  const overdueCount = useMemo(() => creditSales.filter(s => new Date(s.dueDate) < new Date() && s.outstanding > 0).length, [creditSales]);

  const renderItem = ({ item }: { item: CreditSale }) => {
    const isPaid = item.outstanding === 0;
    const isOverdue = new Date(item.dueDate) < new Date();
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{item.productName}</Text>
          <Text style={styles.rowSub}>Customer: {item.customerName}</Text>
          <Text style={styles.rowSub}>Date: {new Date(item.createdAt).toLocaleDateString()} • Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          <Text style={styles.rowSub}>Total: RWF {item.totalAmount.toLocaleString()} • Outstanding: RWF {item.outstanding.toLocaleString()}</Text>
          <Text style={[styles.badge, isPaid ? styles.badgeGreen : isOverdue ? styles.badgeRed : styles.badgeYellow]}>
            {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
          </Text>
        </View>
        {!isPaid && (
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => openPayModal(item)}>
            <Text style={styles.btnText}>Record Payment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credit Sales</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openSaleModal}>
          <Text style={styles.addBtnText}>+ New Credit Sale</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardBlue]}>
          <Text style={styles.cardLabel}>Total Credit Sales</Text>
          <Text style={styles.cardValue}>RWF {totalCreditSales.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, styles.cardRed]}>
          <Text style={styles.cardLabel}>Outstanding</Text>
          <Text style={styles.cardValue}>RWF {totalOutstanding.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, styles.cardYellow]}>
          <Text style={styles.cardLabel}>Overdue</Text>
          <Text style={styles.cardValue}>{overdueCount}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading credit sales...</Text>
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
          data={creditSales}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 40 }]}>No credit sales</Text>}
        />
      )}

      {/* New Credit Sale Modal */}
      <Modal visible={showSaleModal} transparent animationType="fade" onRequestClose={closeSaleModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Credit Sale</Text>

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
              placeholder="Customer Name"
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
            <TextInput
              placeholder="Due Date (YYYY-MM-DD)"
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
            />

            <TouchableOpacity style={[styles.btn, styles.btnGreen, { marginTop: 8 }]} onPress={handleRecordCreditSale} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Saving...' : 'Record Credit Sale'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGrey, { marginTop: 8 }]} onPress={closeSaleModal}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="fade" onRequestClose={closePayModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            {selectedSale && (
              <>
                <Text style={styles.muted}>Outstanding: RWF {selectedSale.outstanding.toLocaleString()}</Text>
                <TextInput
                  placeholder="Amount"
                  style={styles.input}
                  keyboardType="numeric"
                  value={payAmount}
                  onChangeText={setPayAmount}
                />
                <TouchableOpacity style={[styles.btn, styles.btnGreen, { marginTop: 8 }]} onPress={handleRecordPayment} disabled={saving}>
                  <Text style={styles.btnText}>{saving ? 'Saving...' : 'Record Payment'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnGrey, { marginTop: 8 }]} onPress={closePayModal}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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
  cardBlue: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  cardRed: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  cardYellow: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },

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
    alignItems: 'center',
    gap: 8 as any,
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowSub: { color: '#6b7280', marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, color: '#fff', overflow: 'hidden' },
  badgeGreen: { backgroundColor: '#10b981' },
  badgeRed: { backgroundColor: '#ef4444' },
  badgeYellow: { backgroundColor: '#f59e0b' },

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
});
