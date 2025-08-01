import { useEffect, useState } from 'react';

interface Product {
  _id: string;
  name: string;
  barcode?: string;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  inventory: number;
}

interface ProductsScreenProps {
  apiUrl: string;
  token: string;
}

export default function ProductsScreen({ apiUrl, token }: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      setProducts(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const openAddModal = () => {
    setEditProduct(null);
    setForm({});
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setForm(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProduct(null);
    setForm({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name.includes('Price') || name === 'inventory' ? Number(value) : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const method = editProduct ? 'PUT' : 'POST';
      const url = editProduct ? `${apiUrl}/products/${editProduct._id}` : `${apiUrl}/products`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save product');
      closeModal();
      fetchProducts();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete product');
      fetchProducts();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Inventory</h2>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
          onClick={openAddModal}
        >
          + Add Product
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-lg text-gray-600">Loading products...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Barcode</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Purchase Price</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Retail Price</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Wholesale Price</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Inventory</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{p.name}</td>
                    <td className="py-4 px-6 text-gray-600">{p.barcode || '-'}</td>
                    <td className="py-4 px-6 text-gray-600">RWF {p.purchasePrice.toLocaleString()}</td>
                    <td className="py-4 px-6 text-gray-600">RWF {p.retailPrice.toLocaleString()}</td>
                    <td className="py-4 px-6 text-gray-600">{p.wholesalePrice ? `RWF ${p.wholesalePrice.toLocaleString()}` : '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{p.inventory}</td>
                    <td className="py-4 px-6 space-x-2">
                      <button
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                        onClick={() => openEditModal(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                        onClick={() => handleDelete(p._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={closeModal}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">{editProduct ? 'Edit Product' : 'Add Product'}</h3>
            <div className="space-y-4">
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Product Name"
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                required
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Barcode"
                name="barcode"
                value={form.barcode || ''}
                onChange={handleChange}
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Purchase Price (RWF)"
                name="purchasePrice"
                type="number"
                value={form.purchasePrice || ''}
                onChange={handleChange}
                required
                min={0}
                step={100}
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Retail Price (RWF)"
                name="retailPrice"
                type="number"
                value={form.retailPrice || ''}
                onChange={handleChange}
                required
                min={0}
                step={100}
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Wholesale Price (RWF)"
                name="wholesalePrice"
                type="number"
                value={form.wholesalePrice || ''}
                onChange={handleChange}
                min={0}
                step={100}
              />
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Inventory Quantity"
                name="inventory"
                type="number"
                value={form.inventory || ''}
                onChange={handleChange}
                required
                min={0}
                step={1}
              />
            </div>
            <button
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg shadow-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : (editProduct ? 'Update Product' : 'Add Product')}
            </button>
            {error && <div className="text-red-500 text-center mt-4">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 