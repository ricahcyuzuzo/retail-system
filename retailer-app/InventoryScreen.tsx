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
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

type Product = {
  _id: string;
  name: string;
  barcode?: string;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  inventory: number;
};

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [inventory, setInventory] = useState('');

  const resetForm = () => {
    setName('');
    setBarcode('');
    setPurchasePrice('');
    setRetailPrice('');
    setWholesalePrice('');
    setInventory('');
  };

  const openAddModal = () => {
    setEditProduct(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setName(p.name);
    setBarcode(p.barcode || '');
    setPurchasePrice(String(p.purchasePrice));
    setRetailPrice(String(p.retailPrice));
    setWholesalePrice(p.wholesalePrice != null ? String(p.wholesalePrice) : '');
    setInventory(String(p.inventory));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProduct(null);
    resetForm();
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    } as const;
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/products`, { headers });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const handleSave = useCallback(async () => {
    if (!name || !purchasePrice || !retailPrice || !inventory) {
      Alert.alert('Validation', 'Name, Purchase Price, Retail Price and Inventory are required.');
      return;
    }
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const method = editProduct ? 'PUT' : 'POST';
      const url = editProduct
        ? `${API_BASE_URL}/products/${editProduct._id}`
        : `${API_BASE_URL}/products`;
      const body = JSON.stringify({
        name,
        barcode: barcode || undefined,
        purchasePrice: Number(purchasePrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
        inventory: Number(inventory) || 0,
      });
      const res = await fetch(url, { method, headers, body });
      if (!res.ok) throw new Error('Failed to save product');
      closeModal();
      fetchProducts();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }, [name, barcode, purchasePrice, retailPrice, wholesalePrice, inventory, editProduct, fetchProducts]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Confirm', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error('Failed to delete product');
            fetchProducts();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete product');
          }
        }
      }
    ]);
  }, [fetchProducts]);

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowSub}>Barcode: {item.barcode || '-'}</Text>
        <Text style={styles.rowSub}>Inventory: {item.inventory}</Text>
        <Text style={styles.rowSub}>Retail: RWF {item.retailPrice.toLocaleString()}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={() => openEditModal(item)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={() => handleDelete(item._id)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator />
          <Text style={styles.muted}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}> 
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 40 }]}>No products</Text>}
        />
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editProduct ? 'Edit Product' : 'Add Product'}</Text>

            <TextInput
              placeholder="Product Name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Barcode"
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
            />
            <TextInput
              placeholder="Purchase Price (RWF)"
              style={styles.input}
              keyboardType="numeric"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
            />
            <TextInput
              placeholder="Retail Price (RWF)"
              style={styles.input}
              keyboardType="numeric"
              value={retailPrice}
              onChangeText={setRetailPrice}
            />
            <TextInput
              placeholder="Wholesale Price (RWF)"
              style={styles.input}
              keyboardType="numeric"
              value={wholesalePrice}
              onChangeText={setWholesalePrice}
            />
            <TextInput
              placeholder="Inventory Quantity"
              style={styles.input}
              keyboardType="numeric"
              value={inventory}
              onChangeText={setInventory}
            />

            <TouchableOpacity style={[styles.btn, styles.btnGreen, { marginTop: 8 }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Saving...' : (editProduct ? 'Update' : 'Add')}</Text>
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
  rowActions: { justifyContent: 'space-between' },

  btn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnBlue: { backgroundColor: '#2563eb' },
  btnRed: { backgroundColor: '#dc2626' },
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
    maxWidth: 480,
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
});
