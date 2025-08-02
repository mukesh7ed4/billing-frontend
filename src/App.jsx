import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { ThemeProvider } from 'next-themes'
import './App.css'

// Import components
import LoginPage from './components/LoginPage'
import AdminDashboard from './components/AdminDashboard'
import ShopDashboard from './components/ShopDashboard'
import ShopOnboarding from './components/ShopOnboarding'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Authentication Context
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// API Base URL - Production ready
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://billing-backend-1-q34e.onrender.com')

// API Helper Functions
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  },

  // Authentication endpoints
  login: (credentials) => api.request('/auth/login', { method: 'POST', body: credentials }),
  logout: () => api.request('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => api.request('/auth/me'),
  registerShop: (shopData) => api.request('/auth/register-shop', { method: 'POST', body: shopData }),

  // Admin endpoints
  getAdminDashboard: () => api.request('/admin/dashboard'),
  getAllShops: (params = {}) => api.request(`/admin/shops?${new URLSearchParams(params)}`),
  activateShop: (shopId) => api.request(`/admin/shops/${shopId}/activate`, { method: 'POST' }),
  deactivateShop: (shopId) => api.request(`/admin/shops/${shopId}/deactivate`, { method: 'POST' }),
  getPaymentVerifications: (params = {}) => api.request(`/admin/payment-verifications?${new URLSearchParams(params)}`),
  verifyPayment: (paymentId, data) => api.request(`/admin/payment-verifications/${paymentId}/verify`, { method: 'POST', body: data }),
  rejectPayment: (paymentId, data) => api.request(`/admin/payment-verifications/${paymentId}/reject`, { method: 'POST', body: data }),

  // Shop endpoints
  getShopDashboard: () => api.request('/shop/dashboard'),
  getShopProfile: () => api.request('/shop/profile'),
  updateShopProfile: (data) => api.request('/shop/profile', { method: 'PUT', body: data }),

  // Product endpoints
  getProducts: (params = {}) => api.request(`/shop/products?${new URLSearchParams(params)}`),
  createProduct: (data) => api.request('/shop/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => api.request(`/shop/products/${id}`, { method: 'PUT', body: data }),
  getProductCategories: () => api.request('/shop/products/categories'),

  // Customer endpoints
  getCustomers: (params = {}) => api.request(`/shop/customers?${new URLSearchParams(params)}`),
  createCustomer: (data) => api.request('/shop/customers', { method: 'POST', body: data }),
  updateCustomer: (id, data) => api.request(`/shop/customers/${id}`, { method: 'PUT', body: data }),
  deleteCustomer: (id) => api.request(`/shop/customers/${id}`, { method: 'DELETE' }),
  getCustomerInvoices: (customerId) => api.request(`/shop/customers/${customerId}/invoices`),
  getCustomerPayments: (customerId) => api.request(`/shop/customers/${customerId}/payments`),

  // Invoice endpoints
  getInvoices: (params = {}) => api.request(`/shop/invoices?${new URLSearchParams(params)}`),
  createInvoice: (data) => api.request('/shop/invoices', { method: 'POST', body: data }),
  getInvoice: (id) => api.request(`/shop/invoices/${id}`),
  deleteInvoice: (id) => api.request(`/shop/invoices/${id}`, { method: 'DELETE' }),
  createReturnInvoice: (invoiceId, data) => api.request(`/shop/invoices/${invoiceId}/returns`, { method: 'POST', body: data }),
  addPaymentToInvoice: (invoiceId, data) => api.request(`/shop/invoices/${invoiceId}/payments`, { method: 'POST', body: data }),

  // Payment endpoints
  getPricing: () => api.request('/payment/pricing'),
  submitPayment: (data) => api.request('/payment/submit', { method: 'POST', body: data }),
  getSubscriptionStatus: () => api.request('/payment/subscription-status'),
  getPaymentMethods: () => api.request('/payment/methods'),



  // Expenses
  getExpenses: (params = {}) => api.request(`/expense/expenses?${new URLSearchParams(params)}`),
  createExpense: (data) => api.request('/expense/expenses', { method: 'POST', body: data }),
  updateExpense: (id, data) => api.request(`/expense/expenses/${id}`, { method: 'PUT', body: data }),
  deleteExpense: (id) => api.request(`/expense/expenses/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: (params = {}) => api.request(`/expense/suppliers?${new URLSearchParams(params)}`),
  createSupplier: (data) => api.request('/expense/suppliers', { method: 'POST', body: data }),
  updateSupplier: (id, data) => api.request(`/expense/suppliers/${id}`, { method: 'PUT', body: data }),
  deleteSupplier: (id) => api.request(`/expense/suppliers/${id}`, { method: 'DELETE' }),

  // Purchase Orders
  getPurchaseOrders: (params = {}) => api.request(`/expense/purchase-orders?${new URLSearchParams(params)}`),
  createPurchaseOrder: (data) => api.request('/expense/purchase-orders', { method: 'POST', body: data }),
  updatePurchaseOrder: (id, data) => api.request(`/expense/purchase-orders/${id}`, { method: 'PUT', body: data }),
  deletePurchaseOrder: (id) => api.request(`/expense/purchase-orders/${id}`, { method: 'DELETE' }),
}

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const data = await api.getCurrentUser()
      setUser(data.user)
      setShop(data.shop)
    } catch (error) {
      console.log('Not authenticated')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      const data = await api.login(credentials)
      setUser(data.user)
      setShop(data.shop)
      return data
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setShop(null)
    }
  }

  const value = {
    user,
    shop,
    loading,
    error,
    login,
    logout,
    api,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isShopUser: user?.role === 'shop_user',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false, shopOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (shopOnly && user.role !== 'shop_user') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Dashboard Router Component
function DashboardRouter() {
  const { isAdmin } = useAuth()
  
  if (isAdmin) {
    return <AdminDashboard />
  } else {
    return <ShopDashboard />
  }
}

// Main App Component
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<ShopOnboarding />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

