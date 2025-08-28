import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Modal, Alert, Linking, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

 type ProformaItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
};

 type Proforma = {
  _id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'expired';
  validUntil?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
};

 type Pagination = { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };

const STATUSES: Proforma['status'][] = ['draft', 'sent', 'accepted', 'rejected', 'paid', 'expired'];

export default function ProformasScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<Proforma['status'] | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [data, setData] = useState<Proforma[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [showNewModal, setShowNewModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showDetails, setShowDetails] = useState<Proforma | null>(null);

  // New form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [currency, setCurrency] = useState('RWF');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<ProformaItem[]>([]);

  const addItem = () => setItems(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  const updateItem = (idx: number, patch: Partial<ProformaItem>) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const resetNewForm = () => {
    setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setCustomerAddress('');
    setTaxAmount('0'); setDiscountAmount('0'); setCurrency('RWF'); setValidUntil(''); setNotes(''); setTerms('');
    setItems([]);
  };

  const getHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } as const;
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('customerName', search);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await fetch(`${API_BASE_URL}/proformas?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to load proformas');
      const json = await res.json();
      setData(json.proformas || []);
      setPagination(json.pagination || null);
    } catch (e: any) {
      setError(e.message || 'Failed to load proformas');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, statusFilter, search, page, limit]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  }, [fetchList]);

  const openNew = () => { resetNewForm(); setShowNewModal(true); };
  const closeNew = () => setShowNewModal(false);

  const saveProforma = useCallback(async () => {
    if (!customerName || items.length === 0) {
      Alert.alert('Validation', 'Customer name and at least one item are required.');
      return;
    }
    for (const it of items) {
      if (!it.productId || !it.quantity || !it.unitPrice) {
        Alert.alert('Validation', 'Each item needs productId, quantity, and unitPrice.');
        return;
      }
    }
    try {
      setSaving(true);
      const headers = await getHeaders();
      const payload = {
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        items,
        taxAmount: Number(taxAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        currency: currency || 'RWF',
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        terms: terms || undefined,
      };
      const res = await fetch(`${API_BASE_URL}/proformas`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to create proforma');
      }
      closeNew();
      fetchList();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create proforma');
    } finally {
      setSaving(false);
    }
  }, [customerName, customerEmail, customerPhone, customerAddress, items, taxAmount, discountAmount, currency, validUntil, notes, terms, getHeaders, fetchList]);

  const openPDF = useCallback(async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const url = `${API_BASE_URL}/proformas/${id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      Linking.openURL(url);
    } catch {
      Linking.openURL(`${API_BASE_URL}/proformas/${id}/pdf`);
    }
  }, []);

  const emailProforma = useCallback(async (id: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/proformas/${id}/email`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed to queue email');
      Alert.alert('Email', 'Email queued');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send email');
    }
  }, [getHeaders]);

  const updateStatus = useCallback(async (id: string, status: Proforma['status']) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/proformas/${id}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error('Failed to update status');
      fetchList();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update status');
    }
  }, [getHeaders, fetchList]);

  const sendProforma = useCallback(async (id: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/proformas/${id}/send`, { method: 'PUT', headers });
      if (!res.ok) throw new Error('Failed to send proforma');
      fetchList();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send');
    }
  }, [getHeaders, fetchList]);

  const renderRow = ({ item }: { item: Proforma }) => (
    <TouchableOpacity style={styles.row} onPress={() => setShowDetails(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.customerName}</Text>
        <Text style={styles.rowSub}>Status: <Text style={{ fontWeight: '700' }}>{item.status}</Text> • Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={[styles.rowSub, { fontWeight: '700', color: '#111827' }]}>Total: {item.currency || 'RWF'} {item.totalAmount.toLocaleString()}</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={[styles.btnMini, styles.btnGrey]} onPress={() => openPDF(item._id)}>
          <Text style={styles.btnMiniText}>PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Proforma Invoices</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNew}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput placeholder="Search customer" style={[styles.input, { width: 200 }]} value={search} onChangeText={(t) => { setSearch(t); setPage(1); }} />
            <TouchableOpacity style={[styles.pill, !statusFilter ? styles.pillActive : styles.pillInactive]} onPress={() => { setStatusFilter('' as any); setPage(1); }}>
              <Text style={styles.pillText}>All</Text>
            </TouchableOpacity>
            {STATUSES.map(s => (
              <TouchableOpacity key={s} style={[styles.pill, statusFilter === s ? styles.pillActive : styles.pillInactive]} onPress={() => { setStatusFilter(s); setPage(1); }}>
                <Text style={styles.pillText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchList}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={data}
            keyExtractor={(it) => it._id}
            renderItem={renderRow}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 40 }]}>No proformas</Text>}
          />
          {/* Pagination */}
          {pagination && (
            <View style={styles.pagination}>
              <TouchableOpacity style={[styles.btn, styles.btnGrey, { opacity: page <= 1 ? 0.5 : 1 }]} disabled={page <= 1} onPress={() => setPage(p => Math.max(1, p - 1))}><Text style={styles.btnText}>Prev</Text></TouchableOpacity>
              <Text style={{ marginHorizontal: 8 }}>Page {pagination.currentPage} / {pagination.totalPages}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnGrey, { opacity: page >= pagination.totalPages ? 0.5 : 1 }]} disabled={page >= (pagination.totalPages || 1)} onPress={() => setPage(p => p + 1)}><Text style={styles.btnText}>Next</Text></TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* New Proforma Modal */}
      <Modal visible={showNewModal} transparent animationType="fade" onRequestClose={closeNew}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalTitle}>New Proforma</Text>
            <TextInput placeholder="Customer Name" style={styles.input} value={customerName} onChangeText={setCustomerName} />
            <TextInput placeholder="Customer Email" style={styles.input} value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
            <TextInput placeholder="Customer Phone" style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
            <TextInput placeholder="Customer Address" style={styles.input} value={customerAddress} onChangeText={setCustomerAddress} />

            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <TextInput placeholder="Product ID" style={[styles.input, { flex: 1 }]} value={it.productId} onChangeText={(t) => updateItem(idx, { productId: t })} />
                <TextInput placeholder="Qty" style={[styles.input, { width: 80 }]} keyboardType="numeric" value={String(it.quantity)} onChangeText={(t) => updateItem(idx, { quantity: Number(t) || 0 })} />
                <TextInput placeholder="Unit Price" style={[styles.input, { width: 120 }]} keyboardType="numeric" value={String(it.unitPrice)} onChangeText={(t) => updateItem(idx, { unitPrice: Number(t) || 0 })} />
                <TouchableOpacity style={[styles.btnMini, styles.btnRed]} onPress={() => removeItem(idx)}>
                  <Text style={styles.btnMiniText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.btn, styles.btnBlue, { alignSelf: 'flex-start' }]} onPress={addItem}>
              <Text style={styles.btnText}>+ Add Item</Text>
            </TouchableOpacity>

            <TextInput placeholder="Tax Amount" style={styles.input} keyboardType="numeric" value={taxAmount} onChangeText={setTaxAmount} />
            <TextInput placeholder="Discount Amount" style={styles.input} keyboardType="numeric" value={discountAmount} onChangeText={setDiscountAmount} />
            <TextInput placeholder="Currency (e.g., RWF)" style={styles.input} value={currency} onChangeText={setCurrency} />
            <TextInput placeholder="Valid Until (YYYY-MM-DD)" style={styles.input} value={validUntil} onChangeText={setValidUntil} />
            <TextInput placeholder="Notes" style={styles.input} value={notes} onChangeText={setNotes} />
            <TextInput placeholder="Terms" style={styles.input} value={terms} onChangeText={setTerms} />

            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={saveProforma} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Saving…' : 'Create Proforma'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGrey, { marginTop: 8 }]} onPress={closeNew}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={!!showDetails} transparent animationType="fade" onRequestClose={() => setShowDetails(null)}>
        <View style={styles.modalBackdrop}>
          {showDetails && (
            <ScrollView style={styles.modalCard} contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.modalTitle}>Proforma Details</Text>
              <Text style={styles.rowTitle}>{showDetails.customerName}</Text>
              <Text style={styles.rowSub}>Status: {showDetails.status}</Text>
              <Text style={styles.rowSub}>Total: {showDetails.currency || 'RWF'} {showDetails.totalAmount.toLocaleString()}</Text>
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Items</Text>
              {showDetails.items.map((it, idx) => (
                <View key={idx} style={styles.rowItem}>
                  <Text style={styles.rowTitleSmall}>{it.productName || it.productId}</Text>
                  <Text style={styles.rowSub}>Qty: {it.quantity} • Unit: {it.unitPrice.toLocaleString()} • Total: {it.totalPrice.toLocaleString()}</Text>
                </View>
              ))}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGrey]} onPress={() => openPDF(showDetails._id)}>
                  <Text style={styles.btnText}>Open PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={() => emailProforma(showDetails._id)}>
                  <Text style={styles.btnText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => sendProforma(showDetails._id)}>
                  <Text style={styles.btnText}>Mark Sent</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Update Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STATUSES.map(s => (
                  <TouchableOpacity key={s} style={[styles.pill, styles.pillActive]} onPress={() => updateStatus(showDetails._id, s)}>
                    <Text style={styles.pillText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.btn, styles.btnRed, { marginTop: 16 }]} onPress={() => setShowDetails(null)}>
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  addBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  filters: { paddingHorizontal: 16, paddingBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginRight: 8, marginTop: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999, marginLeft: 8, marginTop: 8 },
  pillActive: { backgroundColor: '#374151' },
  pillInactive: { backgroundColor: '#e5e7eb' },
  pillText: { color: '#fff', fontWeight: '700' },

  center: { alignItems: 'center', marginTop: 40 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#dc2626' },
  retryBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  retryBtnText: { color: '#fff' },

  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowTitleSmall: { fontSize: 14, fontWeight: '700', color: '#111827' },
  rowSub: { color: '#6b7280', marginTop: 2 },
  rowItem: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 8, marginTop: 6 },
  // Added missing styles
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },

  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGreen: { backgroundColor: '#059669' },
  btnBlue: { backgroundColor: '#2563eb' },
  btnGrey: { backgroundColor: '#374151' },
  btnRed: { backgroundColor: '#ef4444' },
  btnMini: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  btnMiniText: { color: '#fff', fontWeight: '700' },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 12, gap: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, justifyContent: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#111827' },
});
