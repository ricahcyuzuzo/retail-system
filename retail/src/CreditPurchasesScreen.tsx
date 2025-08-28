import React, { useState, useEffect } from 'react';
import Pagination from './components/Pagination';

interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}

interface CreditPurchase {
  _id: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  dueDate: string;
  outstanding: number;
  payments: Array<{ amount: number; paidAt: string }>;
  notes?: string;
  createdAt: string;
}

const CreditPurchasesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [creditPurchases, setCreditPurchases] = useState<CreditPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesPageSize, setPurchasesPageSize] = useState(10);
  const [suppliersPage, setSuppliersPage] = useState(1);
  const [suppliersPageSize, setSuppliersPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CreditPurchase | null>(null);
  const [formData, setFormData] = useState({
    supplierId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    dueDate: '',
    notes: ''
  });
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const apiUrl = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  // Keep pages in bounds
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(creditPurchases.length / purchasesPageSize));
    if (purchasesPage > totalPages) setPurchasesPage(totalPages);
  }, [creditPurchases, purchasesPageSize, purchasesPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(suppliers.length / suppliersPageSize));
    if (suppliersPage > totalPages) setSuppliersPage(totalPages);
  }, [suppliers, suppliersPageSize, suppliersPage]);

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes] = await Promise.all([
        fetch(`${apiUrl}/credit-purchases`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (purchasesRes.ok) {
        const purchases = await purchasesRes.json();
        setCreditPurchases(purchases);
      }

      if (suppliersRes.ok) {
        const suppliers = await suppliersRes.json();
        setSuppliers(suppliers);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/credit-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ supplierId: '', productName: '', quantity: 1, unitPrice: 0, dueDate: '', notes: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to add credit purchase:', error);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    setPaymentError('');
    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      paymentAmount > (selectedPurchase?.outstanding ?? 0)
    ) {
      setPaymentError('Enter an amount greater than 0 and not exceeding the outstanding balance.');
      return;
    }

    try {
      setPaymentSaving(true);
      const response = await fetch(`${apiUrl}/credit-purchases/${selectedPurchase._id}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: paymentAmount })
      });

      if (!response.ok) {
        // Try to extract error message
        let message = 'Failed to record payment.';
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        setPaymentError(message);
        return;
      }

      setShowPaymentModal(false);
      setSelectedPurchase(null);
      setPaymentAmount(0);
      fetchData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      setPaymentError('Network error while saving payment.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const getStatus = (purchase: CreditPurchase) => {
    if (purchase.outstanding === 0) return { text: 'Paid', color: 'text-green-600 bg-green-100' };
    if (new Date(purchase.dueDate) < new Date()) return { text: 'Overdue', color: 'text-red-600 bg-red-100' };
    return { text: 'Pending', color: 'text-yellow-600 bg-yellow-100' };
  };

  const totalOutstanding = creditPurchases.reduce((sum, p) => sum + p.outstanding, 0);
  const totalPurchases = creditPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPayments = creditPurchases.reduce((sum, p) => sum + p.payments.reduce((pSum, payment) => pSum + payment.amount, 0), 0);
  const overduePurchases = creditPurchases.filter(p => new Date(p.dueDate) < new Date() && p.outstanding > 0).length;
  const purchasesStart = (purchasesPage - 1) * purchasesPageSize;
  const paginatedPurchases = creditPurchases.slice(purchasesStart, purchasesStart + purchasesPageSize);
  const suppliersStart = (suppliersPage - 1) * suppliersPageSize;
  const paginatedSuppliers = suppliers.slice(suppliersStart, suppliersStart + suppliersPageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Credit Purchases</h1>
        {activeTab === 'purchases' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Credit Purchase
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {activeTab === 'purchases' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Total Credit Purchases</h3>
            <p className="text-2xl font-bold text-gray-900">{totalPurchases.toLocaleString()} RWF</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Outstanding Amount</h3>
            <p className="text-2xl font-bold text-red-600">{totalOutstanding.toLocaleString()} RWF</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
            <p className="text-2xl font-bold text-green-600">{totalPayments.toLocaleString()} RWF</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Overdue Purchases</h3>
            <p className="text-2xl font-bold text-orange-600">{overduePurchases}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'purchases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Credit Purchases
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'suppliers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suppliers
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'purchases' && (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPurchases.map((purchase) => {
                    const status = getStatus(purchase);
                    return (
                      <tr key={purchase._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{purchase.supplierName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.unitPrice.toLocaleString()} RWF</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.totalAmount.toLocaleString()} RWF</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.outstanding.toLocaleString()} RWF</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(purchase.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {purchase.outstanding > 0 && (
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setPaymentAmount(purchase.outstanding);
                                setPaymentError('');
                                setShowPaymentModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Pay
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
              total={creditPurchases.length}
              page={purchasesPage}
              pageSize={purchasesPageSize}
              onPageChange={setPurchasesPage}
              onPageSizeChange={(s) => {
                setPurchasesPageSize(s);
                setPurchasesPage(1);
              }}
            />
            </>
          )}

          {activeTab === 'suppliers' && (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSuppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contactPerson || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              total={suppliers.length}
              page={suppliersPage}
              pageSize={suppliersPageSize}
              onPageChange={setSuppliersPage}
              onPageSizeChange={(s) => {
                setSuppliersPageSize(s);
                setSuppliersPage(1);
              }}
            />
            </>
          )}
        </div>
      </div>

      {/* Add Credit Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Record Credit Purchase</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (RWF) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                >
                  Record Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Supplier: {selectedPurchase.supplierName}</p>
              <p className="text-sm text-gray-600">Product: {selectedPurchase.productName}</p>
              <p className="text-sm text-gray-600">Outstanding: {selectedPurchase.outstanding.toLocaleString()} RWF</p>
            </div>
            <form >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (RWF) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedPurchase.outstanding}
                  step="100"
                  value={paymentAmount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPaymentAmount(Number.isFinite(v) ? v : 0);
                    if (paymentError) setPaymentError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {paymentError && (
                  <p className="mt-2 text-sm text-red-600">{paymentError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={paymentSaving}
                  onClick={handlePayment}
                  className={`flex-1 py-2 px-4 rounded-md text-white ${paymentSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {paymentSaving ? 'Saving…' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPurchase(null);
                    setPaymentAmount(0);
                    setPaymentError('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreditPurchasesScreen;