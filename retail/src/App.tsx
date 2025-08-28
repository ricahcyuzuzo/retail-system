import { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import WaitingForApprovalScreen from './WaitingForApprovalScreen';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import ProductsScreen from './ProductsScreen';
import HomeScreen from './HomeScreen';
import SalesScreen from './SalesScreen';
import CreditSalesScreen from './CreditSalesScreen';
import CreditPurchasesScreen from './CreditPurchasesScreen';
import SuppliersScreen from './SuppliersScreen';
import ReportsScreen from './ReportsScreen';
import ExpensesScreen from './ExpensesScreen';
import ProformaInvoicesScreen from './ProformaInvoicesScreen';
import SummaryScreen from './SummaryScreen';

const API_URL = 'http://localhost:4000/api';

function Navigation({ token, onLogout }: { token: string; onLogout: () => void }) {
  const location = useLocation();
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Retail</h1>
          </div>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</span>
          </div>
          
          <Link
            to="/"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Dashboard
          </Link>
          
          <Link
            to="/inventory"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/inventory' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Inventory
          </Link>
          
          <Link
            to="/sales"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/sales' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Sales
          </Link>

          <Link
            to="/credit-sales"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/credit-sales' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2M5 19h14a2 2 0 00-2-2v-5a2 2 0 002 2v5a2 2 0 002 2z" />
            </svg>
            Credit Sales
          </Link>

          <Link
            to="/credit-purchases"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/credit-purchases' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            Credit Purchases
          </Link>

          <Link
            to="/suppliers"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/suppliers' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Suppliers
          </Link>

          <Link
            to="/summary"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/summary' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V3a1 1 0 112 0v8h8a1 1 0 110 2h-8v8a1 1 0 11-2 0v-8H3a1 1 0 110-2h8z" />
            </svg>
            Summary
          </Link>

          <Link
            to="/reports"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/reports' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4m0 0V7m0 4v4" />
            </svg>
            Reports
          </Link>

          <Link
            to="/expenses"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/expenses' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Expenses
          </Link>

          <Link
            to="/proformas"
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === '/proformas' 
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Proforma Invoices
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Logged in</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-4 w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<HomeScreen apiUrl={API_URL} token={token} />} />
          <Route path="/inventory" element={<ProductsScreen apiUrl={API_URL} token={token} />} />
          <Route path="/sales" element={<SalesScreen apiUrl={API_URL} token={token} />} />
          <Route path="/credit-sales" element={<CreditSalesScreen apiUrl={API_URL} token={token} />} />
          <Route path="/credit-purchases" element={<CreditPurchasesScreen />} />
          <Route path="/suppliers" element={<SuppliersScreen />} />
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/summary" element={<SummaryScreen />} />
          <Route path="/expenses" element={<ExpensesScreen />} />
          <Route path="/proformas" element={<ProformaInvoicesScreen apiUrl={API_URL} token={token} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [approved, setApproved] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [desktopAccessOpen, setDesktopAccessOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Check desktop access state every 3 seconds
  useEffect(() => {
    const checkDesktopAccess = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/desktop-access`);
        if (response.ok) {
          const data = await response.json();
          setDesktopAccessOpen(data.isOpen);
          
          // If access is closed and user is logged in, log them out
          if (!data.isOpen && token) {
            setToken(null);
            setApproved(false);
          }
        }
      } catch (error) {
        console.error('Failed to check desktop access:', error);
      }
    };

    // Initial check
    checkDesktopAccess();
    setLoading(false);

    // Poll every 3 seconds
    const interval = setInterval(checkDesktopAccess, 3000);

    return () => clearInterval(interval);
  }, [token]);

  // Show loading while checking initial state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking desktop access...</p>
        </div>
      </div>
    );
  }

  // If desktop access is closed, show closed message
  if (desktopAccessOpen === false) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Desktop Access Closed</h2>
          <p className="text-gray-600 mb-4">
            Desktop access has been closed by an administrator.
            Please contact your administrator to restore access.
          </p>
          <div className="text-sm text-gray-500">
            Checking for updates every 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  // If desktop access is open, show normal flow
  if (!approved) {
    return <WaitingForApprovalScreen onApproved={() => setApproved(true)} />;
  }
  
  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  // Main app with navigation
  return (
    <Router>
      <Navigation token={token} onLogout={() => setToken(null)} />
    </Router>
  );
}

export default App;
