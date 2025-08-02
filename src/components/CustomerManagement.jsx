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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Eye,
  FileText,
  CreditCard
} from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'

// Custom CSS for large dialog
const customStyles = `
  .customer-detail-dialog {
    max-width: 95vw !important;
    max-height: 95vh !important;
    width: 1400px !important;
    height: 1000px !important;
  }
  
  .customer-detail-dialog .dialog-content {
    max-height: 95vh !important;
    overflow: hidden !important;
  }
  
  .customer-detail-dialog .scrollable-content {
    height: 700px !important;
    max-height: 700px !important;
    overflow-y: auto !important;
  }
`

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerInvoices, setCustomerInvoices] = useState([])
  const [customerPayments, setCustomerPayments] = useState([])
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false)
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('invoices')
  
  const { api } = useAuth()

  useEffect(() => {
    loadCustomers()
  }, [searchTerm])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchTerm) params.search = searchTerm
      
      const data = await api.getCustomers(params)
      setCustomers(data.customers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerDetails = async (customerId) => {
    try {
      setCustomerDetailLoading(true)
      
      // Load customer invoices
      const invoicesData = await api.getCustomerInvoices(customerId)
      setCustomerInvoices(invoicesData.invoices || [])
      
      // Load customer payments
      const paymentsData = await api.getCustomerPayments(customerId)
      setCustomerPayments(paymentsData.payments || [])
      
    } catch (err) {
      setError(err.message)
    } finally {
      setCustomerDetailLoading(false)
    }
  }

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer)
    setIsCustomerDetailOpen(true)
    await loadCustomerDetails(customer.id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData)
      } else {
        await api.createCustomer(formData)
      }
      
      setIsDialogOpen(false)
      setEditingCustomer(null)
      resetForm()
      await loadCustomers()
    } catch (err) {
      setError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      gst_number: customer.gst_number || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      await api.deleteCustomer(customerId)
      await loadCustomers()
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gst_number: ''
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-6">
      <style>{customStyles}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-gray-600">Manage your customers and their information</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                No customers found
              </h3>
              <p className="text-xs text-gray-500">Get started by adding your first customer.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.city || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <User className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
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

      {/* Customer Creation/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information' : 'Add a new customer to your database'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full address"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="GST number (optional)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <LoadingSpinner size="sm" /> : (editingCustomer ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={isCustomerDetailOpen} onOpenChange={setIsCustomerDetailOpen}>
        <DialogContent className="customer-detail-dialog max-w-[95vw] max-h-[95vh] w-[1400px] h-[1000px] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center">
              <User className="h-6 w-6 mr-3 text-blue-600" />
              {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete customer profile and transaction history
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="flex flex-col h-full">
              {/* Top Section - Customer Info & Stats */}
              <div className="p-6 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Information Card */}
                  <div className="lg:col-span-1">
                    <Card className="h-full">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-3">
                        <CardTitle className="flex items-center text-base">
                          <User className="h-4 w-4 mr-2" />
                          Customer Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                              <p className="text-xs text-gray-500">ID: {selectedCustomer.id}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {selectedCustomer.phone && (
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="font-medium break-all">{selectedCustomer.phone}</span>
                              </div>
                            )}
                            
                            {selectedCustomer.email && (
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="font-medium break-all">{selectedCustomer.email}</span>
                              </div>
                            )}
                            
                            {selectedCustomer.gst_number && (
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-green-600">G</span>
                                </div>
                                <span className="font-medium break-all">{selectedCustomer.gst_number}</span>
                              </div>
                            )}
                            
                            {selectedCustomer.address && (
                              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium break-words">{selectedCustomer.address}</p>
                                  <p className="text-xs text-gray-500 break-words">
                                    {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Statistics Cards */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {customerDetailLoading ? (
                        <div className="col-span-4 flex justify-center py-6">
                          <LoadingSpinner size="lg" />
                        </div>
                      ) : (
                        <>
                          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white font-bold text-sm">{customerInvoices.length}</span>
                              </div>
                              <p className="text-2xl font-bold text-blue-600">{customerInvoices.length}</p>
                              <p className="text-xs text-gray-600">Total Invoices</p>
                            </CardContent>
                          </Card>

                          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white font-bold text-sm">₹</span>
                              </div>
                              <p className="text-2xl font-bold text-green-600">
                                ₹{customerInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600">Total Billed</p>
                            </CardContent>
                          </Card>

                          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white font-bold text-sm">₹</span>
                              </div>
                              <p className="text-2xl font-bold text-orange-600">
                                ₹{customerInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600">Total Paid</p>
                            </CardContent>
                          </Card>

                          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white font-bold text-sm">₹</span>
                              </div>
                              <p className="text-2xl font-bold text-red-600">
                                ₹{customerInvoices.reduce((sum, inv) => sum + inv.balance_amount, 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600">Outstanding</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Tabs for Invoices and Payments */}
              <div className="flex-1 overflow-hidden border-t">
                <div className="flex space-x-1 p-4 bg-gray-50 dark:bg-gray-800">
                  <Button 
                    variant={activeTab === 'invoices' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setActiveTab('invoices')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Invoices ({customerInvoices.length})
                  </Button>
                  <Button 
                    variant={activeTab === 'payments' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setActiveTab('payments')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payments ({customerPayments.length})
                  </Button>
                </div>
                
                <div className="scrollable-content p-6 overflow-y-auto" style={{ height: '700px', maxHeight: '700px' }}>
                  {activeTab === 'invoices' ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Invoice History (Latest First)</h3>
                      {customerDetailLoading ? (
                        <div className="flex justify-center py-6">
                          <LoadingSpinner />
                        </div>
                      ) : customerInvoices.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            No invoices found
                          </h3>
                          <p className="text-xs text-gray-500">This customer hasn't had any invoices yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {customerInvoices.map((invoice) => (
                            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 min-w-0">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-blue-600 font-bold text-sm">#{invoice.invoice_number.split('-').pop()}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-base break-all">{invoice.invoice_number}</p>
                                      <p className="text-sm text-gray-500">
                                        {new Date(invoice.invoice_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-6 text-sm">
                                    <div className="text-right">
                                      <p className="text-gray-500 text-xs">Total</p>
                                      <p className="font-bold text-base">₹{invoice.total_amount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-500 text-xs">Paid</p>
                                      <p className="font-bold text-base text-green-600">₹{invoice.paid_amount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-500 text-xs">Balance</p>
                                      <p className="font-bold text-base text-orange-600">₹{invoice.balance_amount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                      <Badge variant={
                                        invoice.status === 'paid' ? 'default' :
                                        invoice.status === 'partial' ? 'secondary' : 'destructive'
                                      } className="text-xs px-3 py-1">
                                        {invoice.status}
                                      </Badge>
                                      {invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
                                        <p className="text-xs text-red-600 mt-1">
                                          {Math.ceil((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))} days overdue
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                      {customerDetailLoading ? (
                        <div className="flex justify-center py-6">
                          <LoadingSpinner />
                        </div>
                      ) : customerPayments.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            No payment history
                          </h3>
                          <p className="text-xs text-gray-500">This customer hasn't made any payments yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {customerPayments.map((payment) => (
                            <Card key={payment.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 min-w-0">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                      <CreditCard className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-base">₹{payment.amount.toLocaleString()}</p>
                                      <p className="text-sm text-gray-500">
                                        {new Date(payment.payment_date).toLocaleDateString()} at {new Date(payment.payment_date).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-6 text-sm">
                                    <div className="text-center">
                                      <p className="text-gray-500 text-xs">Invoice</p>
                                      <p className="font-semibold break-all">{payment.invoice_number}</p>
                                    </div>
                                    <div className="text-center">
                                      <Badge variant="outline" className="text-xs px-3 py-1">{payment.payment_method}</Badge>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-gray-500 text-xs">Reference</p>
                                      <p className="font-semibold break-all">{payment.reference_number || '-'}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

