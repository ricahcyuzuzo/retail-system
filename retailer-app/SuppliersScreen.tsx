import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

 type Supplier = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
};

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    } as const;
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/suppliers`, { headers });
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSuppliers();
    setRefreshing(false);
  }, [fetchSuppliers]);

  const openAddModal = () => {
    setName(''); setPhone(''); setEmail(''); setAddress(''); setContactPerson('');
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  const handleAddSupplier = useCallback(async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Supplier name is required'); return; }
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const body = JSON.stringify({ name, phone: phone || undefined, email: email || undefined, address: address || undefined, contactPerson: contactPerson || undefined });
      const res = await fetch(`${API_BASE_URL}/suppliers`, { method: 'POST', headers, body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to add supplier');
      }
      closeAddModal();
      fetchSuppliers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add supplier');
    } finally {
      setSaving(false);
    }
  }, [name, phone, email, address, contactPerson, getAuthHeaders, fetchSuppliers]);

  const renderItem = ({ item }: { item: Supplier }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        {!!item.contactPerson && <Text style={styles.rowSub}>Contact: {item.contactPerson}</Text>}
        {!!item.phone && <Text style={styles.rowSub}>Phone: {item.phone}</Text>}
        {!!item.email && <Text style={styles.rowSub}>Email: {item.email}</Text>}
        {!!item.address && <Text style={styles.rowSub}>Address: {item.address}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add Supplier</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading suppliers...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchSuppliers}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 40 }]}>No suppliers</Text>}
        />
      )}

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={closeAddModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Supplier</Text>
            <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName} />
            <TextInput placeholder="Phone" style={styles.input} value={phone} onChangeText={setPhone} />
            <TextInput placeholder="Email" style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextInput placeholder="Address" style={styles.input} value={address} onChangeText={setAddress} />
            <TextInput placeholder="Contact Person" style={styles.input} value={contactPerson} onChangeText={setContactPerson} />
            <TouchableOpacity style={[styles.btn, styles.btnGreen, { marginTop: 8 }]} onPress={handleAddSupplier} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Saving...' : 'Add Supplier'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGrey, { marginTop: 8 }]} onPress={closeAddModal}>
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
    alignItems: 'center',
    gap: 8 as any,
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
