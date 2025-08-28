import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

 type Report = {
  revenue: number;
  cost: number;
  profit: number;
  loss: number;
  salesCount: number;
  creditSalesCount: number;
  creditPurchasesCount: number;
  sales?: any[];
  creditSales?: any[];
  creditPurchases?: any[];
};

type PeriodKey = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';
type ListKey = 'sales' | 'creditSales' | 'creditPurchases';

export default function ReportsScreen() {
  const [period, setPeriod] = useState<PeriodKey>('daily');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [listKey, setListKey] = useState<ListKey>('sales');

  // Custom dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    } as const;
  }, []);

  const fetchReport = useCallback(async (p: PeriodKey) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      let res: Response;
      if (p === 'custom') {
        if (!startDate || !endDate) {
          setLoading(false);
          setReport(null);
          return;
        }
        res = await fetch(`${API_BASE_URL}/reports/custom`, { method: 'POST', headers, body: JSON.stringify({ startDate, endDate }) });
      } else {
        res = await fetch(`${API_BASE_URL}/reports/${p}`, { headers });
      }
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, startDate, endDate]);

  useEffect(() => { fetchReport(period); }, [fetchReport, period]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReport(period);
    setRefreshing(false);
  }, [fetchReport, period]);

  const card = (label: string, value: string | number, style?: any) => (
    <View style={[styles.card, style]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{typeof value === 'number' ? value : value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}> 
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Summary</Text>
      </View>

      <View style={styles.periodRow}>
        {(['daily','weekly','monthly','annual','custom'] as PeriodKey[]).map(p => (
          <TouchableOpacity key={p} style={[styles.pill, period === p ? styles.pillActive : styles.pillInactive]} onPress={() => setPeriod(p)}>
            <Text style={styles.pillText}>{p[0].toUpperCase() + p.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {period === 'custom' && (
        <View style={styles.customBox}>
          <TextInput placeholder="Start Date (YYYY-MM-DD)" style={styles.input} value={startDate} onChangeText={setStartDate} />
          <TextInput placeholder="End Date (YYYY-MM-DD)" style={styles.input} value={endDate} onChangeText={setEndDate} />
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => fetchReport('custom')}>
            <Text style={styles.btnText}>Run</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator />
          <Text style={styles.muted}>Loading report...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchReport(period)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : report ? (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.cardsRow}>
            {card('Revenue', `RWF ${(report.revenue || 0).toLocaleString()}`, styles.cardGreen)}
            {card('Cost', `RWF ${(report.cost || 0).toLocaleString()}`, styles.cardRed)}
          </View>
          <View style={styles.cardsRow}>
            {card('Profit', `RWF ${(report.profit || 0).toLocaleString()}`, styles.cardBlue)}
            {card('Loss', `RWF ${(report.loss || 0).toLocaleString()}`, styles.cardYellow)}
          </View>
          <View style={styles.cardsRow}>
            {card('Sales', report.salesCount || 0)}
            {card('Credit Sales', report.creditSalesCount || 0)}
            {card('Credit Purchases', report.creditPurchasesCount || 0)}
          </View>
          {/* List selector */}
          <View style={[styles.cardsRow, { marginTop: 4 }]}>
            {(['sales','creditSales','creditPurchases'] as ListKey[]).map(k => (
              <TouchableOpacity key={k} style={[styles.pill, listKey === k ? styles.pillActive : styles.pillInactive]} onPress={() => setListKey(k)}>
                <Text style={styles.pillText}>{k === 'creditPurchases' ? 'Credit Purchases' : k === 'creditSales' ? 'Credit Sales' : 'Sales'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Items list */}
          <View style={{ marginTop: 8 }}>
            <FlatList
              data={(listKey === 'sales' ? (report.sales || []) : listKey === 'creditSales' ? (report.creditSales || []) : (report.creditPurchases || []))}
              keyExtractor={(item, idx) => item._id || String(idx)}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{
                      item.description || item.note || item.productName || item.product?.name || 'Item'
                    }</Text>
                    <Text style={styles.rowSub}>
                      {item.customer?.name || item.supplier?.name || item.customerName || item.supplierName || '-'}
                    </Text>
                    <Text style={styles.rowSub}>
                      Qty: {item.quantity ?? item.qty ?? '-'} • Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : (item.date ? new Date(item.date).toLocaleDateString() : '-')}
                    </Text>
                    <Text style={[styles.rowSub, { fontWeight: '700', color: '#111827' }]}>
                      RWF {(item.totalAmount ?? item.amount ?? 0).toLocaleString()} {typeof item.outstanding === 'number' ? ` • Outstanding: RWF ${item.outstanding.toLocaleString()}` : ''}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginVertical: 12 }]}>No items</Text>}
            />
          </View>
        </View>
      ) : (
        <Text style={[styles.muted, { marginLeft: 16, marginTop: 12 }]}>No data</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },

  periodRow: { flexDirection: 'row', gap: 8 as any, paddingHorizontal: 16, marginTop: 8, flexWrap: 'wrap' },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999 },
  pillActive: { backgroundColor: '#059669' },
  pillInactive: { backgroundColor: '#e5e7eb' },
  pillText: { color: '#fff', fontWeight: '700' },

  center: { alignItems: 'center', marginTop: 40 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#dc2626' },
  retryBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  retryBtnText: { color: '#fff' },

  cardsRow: { flexDirection: 'row', gap: 12 as any, marginTop: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  cardGreen: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  cardRed: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  cardBlue: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  cardYellow: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },

  customBox: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  input: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: 'center', marginTop: 8, alignSelf: 'flex-start' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGreen: { backgroundColor: '#059669' },

  row: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowSub: { color: '#6b7280', marginTop: 2 },
});
