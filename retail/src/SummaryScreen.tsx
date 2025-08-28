/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import Pagination from './components/Pagination';

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
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annual', label: 'Annual' },
  { key: 'custom', label: 'Custom' }
];

const SummaryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let res:
        | Response
        | undefined;
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
        setError('Failed to fetch summary');
      }
    } catch (err) {
      setError('Failed to fetch summary');
    }
    setLoading(false);
  };

  const combinedRows = report
    ? [
        ...report.sales.map((s) => ({
          type: 'Sale',
          createdAt: s.createdAt,
          productName: s.productName || '-',
          amount: s.totalAmount || 0,
        })),
        ...report.creditSales.map((cs) => ({
          type: 'Credit Sale',
          createdAt: cs.createdAt,
          productName: cs.productName || '-',
          amount: cs.totalAmount || 0,
        })),
        ...report.creditPurchases.map((cp) => ({
          type: 'Credit Purchase',
          createdAt: cp.createdAt,
          productName: cp.productName || '-',
          amount: cp.totalAmount || 0,
        })),
      ]
    : [];
  const total = combinedRows.length;
  const startIndex = (page - 1) * pageSize;
  const rowsToShow = combinedRows.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [total, pageSize, page]);

  const handleCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRange.start && customRange.end) {
      fetchReport();
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setError('');
      let url = '';
      let init: RequestInit = {
        headers: { Authorization: `Bearer ${token}` }
      };
      if (activeTab === 'custom') {
        if (!customRange.start || !customRange.end) {
          setError('Select start and end date for custom summary');
          return;
        }
        url = `${apiUrl}/reports/custom/pdf`;
        init = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ startDate: customRange.start, endDate: customRange.end })
        };
      } else {
        url = `${apiUrl}/reports/${activeTab}/pdf`;
      }
      const res = await fetch(url, init);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to download PDF');
      }
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      const serverName = match ? decodeURIComponent(match[1] || match[2] || '') : '';
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const fallback = `summary-${activeTab}-${ts}.pdf`;
      a.download = serverName || fallback;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      setError(err?.message || 'Failed to download PDF');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Summary</h1>
        <button
          onClick={handleDownloadPdf}
          disabled={loading || (activeTab === 'custom' && (!customRange.start || !customRange.end))}
          className={`px-4 py-2 rounded-md text-white ${
            loading || (activeTab === 'custom' && (!customRange.start || !customRange.end))
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Download PDF
        </button>
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
              Get Summary
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
                  {rowsToShow.map((row, i) => {
                    const typeClass = row.type === 'Sale' ? 'text-green-700' : row.type === 'Credit Sale' ? 'text-blue-700' : 'text-red-700';
                    return (
                      <tr key={`row-${startIndex + i}`}>
                        <td className={`px-4 py-2 ${typeClass}`}>{row.type}</td>
                        <td className="px-4 py-2">{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{row.productName}</td>
                        <td className="px-4 py-2">{row.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        ) : (
          <div className="p-6 text-gray-500">No data available for this period.</div>
        )}
      </div>
    </div>
  );
};

export default SummaryScreen;
