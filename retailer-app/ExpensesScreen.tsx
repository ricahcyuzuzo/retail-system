import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

 type ExpenseCategory = {
  _id: string;
  name: string;
};

 type Expense = {
  _id: string;
  description: string;
  amount: number;
  category: ExpenseCategory | string; // populated or id
  type?: 'business' | 'personal';
  date?: string;
  createdAt: string;
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  // form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'business' | 'personal'>('business');
  const [date, setDate] = useState(''); // YYYY-MM-DD

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
      const [expRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/expenses`, { headers }),
        fetch(`${API_BASE_URL}/expense-categories`, { headers }),
      ]);
      if (!expRes.ok) throw new Error('Failed to fetch expenses');
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      const [expData, catData] = await Promise.all([expRes.json(), catRes.json()]);
      setExpenses(expData);
      setCategories(catData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const openNewModal = () => {
    setEditing(null);
    setDescription(''); setAmount(''); setCategoryId(''); setType('business'); setDate('');
    setShowModal(true);
  };
  const openEditModal = (exp: Expense) => {
    setEditing(exp);
    setDescription(exp.description);
    setAmount(String(exp.amount));
    setCategoryId(typeof exp.category === 'string' ? exp.category : exp.category?._id || '');
    setType(exp.type || 'business');
    setDate(exp.date ? exp.date.toString().slice(0, 10) : '');
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleSave = useCallback(async () => {
    if (!description || !amount || !categoryId) {
      Alert.alert('Validation', 'Description, amount and category are required.');
      return;
    }
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const payload = { description, amount: Number(amount), category: categoryId, type, date: date || undefined };
      let res: Response;
      if (editing) {
        res = await fetch(`${API_BASE_URL}/expenses/${editing._id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API_BASE_URL}/expenses`, { method: 'POST', headers, body: JSON.stringify(payload) });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save expense');
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  }, [description, amount, categoryId, type, date, editing, getAuthHeaders, fetchData]);

  const handleDelete = useCallback(async (exp: Expense) => {
    Alert.alert('Delete', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`${API_BASE_URL}/expenses/${exp._id}`, { method: 'DELETE', headers });
          if (!res.ok) throw new Error('Failed to delete expense');
          fetchData();
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to delete expense');
        }
      }}
    ]);
  }, [getAuthHeaders, fetchData]);

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.description}</Text>
        <Text style={styles.rowSub}>Category: {typeof item.category === 'string' ? (categories.find(c => c._id === item.category)?.name || '-') : item.category?.name}</Text>
        <Text style={styles.rowSub}>Type: {item.type || 'business'} • Date: {item.date ? new Date(item.date).toLocaleDateString() : '-'}</Text>
        <Text style={[styles.rowSub, { fontWeight: '700', color: '#111827' }]}>RWF {item.amount.toLocaleString()}</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={[styles.btnMini, styles.btnBlue]} onPress={() => openEditModal(item)}>
          <Text style={styles.btnMiniText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnMini, styles.btnRed]} onPress={() => handleDelete(item)}>
          <Text style={styles.btnMiniText}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNewModal}>
          <Text style={styles.addBtnText}>+ New Expense</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading expenses...</Text>
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
          data={expenses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 40 }]}>No expenses</Text>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Expense' : 'New Expense'}</Text>
            <TextInput placeholder="Description" style={styles.input} value={description} onChangeText={setDescription} />
            <TextInput placeholder="Amount" style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.selectorBox}>
              {categories.length === 0 ? (
                <Text style={styles.muted}>No categories available</Text>
              ) : (
                <FlatList
                  data={categories}
                  keyExtractor={(c) => c._id}
                  style={{ maxHeight: 160 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.selectorItem, categoryId === item._id && styles.selectorItemActive]}
                      onPress={() => setCategoryId(item._id)}
                    >
                      <Text style={styles.selectorItemTitle}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>

            <Text style={styles.inputLabel}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.pill, type === 'business' ? styles.pillActive : styles.pillInactive]} onPress={() => setType('business')}>
                <Text style={styles.pillText}>Business</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pill, type === 'personal' ? styles.pillActive : styles.pillInactive]} onPress={() => setType('personal')}>
                <Text style={styles.pillText}>Personal</Text>
              </TouchableOpacity>
            </View>

            <TextInput placeholder="Date (YYYY-MM-DD)" style={styles.input} value={date} onChangeText={setDate} />

            <TouchableOpacity style={[styles.btn, styles.btnGreen, { marginTop: 8 }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Add Expense')}</Text>
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
  addBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  center: { alignItems: 'center', marginTop: 40 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#dc2626' },
  retryBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  retryBtnText: { color: '#fff' },

  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 8 as any },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowSub: { color: '#6b7280', marginTop: 2 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '100%', maxWidth: 520 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#111827' },
  input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  inputLabel: { marginTop: 8, color: '#374151', fontWeight: '700' },
  selectorBox: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 8 },
  selectorItem: { paddingVertical: 8, borderBottomColor: '#e5e7eb', borderBottomWidth: StyleSheet.hairlineWidth },
  selectorItemActive: { backgroundColor: '#ecfeff' },
  selectorItemTitle: { fontWeight: '700', color: '#111827' },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999 },
  pillActive: { backgroundColor: '#059669' },
  pillInactive: { backgroundColor: '#e5e7eb' },
  pillText: { color: '#fff', fontWeight: '700' },

  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: 'center', marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGreen: { backgroundColor: '#059669' },
  btnGrey: { backgroundColor: '#374151' },

  btnMini: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  btnMiniText: { color: '#fff', fontWeight: '700' },
  btnBlue: { backgroundColor: '#2563eb' },
  btnRed: { backgroundColor: '#ef4444' },
});
