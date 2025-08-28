import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

type DashboardStats = {
  totalProducts: number;
  totalRevenue: number;
  lowStockItems: number;
};

const HomeScreen: React.FC = () => {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalProducts: 0,
    totalRevenue: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` } as const;
      const [productsRes, salesRes, creditSalesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/products`, { headers }),
        fetch(`${API_BASE_URL}/sales`, { headers }),
        fetch(`${API_BASE_URL}/credit-sales`, { headers }),
      ]);

      let totalProducts = 0;
      let lowStockItems = 0;
      let totalRevenue = 0;

      if (productsRes.ok) {
        const products = await productsRes.json();
        totalProducts = products.length;
        lowStockItems = products.filter((p: any) => (p.inventory ?? 0) < 10).length;
      }

      if (salesRes.ok) {
        const sales = await salesRes.json();
        totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      }

      if (creditSalesRes.ok) {
        const creditSales = await creditSalesRes.json();
        const creditPayments = creditSales.reduce((sum: number, cs: any) => sum + ((cs.totalAmount || 0) - (cs.outstanding || 0)), 0);
        totalRevenue += creditPayments;
      }

      setStats({ totalProducts, totalRevenue, lowStockItems });
    } catch (e: any) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.muted}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome to your retail management system</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardBlue]}>
          <Text style={styles.cardLabel}>Total Products</Text>
          <Text style={styles.cardValue}>{stats.totalProducts.toLocaleString()}</Text>
        </View>

        <View style={[styles.card, styles.cardGreen]}>
          <Text style={styles.cardLabel}>Total Revenue</Text>
          <Text style={styles.cardValue}>RWF {stats.totalRevenue.toLocaleString()}</Text>
        </View>

        <View style={[styles.card, styles.cardRed]}>
          <Text style={styles.cardLabel}>Low Stock Items</Text>
          <Text style={styles.cardValue}>{stats.lowStockItems}</Text>
        </View>
      </View>

      <View style={styles.placeholderChart}>
        <Text style={styles.chartEmoji}>📊</Text>
        <Text style={styles.muted}>Sales chart coming soon</Text>
        <Text style={styles.mutedSmall}>Revenue: RWF {stats.totalRevenue.toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12 as any,
    marginTop: 12,
    marginBottom: 16,
  },
  card: {
    width: '48%',
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
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  cardRed: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  placeholderChart: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  chartEmoji: {
    fontSize: 36,
    color: '#d1d5db',
    marginBottom: 4,
  },
  muted: {
    color: '#6b7280',
  },
  mutedSmall: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    color: '#dc2626',
    marginHorizontal: 16,
    marginBottom: 8,
  },
});

export default HomeScreen;
