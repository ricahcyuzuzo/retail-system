import { useEffect, useState } from 'react';

interface HomeScreenProps {
  apiUrl: string;
  token: string;
}

interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  lowStockItems: number;
}

export default function HomeScreen({ apiUrl, token }: HomeScreenProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalRevenue: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, salesRes, creditSalesRes] = await Promise.all([
          fetch(`${apiUrl}/products`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/sales`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/credit-sales`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        let totalProducts = 0;
        let lowStockItems = 0;
        let totalRevenue = 0;
        
        if (productsRes.ok) {
          const products = await productsRes.json();
          totalProducts = products.length;
          lowStockItems = products.filter((p: any) => p.inventory < 10).length;
        }
        
        if (salesRes.ok) {
          const sales = await salesRes.json();
          // Only count regular sales as revenue (not credit sales)
          totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
        }
        
        if (creditSalesRes.ok) {
          const creditSales = await creditSalesRes.json();
          // Add credit repayments to revenue (totalAmount - outstanding = payments received)
          const creditPayments = creditSales.reduce((sum: number, cs: any) => {
            return sum + (cs.totalAmount - cs.outstanding);
          }, 0);
          totalRevenue += creditPayments;
        }
        
        setStats({ totalProducts, totalRevenue, lowStockItems });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    };
    fetchStats();
  }, [apiUrl, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your retail management system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">RWF {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Product Sales Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Sales</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-300 mb-2">📊</div>
            <p className="text-gray-500">Sales chart coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Revenue: RWF {stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 