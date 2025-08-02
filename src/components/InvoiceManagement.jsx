import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Calendar,
  User,
  IndianRupee,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [invoiceToReturn, setInvoiceToReturn] = useState(null)
  const [returnForm, setReturnForm] = useState({
    return_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  })
  const [returnLoading, setReturnLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_amount: '',
    discount_amount: '',
    notes: '',
    items: [],
    // Payment fields
    initial_payment: '',
    payment_method: 'cash',
    payment_notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const { api } = useAuth()

  useEffect(() => {
    loadInvoices()
    loadCustomers()
    loadProducts()
  }, [searchTerm, statusFilter])

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(invoices.length / itemsPerPage)

  // Pagination functions
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      
      const data = await api.getInvoices(params)
      setInvoices(data.invoices)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers()
      setCustomers(data.customers)
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(data.products)
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const handleViewInvoice = async (invoiceId) => {
    try {
      const data = await api.getInvoice(invoiceId)
      setViewingInvoice(data.invoice)
      setIsDialogOpen(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteInvoice = async (invoice) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return
    
    setDeleteLoading(true)
    setError('')

    try {
      await api.deleteInvoice(invoiceToDelete.id)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
      await loadInvoices()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleReturnInvoice = async (invoice) => {
    try {
      // Fetch complete invoice data with items
      const data = await api.getInvoice(invoice.id)
      const completeInvoice = data.invoice
      
      console.log('Complete invoice data:', completeInvoice)
      console.log('Invoice items:', completeInvoice.items)
      
      setInvoiceToReturn(completeInvoice)
      
      // Initialize return form with original items
      const originalItems = completeInvoice.items || []
      console.log('Original items for return:', originalItems)
      
      setReturnForm({
        return_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: originalItems.map(item => ({
          ...item,
          return_quantity: 0,
          max_quantity: parseFloat(item.quantity)
        }))
      })
      setIsReturnDialogOpen(true)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching invoice for return:', err)
    }
  }

  const confirmReturnInvoice = async () => {
    if (!invoiceToReturn) return
    
    setReturnLoading(true)
    setError('')

    try {
      // Filter items that have return quantities
      const returnItems = returnForm.items.filter(item => 
        item.return_quantity && parseFloat(item.return_quantity) > 0
      )

      if (returnItems.length === 0) {
        setError('Please specify quantities for items to return')
        return
      }

      const returnData = {
        return_data: {
          return_date: returnForm.return_date,
          notes: returnForm.notes
        },
        items: returnItems.map(item => ({
          product_id: item.product_id,
          quantity: parseFloat(item.return_quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      }

      await api.createReturnInvoice(invoiceToReturn.id, returnData)
      setIsReturnDialogOpen(false)
      setInvoiceToReturn(null)
      setReturnForm({
        return_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      })
      await loadInvoices()
    } catch (err) {
      setError(err.message)
    } finally {
      setReturnLoading(false)
    }
  }

  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.customer_id) {
        setError('Please select a customer')
        return
      }

      if (!formData.items || formData.items.length === 0) {
        setError('Please add at least one item to the invoice')
        return
      }

      // Validate invoice items
      const validItems = formData.items.filter(item => 
        item.product_id && 
        item.quantity && 
        item.unit_price &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unit_price) > 0
      )

      if (validItems.length === 0) {
        setError('Please add valid items to the invoice')
        return
      }

      const invoiceData = {
        customer_id: formData.customer_id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        notes: formData.notes,
        items: validItems,
        // Payment data
        initial_payment: parseFloat(formData.initial_payment) || 0,
        payment_method: formData.payment_method,
        payment_notes: formData.payment_notes
      }

      await api.createInvoice(invoiceData)
      
      setIsCreateDialogOpen(false)
      resetForm()
      await loadInvoices()
    } catch (err) {
      setError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_amount: '',
      discount_amount: '',
      notes: '',
      items: [],
      // Payment fields
      initial_payment: '',
      payment_method: 'cash',
      payment_notes: ''
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { 
        product_id: '', 
        quantity: '', 
        unit_price: '' 
      }]
    })
  }

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      items: newItems
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill unit price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value))
      if (product) {
        newItems[index].unit_price = product.price.toString()
      }
    }
    
    // Ensure numeric fields are properly formatted
    if (field === 'quantity' || field === 'unit_price') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0) {
        newItems[index][field] = value
      } else if (value === '') {
        newItems[index][field] = ''
      }
    }
    
    setFormData({
      ...formData,
      items: newItems
    })
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      return sum + (quantity * price)
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = parseFloat(formData.tax_amount) || 0
    const discount = parseFloat(formData.discount_amount) || 0
    return subtotal + tax - discount
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage customer invoices</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for your customer
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateInvoice} className="space-y-8">
              {/* Invoice Details */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Customer *</Label>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => handleSelectChange('customer_id', value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Search and select customer..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <div className="p-2">
                          <Input
                            placeholder="Search customers..."
                            className="mb-2"
                            onChange={(e) => {
                              // Filter customers based on search
                              const searchTerm = e.target.value.toLowerCase();
                              const filteredCustomers = customers.filter(customer =>
                                customer.name.toLowerCase().includes(searchTerm) ||
                                customer.phone?.toLowerCase().includes(searchTerm) ||
                                customer.email?.toLowerCase().includes(searchTerm)
                              );
                              // You can implement real-time search here
                            }}
                          />
                        </div>
                        {customers.length === 0 ? (
                          <SelectItem value="" disabled>
                            No customers found. Please add customers first.
                          </SelectItem>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
                                <span className="text-xs text-gray-500">
                                  {customer.phone} • {customer.email || 'No email'}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {!formData.customer_id && (
                      <p className="text-sm text-red-500">Please select a customer</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      name="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Select 
                        value={item.product_id} 
                        onValueChange={(value) => updateItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ₹{product.price}/{product.unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input
                        value={((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                        disabled
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {formData.items.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No items added yet. Click "Add Item" to get started.</p>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Payment Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial_payment">Initial Payment (Optional)</Label>
                    <Input
                      id="initial_payment"
                      name="initial_payment"
                      type="number"
                      step="0.01"
                      value={formData.initial_payment}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <p className="text-sm text-gray-500">
                      Amount paid immediately (if any)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => handleSelectChange('payment_method', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_notes">Payment Notes</Label>
                    <Input
                      id="payment_notes"
                      name="payment_notes"
                      value={formData.payment_notes}
                      onChange={handleChange}
                      placeholder="Payment reference or notes"
                    />
                  </div>
                </div>
                
                {formData.initial_payment && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Payment Summary:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₹{parseFloat(formData.initial_payment || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Remaining Balance: ₹{(calculateTotal() - parseFloat(formData.initial_payment || 0)).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              {formData.items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_amount">Tax Amount</Label>
                    <Input
                      id="tax_amount"
                      name="tax_amount"
                      type="number"
                      step="0.01"
                      value={formData.tax_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input
                      id="discount_amount"
                      name="discount_amount"
                      type="number"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading || formData.items.length === 0}
                >
                  {formLoading ? <LoadingSpinner size="sm" /> : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search invoices by number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
          <CardDescription>
            All customer invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No invoices found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-500">ID: {invoice.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {invoice.customer?.name || 'Walk-in Customer'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">₹{invoice.total_amount.toLocaleString()}</p>
                        {invoice.balance_amount > 0 && (
                          <p className="text-sm text-orange-600">
                            Balance: ₹{invoice.balance_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.status === 'paid' ? 'default' :
                        invoice.status === 'partial' ? 'secondary' : 'destructive'
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReturnInvoice(invoice)}
                          disabled={invoice.status === 'paid'}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {invoices.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, invoices.length)} of {invoices.length} invoices
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className="w-8 h-8"
                        >
                          {pageNumber}
                        </Button>
                      )
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={pageNumber} className="px-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View invoice information and items
            </DialogDescription>
          </DialogHeader>
          
          {viewingInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Invoice Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Invoice Number:</strong> {viewingInvoice.invoice_number}</p>
                    <p><strong>Date:</strong> {new Date(viewingInvoice.invoice_date).toLocaleDateString()}</p>
                    {viewingInvoice.due_date && (
                      <p><strong>Due Date:</strong> {new Date(viewingInvoice.due_date).toLocaleDateString()}</p>
                    )}
                    <p><strong>Status:</strong> 
                      <Badge className="ml-2" variant={
                        viewingInvoice.status === 'paid' ? 'default' :
                        viewingInvoice.status === 'partial' ? 'secondary' : 'destructive'
                      }>
                        {viewingInvoice.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {viewingInvoice.customer?.name || 'Walk-in Customer'}</p>
                    {viewingInvoice.customer?.phone && (
                      <p><strong>Phone:</strong> {viewingInvoice.customer.phone}</p>
                    )}
                    {viewingInvoice.customer?.email && (
                      <p><strong>Email:</strong> {viewingInvoice.customer.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="font-medium mb-4">Invoice Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingInvoice.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>₹{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell>₹{item.total_price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Invoice Totals */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div></div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{viewingInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    {viewingInvoice.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{viewingInvoice.tax_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {viewingInvoice.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-₹{viewingInvoice.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{viewingInvoice.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>₹{viewingInvoice.paid_amount.toLocaleString()}</span>
                    </div>
                    {viewingInvoice.balance_amount > 0 && (
                      <div className="flex justify-between text-orange-600 font-medium">
                        <span>Balance:</span>
                        <span>₹{viewingInvoice.balance_amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {invoiceToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Invoice #{invoiceToDelete.invoice_number}</p>
                    <p className="text-sm text-gray-600">
                      Customer: {invoiceToDelete.customer?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Amount: ₹{invoiceToDelete.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteInvoice}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <LoadingSpinner size="sm" /> : 'Delete Invoice'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Invoice Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Items</DialogTitle>
            <DialogDescription>
              Select items to return from invoice #{invoiceToReturn?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          
          {invoiceToReturn && (
            <div className="space-y-6">
              {/* Return Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="return_date">Return Date *</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={returnForm.return_date}
                    onChange={(e) => setReturnForm({...returnForm, return_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="return_notes">Return Notes</Label>
                  <Input
                    id="return_notes"
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm({...returnForm, notes: e.target.value})}
                    placeholder="Reason for return..."
                  />
                </div>
              </div>

              {/* Return Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Items to Return</h3>
                
                {returnForm.items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items found in this invoice.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {returnForm.items.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-xs">#{item.product_id}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-gray-500">
                                  Original: {item.quantity} {item.unit} @ ₹{item.unit_price}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Return Quantity</p>
                              <Input
                                type="number"
                                min="0"
                                max={item.max_quantity}
                                step="1"
                                value={item.return_quantity || ''}
                                onChange={(e) => {
                                  const newItems = [...returnForm.items]
                                  newItems[index].return_quantity = e.target.value
                                  setReturnForm({...returnForm, items: newItems})
                                }}
                                className="w-20"
                                placeholder="0"
                              />
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Return Amount</p>
                              <p className="font-medium text-red-600">
                                ₹{((parseFloat(item.return_quantity) || 0) * parseFloat(item.unit_price)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Return Summary */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Return Amount:</span>
                  <span className="text-lg font-bold text-red-600">
                    ₹{returnForm.items.reduce((sum, item) => 
                      sum + ((parseFloat(item.return_quantity) || 0) * parseFloat(item.unit_price)), 0
                    ).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This will create a return invoice and adjust the original invoice balance.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReturnDialogOpen(false)}
                  disabled={returnLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmReturnInvoice}
                  disabled={returnLoading}
                >
                  {returnLoading ? <LoadingSpinner size="sm" /> : 'Create Return'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

