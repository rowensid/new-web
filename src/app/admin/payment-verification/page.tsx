'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ShoppingCart, 
  Search, Filter, Eye, 
  CheckCircle, XCircle, Clock, AlertCircle, User, DollarSign,
  Calendar, RefreshCw, Package, Server, Gamepad2, Image,
  CreditCard, Banknote, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRupiah, formatUSD } from '@/lib/currency'
import Logo from '@/components/logo'
import ProfileDropdown from '@/components/ProfileDropdown'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface Order {
  id: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  service: {
    name: string
    type: string
    description: string
    status: string
    config: any
  }
  amount: number
  status: 'PENDING' | 'VALIDATING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  paymentMethod: string
  paymentProof?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function PaymentVerificationPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [showUSD, setShowUSD] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('VALIDATING')
  const [userFilter, setUserFilter] = useState('')
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showProofDialog, setShowProofDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'OWNER') {
        router.push('/member-dashboard')
        return
      }
      setUser(parsedUser)
    } catch (error) {
      console.error('Failed to parse user data:', error)
      router.push('/login')
      return
    }

    setLoading(false)
  }, [router])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, pagination.page, statusFilter, userFilter])

  const getToken = () => localStorage.getItem('auth_token')

  const fetchOrders = async () => {
    try {
      const token = getToken()
      if (!token) return

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        userId: userFilter
      })

      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data: OrdersResponse = await response.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const handleVerifyPayment = async (orderId: string, approved: boolean, notes?: string) => {
    setUpdating(true)
    setError('')
    
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          status: approved ? 'COMPLETED' : 'CANCELLED',
          adminNotes: notes || ''
        })
      })

      if (response.ok) {
        setShowDetailDialog(false)
        setShowProofDialog(false)
        setSelectedOrder(null)
        setAdminNotes('')
        fetchOrders()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Failed to verify payment:', error)
      setError('Failed to verify payment')
    } finally {
      setUpdating(false)
    }
  }

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order)
    setAdminNotes(order.adminNotes || '')
    setShowDetailDialog(true)
  }

  const openProofDialog = (order: Order) => {
    setSelectedOrder(order)
    setShowProofDialog(true)
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('/api/auth/logout', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      router.push('/gateway')
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      router.push('/gateway')
    }
  }

  const handleSettings = () => {
    console.log('Navigate to settings')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'VALIDATING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'CANCELLED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      case 'REFUNDED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'VALIDATING': return <Eye className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      case 'REFUNDED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'transfer': return <Banknote className="w-4 h-4" />
      case 'ewallet': return <CreditCard className="w-4 h-4" />
      case 'qris': return <DollarSign className="w-4 h-4" />
      default: return <CreditCard className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInvoiceNumber = (orderId: string) => {
    // Extract numeric part dari ID dan format jadi invoice number
    const numericId = orderId.replace(/\D/g, '').slice(-6)
    const invoiceNum = parseInt(numericId, 36) % 99999 + 1
    return `#${invoiceNum.toString().padStart(5, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:60px_60px]"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Logo size="sm" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    Payment Verification
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProfileDropdown 
                  user={user} 
                  onLogout={handleLogout}
                  onSettings={handleSettings}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Alert className="mb-6 bg-rose-500/20 border-rose-500/30 backdrop-blur-xl">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <AlertDescription className="text-rose-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Payment Verification
                </span>
              </h2>
              <p className="text-purple-300">Review and verify customer payment proofs</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUSD(!showUSD)}
                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all duration-200"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {showUSD ? 'IDR Only' : 'IDR / USD'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="VALIDATING" className="text-white hover:bg-slate-700">Validating</SelectItem>
                      <SelectItem value="PENDING" className="text-white hover:bg-slate-700">Pending</SelectItem>
                      <SelectItem value="COMPLETED" className="text-white hover:bg-slate-700">Completed</SelectItem>
                      <SelectItem value="CANCELLED" className="text-white hover:bg-slate-700">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">User Email</Label>
                  <Input
                    placeholder="Filter by user email..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Orders ({pagination.total})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Order ID</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Service</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Payment</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-violet-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-violet-300 font-mono text-sm font-bold">{getInvoiceNumber(order.id)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-white text-sm">{order.user.name || 'Unknown'}</span>
                            </div>
                            <span className="text-gray-400 text-xs">{order.user.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-violet-400" />
                              <span className="text-white text-sm">{order.service.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                              {order.service.type}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-white font-medium">
                              {showUSD ? formatUSD(order.amount) : formatRupiah(order.amount)}
                            </div>
                            {!showUSD && (
                              <div className="text-gray-400 text-xs">
                                ≈ {formatUSD(order.amount)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(order.paymentMethod)}
                            <span className="text-gray-300 text-sm capitalize">{order.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(order.status))}>
                            {getStatusIcon(order.status)}
                            <span className="text-xs">{order.status}</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-300 text-sm">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {order.paymentProof && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openProofDialog(order)}
                                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"
                              >
                                <Image className="w-4 h-4 mr-1" />
                                Proof
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailDialog(order)}
                              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
                  <div className="text-sm text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                    >
                      Previous
                    </Button>
                    <span className="text-gray-300 px-3">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Payment Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Payment Proof</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the payment proof uploaded by customer
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Order ID:</span>
                  <span className="text-white ml-2 font-mono">{selectedOrder.id.slice(0, 12)}...</span>
                </div>
                <div>
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white ml-2">{formatRupiah(selectedOrder.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Customer:</span>
                  <span className="text-white ml-2">{selectedOrder.user.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="text-white ml-2 capitalize">{selectedOrder.paymentMethod}</span>
                </div>
              </div>
              
              {selectedOrder.paymentProof && (
                <div className="space-y-2">
                  <Label className="text-white text-sm">Payment Proof Image:</Label>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <img 
                      src={selectedOrder.paymentProof} 
                      alt="Payment proof uploaded by customer"
                      className="w-full h-auto max-h-96 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowProofDialog(false)}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowProofDialog(false)
                    openDetailDialog(selectedOrder)
                  }}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  Review & Verify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Review Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Verify and approve or reject this payment
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Order ID:</span>
                  <span className="text-white ml-2 font-mono">{selectedOrder.id.slice(0, 12)}...</span>
                </div>
                <div>
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white ml-2">{formatRupiah(selectedOrder.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Customer:</span>
                  <span className="text-white ml-2">{selectedOrder.user.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white ml-2 text-xs">{selectedOrder.user.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white text-sm">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this verification..."
                  className="bg-slate-900/50 border-slate-600 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleVerifyPayment(selectedOrder.id, false, adminNotes)}
                  variant="destructive"
                  disabled={updating}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerifyPayment(selectedOrder.id, true, adminNotes)}
                  disabled={updating}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}