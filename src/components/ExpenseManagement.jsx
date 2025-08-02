import React, { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2,
  FileText,
  DollarSign,
  TrendingDown,
  Package,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'

export default function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('month')
  const [expenseStats, setExpenseStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    categoryBreakdown: [],
    topSuppliers: [],
    recentExpenses: []
  })
  
  // Expense states
  const [expenses, setExpenses] = useState([])
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: '',
    supplier_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    payment_method: 'cash'
  })
  const [expenseLoading, setExpenseLoading] = useState(false)
  
  // Supplier states
  const [suppliers, setSuppliers] = useState([])
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_number: ''
  })
  const [supplierLoading, setSupplierLoading] = useState(false)
  
  // Purchase Order states
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [isPODialogOpen, setIsPODialogOpen] = useState(false)
  const [editingPO, setEditingPO] = useState(null)
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    items: [],
    notes: ''
  })
  const [poLoading, setPoLoading] = useState(false)
  
  const { api } = useAuth()

  const expenseCategories = [
    { value: 'utilities', label: 'Utilities', icon: '⚡' },
    { value: 'rent', label: 'Rent', icon: '🏢' },
    { value: 'salary', label: 'Salary', icon: '👥' },
    { value: 'inventory', label: 'Inventory', icon: '📦' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'insurance', label: 'Insurance', icon: '🛡️' },
    { value: 'transport', label: 'Transport', icon: '🚚' },
    { value: 'office_supplies', label: 'Office Supplies', icon: '📄' },
    { value: 'software', label: 'Software', icon: '💻' },
    { value: 'legal', label: 'Legal', icon: '⚖️' },
    { value: 'accounting', label: 'Accounting', icon: '📊' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎉' },
    { value: 'other', label: 'Other', icon: '📋' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' }
  ]

  useEffect(() => {
    loadData()
  }, [activeTab, searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      const shop_id = localStorage.getItem('shop_id') || 1
      
      // Load all data for analytics, or specific data based on active tab
      if (activeTab === 'analytics') {
        // Load all data for analytics
        const [expensesData, suppliersData, purchaseOrdersData] = await Promise.all([
          api.getExpenses({ shop_id }),
          api.getSuppliers({ shop_id }),
          api.getPurchaseOrders({ shop_id })
        ])
        setExpenses(expensesData.expenses || [])
        setSuppliers(suppliersData.suppliers || [])
        setPurchaseOrders(purchaseOrdersData.purchase_orders || [])
      } else if (activeTab === 'expenses') {
        const data = await api.getExpenses({ search: searchTerm, shop_id })
        setExpenses(data.expenses || [])
      } else if (activeTab === 'suppliers') {
        const data = await api.getSuppliers({ search: searchTerm, shop_id })
        setSuppliers(data.suppliers || [])
      } else if (activeTab === 'purchase_orders') {
        const data = await api.getPurchaseOrders({ search: searchTerm, shop_id })
        setPurchaseOrders(data.purchase_orders || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Expense functions
  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    setExpenseLoading(true)
    setError('')

    try {
      const shop_id = localStorage.getItem('shop_id') || 1
      const expenseData = { ...expenseForm, shop_id }
      
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, expenseData)
      } else {
        await api.createExpense(expenseData)
      }
      
      setIsExpenseDialogOpen(false)
      setEditingExpense(null)
      resetExpenseForm()
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setExpenseLoading(false)
    }
  }

  const handleExpenseEdit = (expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      supplier_id: expense.supplier_id?.toString() || '',
      date: expense.date,
      description: expense.description,
      payment_method: expense.payment_method
    })
    setIsExpenseDialogOpen(true)
  }

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      amount: '',
      category: '',
      supplier_id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      payment_method: 'cash'
    })
  }

  const handleExpenseDelete = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      setError('')
      await api.deleteExpense(expenseId)
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Supplier functions
  const handleSupplierSubmit = async (e) => {
    e.preventDefault()
    setSupplierLoading(true)
    setError('')

    try {
      const shop_id = localStorage.getItem('shop_id') || 1
      const supplierData = { ...supplierForm, shop_id }
      
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, supplierData)
      } else {
        await api.createSupplier(supplierData)
      }
      
      setIsSupplierDialogOpen(false)
      setEditingSupplier(null)
      resetSupplierForm()
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSupplierLoading(false)
    }
  }

  const handleSupplierEdit = (supplier) => {
    setEditingSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      gst_number: supplier.gst_number
    })
    setIsSupplierDialogOpen(true)
  }

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      gst_number: ''
    })
  }

  const handleSupplierDelete = async (supplierId) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return
    
    try {
      setError('')
      await api.deleteSupplier(supplierId)
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Purchase Order functions
  const handlePOSubmit = async (e) => {
    e.preventDefault()
    setPoLoading(true)
    setError('')

    try {
      const shop_id = localStorage.getItem('shop_id') || 1
      const poData = { ...poForm, shop_id }
      
      if (editingPO) {
        await api.updatePurchaseOrder(editingPO.id, poData)
      } else {
        await api.createPurchaseOrder(poData)
      }
      
      setIsPODialogOpen(false)
      setEditingPO(null)
      resetPOForm()
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setPoLoading(false)
    }
  }

  const handlePOEdit = (po) => {
    setEditingPO(po)
    setPoForm({
      supplier_id: po.supplier_id?.toString() || '',
      order_date: po.order_date,
      expected_delivery: po.expected_delivery || '',
      total_amount: po.total_amount?.toString() || '',
      status: po.status || 'pending',
      notes: po.notes || ''
    })
    setIsPODialogOpen(true)
  }

  const resetPOForm = () => {
    setPoForm({
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: '',
      total_amount: '',
      status: 'pending',
      notes: ''
    })
  }

  const handlePODelete = async (poId) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return
    
    try {
      setError('')
      await api.deletePurchaseOrder(poId)
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString()}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'destructive',
      approved: 'default',
      delivered: 'secondary',
      cancelled: 'outline'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const calculateExpenseStats = () => {
    try {
      const totalExpenses = expenses.reduce((sum, expense) => {
        const amount = parseFloat(expense.amount) || 0
        return sum + amount
      }, 0)
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const monthlyExpenses = expenses.filter(expense => {
        try {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        } catch (error) {
          return false
        }
      }).reduce((sum, expense) => {
        const amount = parseFloat(expense.amount) || 0
        return sum + amount
      }, 0)

      // Category breakdown
      const categoryBreakdown = {}
      expenses.forEach(expense => {
        const category = expense.category || 'Uncategorized'
        const amount = parseFloat(expense.amount) || 0
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = 0
        }
        categoryBreakdown[category] += amount
      })

      // Top suppliers
      const supplierExpenses = {}
      expenses.forEach(expense => {
        const supplierName = expense.supplier?.name || 'Unknown'
        const amount = parseFloat(expense.amount) || 0
        if (!supplierExpenses[supplierName]) {
          supplierExpenses[supplierName] = 0
        }
        supplierExpenses[supplierName] += amount
      })

      const topSuppliers = Object.entries(supplierExpenses)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      // Recent expenses (sorted by date, most recent first)
      const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)

      setExpenseStats({
        totalExpenses,
        monthlyExpenses,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([category, amount]) => ({ category, amount })),
        topSuppliers,
        recentExpenses
      })
    } catch (error) {
      console.error('Error calculating expense stats:', error)
      setExpenseStats({
        totalExpenses: 0,
        monthlyExpenses: 0,
        categoryBreakdown: [],
        topSuppliers: [],
        recentExpenses: []
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, searchTerm])

  useEffect(() => {
    if (expenses.length > 0) {
      calculateExpenseStats()
    }
  }, [expenses])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-gray-600">Track expenses, manage suppliers, and handle purchase orders</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        
        {/* Quick Expense Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg"
            onClick={() => setIsExpenseDialogOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Quick Expense
          </Button>
        </div>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="purchase_orders" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Purchase Orders</span>
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenseStats.totalExpenses)}
                </div>
                <p className="text-xs text-red-600/70">
                  All time expenses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(expenseStats.monthlyExpenses)}
                </div>
                <p className="text-xs text-orange-600/70">
                  This month's expenses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {suppliers.length}
                </div>
                <p className="text-xs text-blue-600/70">
                  Active suppliers
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {purchaseOrders.length}
                </div>
                <p className="text-xs text-green-600/70">
                  Total orders
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseStats.categoryBreakdown.length > 0 ? (
                    expenseStats.categoryBreakdown.map((item, index) => {
                      const category = expenseCategories.find(cat => cat.value === item.category)
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{category?.icon || '📋'}</span>
                            <div>
                              <p className="font-medium">{category?.label || item.category}</p>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">
                              {formatCurrency(item.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {expenseStats.totalExpenses > 0 ? ((item.amount / expenseStats.totalExpenses) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No category data</p>
                      <p className="text-sm">Add expenses to see category breakdown</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers</CardTitle>
                <CardDescription>Suppliers with highest expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseStats.topSuppliers.length > 0 ? (
                    expenseStats.topSuppliers.map((supplier, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-gray-500">Supplier</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            {formatCurrency(supplier.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expenseStats.totalExpenses > 0 ? ((supplier.amount / expenseStats.totalExpenses) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No supplier data</p>
                      <p className="text-sm">Add expenses with suppliers to see top suppliers</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Latest expense transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseStats.recentExpenses.length > 0 ? (
                  expenseStats.recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-gray-500">
                            {expense.supplier?.name || 'No supplier'} • {formatDate(expense.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </p>
                        <Badge variant="outline">{expense.category}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No expenses found</p>
                    <p className="text-sm">Add your first expense to see analytics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsExpenseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{expenseCategories.find(cat => cat.value === expense.category)?.icon || '📋'}</span>
                          <Badge variant="outline">{expenseCategories.find(cat => cat.value === expense.category)?.label || expense.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{expense.supplier?.name || '-'}</TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.payment_method}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExpenseEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExpenseDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setIsSupplierDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.gst_number || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSupplierEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSupplierDelete(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase_orders" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setIsPODialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier?.name}</TableCell>
                      <TableCell>{formatDate(po.order_date)}</TableCell>
                      <TableCell>{formatDate(po.expected_delivery)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(po.total_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                                             <TableCell>
                         <div className="flex items-center space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handlePOEdit(po)}
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handlePODelete(po.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense information' : 'Add a new expense to your records'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                  placeholder="Enter expense title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={expenseForm.category} 
                  onValueChange={(value) => setExpenseForm({...expenseForm, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select 
                  value={expenseForm.supplier_id} 
                  onValueChange={(value) => setExpenseForm({...expenseForm, supplier_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select 
                  value={expenseForm.payment_method} 
                  onValueChange={(value) => setExpenseForm({...expenseForm, payment_method: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="Enter expense description"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsExpenseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={expenseLoading}>
                {expenseLoading ? <LoadingSpinner size="sm" /> : (editingExpense ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'Update supplier information' : 'Add a new supplier to your database'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  placeholder="Enter supplier name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                  placeholder="Enter contact person"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                placeholder="Enter supplier address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                value={supplierForm.gst_number}
                onChange={(e) => setSupplierForm({...supplierForm, gst_number: e.target.value})}
                placeholder="Enter GST number"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsSupplierDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={supplierLoading}>
                {supplierLoading ? <LoadingSpinner size="sm" /> : (editingSupplier ? 'Update' : 'Create')}
              </Button>
            </div>
                     </form>
         </DialogContent>
       </Dialog>

       {/* Purchase Order Dialog */}
       <Dialog open={isPODialogOpen} onOpenChange={setIsPODialogOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>
               {editingPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}
             </DialogTitle>
             <DialogDescription>
               {editingPO ? 'Update purchase order information' : 'Create a new purchase order'}
             </DialogDescription>
           </DialogHeader>
           
           <form onSubmit={handlePOSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="supplier_id">Supplier *</Label>
                 <Select 
                   value={poForm.supplier_id} 
                   onValueChange={(value) => setPoForm({...poForm, supplier_id: value})}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select supplier" />
                   </SelectTrigger>
                   <SelectContent>
                     {suppliers.map((supplier) => (
                       <SelectItem key={supplier.id} value={supplier.id.toString()}>
                         {supplier.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="order_date">Order Date *</Label>
                 <Input
                   id="order_date"
                   name="order_date"
                   type="date"
                   value={poForm.order_date}
                   onChange={(e) => setPoForm({...poForm, order_date: e.target.value})}
                   required
                 />
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="expected_delivery">Expected Delivery</Label>
                 <Input
                   id="expected_delivery"
                   name="expected_delivery"
                   type="date"
                   value={poForm.expected_delivery}
                   onChange={(e) => setPoForm({...poForm, expected_delivery: e.target.value})}
                 />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="total_amount">Total Amount</Label>
                 <Input
                   id="total_amount"
                   name="total_amount"
                   type="number"
                   value={poForm.total_amount}
                   onChange={(e) => setPoForm({...poForm, total_amount: e.target.value})}
                   placeholder="Enter total amount"
                 />
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="status">Status</Label>
                 <Select 
                   value={poForm.status} 
                   onValueChange={(value) => setPoForm({...poForm, status: value})}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="pending">Pending</SelectItem>
                     <SelectItem value="approved">Approved</SelectItem>
                     <SelectItem value="delivered">Delivered</SelectItem>
                     <SelectItem value="cancelled">Cancelled</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="notes">Notes</Label>
               <Textarea
                 id="notes"
                 name="notes"
                 value={poForm.notes}
                 onChange={(e) => setPoForm({...poForm, notes: e.target.value})}
                 placeholder="Enter purchase order notes"
               />
             </div>
             
             <div className="flex justify-end space-x-2 pt-4">
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={() => setIsPODialogOpen(false)}
               >
                 Cancel
               </Button>
               <Button type="submit" disabled={poLoading}>
                 {poLoading ? <LoadingSpinner size="sm" /> : (editingPO ? 'Update' : 'Create')}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>
     </div>
   )
} 