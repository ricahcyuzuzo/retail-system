import { useEffect, useState } from 'react';

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

interface CustomerBalance {
  customerName: string;
  customerPhone?: string;
  totalOutstanding: number;
  totalCreditSales: number;
  totalPayments: number;
  creditSales: CreditSale[];
}

interface CustomersScreenProps {
  apiUrl: string;
  token: string;
}

export default function CustomersScreen({ apiUrl, token }: CustomersScreenProps) {
  const [customers, setCustomers] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/credit-sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Credit sales error:', errorText);
        throw new Error('Failed to fetch credit sales');
      }
      
      const creditSales: CreditSale[] = await res.json();
      
      // Group by customer
      const customerMap = new Map<string, CustomerBalance>();
      
      creditSales.forEach(sale => {
        if (!customerMap.has(sale.customerName)) {
          customerMap.set(sale.customerName, {
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            totalOutstanding: 0,
            totalCreditSales: 0,
            totalPayments: 0,
            creditSales: []
          });
        }
        
        const customer = customerMap.get(sale.customerName)!;
        customer.totalCreditSales += sale.totalAmount;
        customer.totalOutstanding += sale.outstanding;
        customer.totalPayments += sale.totalAmount - sale.outstanding;
        customer.creditSales.push(sale);
      });
      
      setCustomers(Array.from(customerMap.values()));
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

  const openCustomerDetails = (customer: CustomerBalance) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const closeCustomerDetails = () => {
    setShowDetails(false);
    setSelectedCustomer(null);
  };

  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.totalOutstanding, 0);
  const totalCreditSales = customers.reduce((sum, customer) => sum + customer.totalCreditSales, 0);
  const totalPayments = customers.reduce((sum, customer) => sum + customer.totalPayments, 0);
  const totalProfit = totalCreditSales - totalPayments; // Simplified profit calculation

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Customer Credit Management</h2>
      </div>

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
              <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">RWF {totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">RWF {totalPayments.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">RWF {totalProfit.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Customer Credit Balances</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Credit Sales</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Payments</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Outstanding</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.customerName} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{customer.customerName}</td>
                  <td className="py-4 px-6 text-gray-600">{customer.customerPhone || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">RWF {customer.totalCreditSales.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-600">RWF {customer.totalPayments.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-600">RWF {customer.totalOutstanding.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    {customer.totalOutstanding === 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid Up
                      </span>
                    ) : customer.totalOutstanding > customer.totalCreditSales * 0.5 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Risk
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Outstanding
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                      onClick={() => openCustomerDetails(customer)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={closeCustomerDetails}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              {selectedCustomer.customerName} - Credit Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Credit Sales</p>
                <p className="text-lg font-semibold text-gray-900">RWF {selectedCustomer.totalCreditSales.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-lg font-semibold text-gray-900">RWF {selectedCustomer.totalPayments.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-lg font-semibold text-gray-900">RWF {selectedCustomer.totalOutstanding.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800">Credit History</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Due Date</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Outstanding</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedCustomer.creditSales.map((sale) => {
                      const isOverdue = new Date(sale.dueDate) < new Date();
                      const isPaid = sale.outstanding === 0;
                      return (
                        <tr key={sale._id}>
                          <td className="py-3 px-4 text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{sale.productName}</td>
                          <td className="py-3 px-4 text-gray-600">RWF {sale.totalAmount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{new Date(sale.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-gray-600">RWF {sale.outstanding.toLocaleString()}</td>
                          <td className="py-3 px-4">
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 