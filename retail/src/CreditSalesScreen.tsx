/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import Pagination from './components/Pagination';
import CustomersScreen from './CustomersScreen';

interface Product {
  _id: string;
  name: string;
  retailPrice: number;
  wholesalePrice?: number;
  inventory: number;
}

interface CreditSale {
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
}

interface CreditSalesScreenProps {
  apiUrl: string;
  token: string;
}

export default function CreditSalesScreen({ apiUrl, token }: CreditSalesScreenProps) {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'customers'>('sales');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    productId: '',
    quantity: 1,
    saleType: 'retail' as 'retail' | 'wholesale',
    customerName: '',
    customerPhone: '',
    dueDate: ''
  });
  const [payForm, setPayForm] = useState({
    saleId: '',
    amount: 0
  });
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, productsRes] = await Promise.all([
        fetch(`${apiUrl}/credit-sales`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/products`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (!salesRes.ok) {
        const errorText = await salesRes.text();
        console.error('Sales error:', errorText);
        throw new Error('Failed to fetch credit sales');
      }
      if (!productsRes.ok) {
        const errorText = await productsRes.text();
        console.error('Products error:', errorText);
        throw new Error('Failed to fetch products');
      }
      
      const [salesData, productsData] = await Promise.all([
        salesRes.json(),
        productsRes.json()
      ]);
      
      setCreditSales(salesData);
      setProducts(productsData);
    } catch (e: any) {
      console.error('Fetch error:', e);
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(creditSales.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [creditSales, pageSize]);

  const openModal = () => {
    setForm({
      productId: '',
      quantity: 1,
      saleType: 'retail',
      customerName: '',
      customerPhone: '',
      dueDate: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({
      productId: '',
      quantity: 1,
      saleType: 'retail',
      customerName: '',
      customerPhone: '',
      dueDate: ''
    });
  };

  const openPayModal = (sale: CreditSale) => {
    setSelectedSale(sale);
    setPayForm({ saleId: sale._id, amount: 0 });
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedSale(null);
    setPayForm({ saleId: '', amount: 0 });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'quantity' ? Number(value) : value }));
  };

  const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayForm((f) => ({ ...f, [name]: Number(value) }));
  };

  const handleSubmit = async () => {
    if (!form.productId || form.quantity < 1 || !form.customerName || !form.dueDate) {
      setError('Please fill all required fields');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/credit-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to record credit sale');
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handlePay = async () => {
    if (!payForm.saleId || payForm.amount <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/credit-sales/${payForm.saleId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: payForm.amount }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }
      closePayModal();
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const selectedProduct = products.find(p => p._id === form.productId);
  const totalOutstanding = creditSales.reduce((sum, sale) => sum + sale.outstanding, 0);
  const totalCreditSales = creditSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const overdueSales = creditSales.filter(sale => new Date(sale.dueDate) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading credit sales...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Credit Sales Management</h2>
        {activeTab === 'sales' && (
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
            onClick={openModal}
          >
            + New Credit Sale
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sales'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Credit Sales
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers on Credit
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Credit Sales</p>
                  <p className="text-2xl font-bold text-gray-900">RWF {totalCreditSales.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                  <p className="text-2xl font-bold text-gray-900">RWF {totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{creditSales.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueSales.length}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Sales Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Credit Sales History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Due Date</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Outstanding</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {creditSales
                    .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
                    .map((sale) => {
                    const isOverdue = new Date(sale.dueDate) < new Date();
                    const isPaid = sale.outstanding === 0;
                    return (
                      <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 font-medium text-gray-900">{sale.productName}</td>
                        <td className="py-4 px-6 text-gray-600">{sale.customerName}</td>
                        <td className="py-4 px-6 text-gray-600">{new Date(sale.dueDate).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-gray-600">RWF {sale.totalAmount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-gray-600">RWF {sale.outstanding.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          {isPaid ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {!isPaid && (
                            <button
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                              onClick={() => openPayModal(sale)}
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              total={creditSales.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        </>
      ) : (
        <CustomersScreen apiUrl={apiUrl} token={token} />
      )}

      {/* Record Credit Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={closeModal}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Record Credit Sale</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} (Stock: {product.inventory})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  name="saleType"
                  value={form.saleType}
                  onChange={handleChange}
                >
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  max={selectedProduct?.inventory || 1}
                  required
                />
              </div>
              {selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Unit Price: RWF {form.saleType === 'wholesale' 
                      ? (selectedProduct.wholesalePrice || selectedProduct.retailPrice).toLocaleString()
                      : selectedProduct.retailPrice.toLocaleString()
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: RWF {((form.saleType === 'wholesale' 
                      ? (selectedProduct.wholesalePrice || selectedProduct.retailPrice) 
                      : selectedProduct.retailPrice) * form.quantity).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  required
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone (Optional)</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="text"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="Customer phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Due Date</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg shadow-lg"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Record Credit Sale'}
            </button>
            {error && <div className="text-red-500 text-center mt-4">{error}</div>}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={closePayModal}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Outstanding Balance</label>
                <div className="bg-gray-50 p-3 rounded-lg text-gray-800 font-semibold">
                  RWF {selectedSale.outstanding.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="number"
                  name="amount"
                  value={payForm.amount}
                  onChange={handlePayChange}
                  min="1"
                  max={selectedSale.outstanding}
                  required
                />
              </div>
            </div>
            <button
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg shadow-lg"
              onClick={handlePay}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
            {error && <div className="text-red-500 text-center mt-4">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 