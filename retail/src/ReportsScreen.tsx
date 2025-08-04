import React, { useState, useEffect } from 'react';

interface ReportData {
  revenue: number;
  cost: number;
  profit: number;
  loss: number;
  salesCount: number;
  creditSalesCount: number;
  creditPurchasesCount: number;
  sales: any[];
  creditSales: any[];
  creditPurchases: any[];
}

const apiUrl = 'http://localhost:4000/api';
const token = localStorage.getItem('token');

const tabOptions = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annual', label: 'Annual' },
  { key: 'custom', label: 'Custom' }
];

const ReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (activeTab === 'custom') {
        if (!customRange.start || !customRange.end) {
          setLoading(false);
          return;
        }
        res = await fetch(`${apiUrl}/reports/custom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ startDate: customRange.start, endDate: customRange.end })
        });
      } else {
        res = await fetch(`${apiUrl}/reports/${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (res && res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setError('Failed to fetch report');
      }
    } catch (err) {
      setError('Failed to fetch report');
    }
    setLoading(false);
  };

  const handleCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRange.start && customRange.end) {
      fetchReport();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabOptions.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomRange} className="flex gap-4 p-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={customRange.start}
                onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={customRange.end}
                onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Get Report
            </button>
          </form>
        )}
        {error && <div className="text-red-600 p-4">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : report ? (
          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
                <p className="text-2xl font-bold text-green-700">{report.revenue.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Cost</h3>
                <p className="text-2xl font-bold text-red-700">{report.cost.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Profit</h3>
                <p className="text-2xl font-bold text-blue-700">{report.profit.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Loss</h3>
                <p className="text-2xl font-bold text-orange-700">{report.loss.toLocaleString()} RWF</p>
              </div>
            </div>
            {/* Counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-medium text-gray-500">Sales</h4>
                <p className="text-lg font-bold text-gray-800">{report.salesCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-medium text-gray-500">Credit Sales</h4>
                <p className="text-lg font-bold text-gray-800">{report.creditSalesCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-medium text-gray-500">Credit Purchases</h4>
                <p className="text-lg font-bold text-gray-800">{report.creditPurchasesCount}</p>
              </div>
            </div>
            {/* Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (RWF)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.sales.map((s, i) => (
                    <tr key={`sale-${i}`}>
                      <td className="px-4 py-2 text-green-700">Sale</td>
                      <td className="px-4 py-2">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{s.productName || '-'}</td>
                      <td className="px-4 py-2">{(s.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {report.creditSales.map((cs, i) => (
                    <tr key={`creditsale-${i}`}>
                      <td className="px-4 py-2 text-blue-700">Credit Sale</td>
                      <td className="px-4 py-2">{new Date(cs.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{cs.productName || '-'}</td>
                      <td className="px-4 py-2">{(cs.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {report.creditPurchases.map((cp, i) => (
                    <tr key={`creditpurchase-${i}`}>
                      <td className="px-4 py-2 text-red-700">Credit Purchase</td>
                      <td className="px-4 py-2">{new Date(cp.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{cp.productName || '-'}</td>
                      <td className="px-4 py-2">{(cp.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 text-gray-500">No data available for this period.</div>
        )}
      </div>
    </div>
  );
};

export default ReportsScreen; 