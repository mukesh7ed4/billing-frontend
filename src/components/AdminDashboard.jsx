import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Store, 
  Users, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  LogOut,
  Moon,
  Sun,
  Shield
} from 'lucide-react'
import { useTheme } from 'next-themes'
import LoadingSpinner from './ui/LoadingSpinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [shops, setShops] = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  
  const { api, logout, user } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, shopsData, verificationsData] = await Promise.all([
        api.getAdminDashboard(),
        api.getAllShops({ limit: 10 }),
        api.getPaymentVerifications({ limit: 10 })
      ])
      
      setStats(statsData)
      setShops(shopsData.shops)
      setVerifications(verificationsData.verifications)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleShopAction = async (shopId, action) => {
    try {
      setActionLoading(shopId)
      if (action === 'activate') {
        await api.activateShop(shopId)
      } else {
        await api.deactivateShop(shopId)
      }
      await loadDashboardData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePaymentAction = async (verificationId, action, notes = '') => {
    try {
      setActionLoading(verificationId)
      if (action === 'verify') {
        await api.verifyPayment(verificationId, { admin_notes: notes })
      } else {
        await api.rejectPayment(verificationId, { admin_notes: notes })
      }
      await loadDashboardData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.username}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_shops || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.active_shops || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending_verifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Payment verifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.total_revenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                From verified payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="shops" className="space-y-6">
          <TabsList>
            <TabsTrigger value="shops">Shops Management</TabsTrigger>
            <TabsTrigger value="payments">Payment Verifications</TabsTrigger>
          </TabsList>

          <TabsContent value="shops">
            <Card>
              <CardHeader>
                <CardTitle>Recent Shops</CardTitle>
                <CardDescription>
                  Manage shop registrations and activations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shops.map((shop) => (
                      <TableRow key={shop.id}>
                        <TableCell className="font-medium">{shop.shop_name}</TableCell>
                        <TableCell>{shop.owner_name}</TableCell>
                        <TableCell>{shop.email}</TableCell>
                        <TableCell>
                          <Badge variant={shop.is_active ? 'default' : 'secondary'}>
                            {shop.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={shop.is_active ? 'destructive' : 'default'}
                            onClick={() => handleShopAction(shop.id, shop.is_active ? 'deactivate' : 'activate')}
                            disabled={actionLoading === shop.id}
                          >
                            {actionLoading === shop.id ? (
                              <LoadingSpinner size="sm" />
                            ) : shop.is_active ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Verifications</CardTitle>
                <CardDescription>
                  Review and verify payment submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell className="font-medium">
                          {verification.shop?.shop_name || 'Unknown'}
                        </TableCell>
                        <TableCell>₹{verification.amount.toLocaleString()}</TableCell>
                        <TableCell>{verification.payment_method}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              verification.status === 'verified' ? 'default' :
                              verification.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {verification.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {verification.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handlePaymentAction(verification.id, 'verify')}
                                disabled={actionLoading === verification.id}
                              >
                                {actionLoading === verification.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Verify
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePaymentAction(verification.id, 'reject')}
                                disabled={actionLoading === verification.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

