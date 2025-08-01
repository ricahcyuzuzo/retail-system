import { useEffect, useState } from 'react';

interface Product {
  _id: string;
  name: string;
  retailPrice: number;
  wholesalePrice?: number;
  inventory: number;
}

interface Sale {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleType: 'retail' | 'wholesale';
  profit: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

interface SalesScreenProps {
  apiUrl: string;
  token: string;
}

export default function SalesScreen({ apiUrl, token }: SalesScreenProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    quantity: 1,
    saleType: 'retail' as 'retail' | 'wholesale',
    customerName: '',
    customerPhone: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, productsRes] = await Promise.all([
        fetch(`${apiUrl}/sales`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      if (!salesRes.ok) throw new Error('Failed to fetch sales');
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      
      const [salesData, productsData] = await Promise.all([
        salesRes.json(),
        productsRes.json()
      ]);
      
      setSales(salesData);
      setProducts(productsData);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const openModal = () => {
    setForm({
      productId: '',
      quantity: 1,
      saleType: 'retail',
      customerName: '',
      customerPhone: ''
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
      customerPhone: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: name === 'quantity' ? Number(value) : value 
    }));
  };

  const handleSubmit = async () => {
    if (!form.productId || form.quantity < 1) {
      setError('Please select a product and enter quantity');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to record sale');
      }
      
      closeModal();
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const selectedProduct = products.find(p => p._id === form.productId);
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading sales...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Sales Management</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
          onClick={openModal}
        >
          + Record Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">RWF {totalSales.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">RWF {totalProfit.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sales History */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Sales History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Quantity</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Total</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Profit</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">{sale.productName}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.saleType === 'retail' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {sale.saleType}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{sale.quantity}</td>
                  <td className="py-4 px-6 text-gray-600">RWF {sale.unitPrice.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-600">RWF {sale.totalAmount.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-600">RWF {sale.profit.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-600">{sale.customerName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={closeModal}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Record New Sale</h3>
            
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name (Optional)</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
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
            </div>

            <button
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg shadow-lg"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Recording Sale...' : 'Record Sale'}
            </button>
            {error && <div className="text-red-500 text-center mt-4">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 