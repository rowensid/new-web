'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManageOrderModal } from '@/components/admin/ManageOrderModal'
import { 
  ShoppingCart, 
  Search, Filter, ChevronLeft, ChevronRight, Eye, 
  CheckCircle, XCircle, Clock, AlertCircle, User, DollarSign,
  Calendar, RefreshCw, Package, Server, Gamepad2, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRupiah, formatUSD } from '@/lib/currency'
import ApiClient from '@/lib/api-client'

interface Order {
  id: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  title: string
  type: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  paymentMethod: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  serviceStatus?: string
  config?: any
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

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showUSD, setShowUSD] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('')
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)

  const getToken = () => localStorage.getItem('auth_token')

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        userId: userFilter
      })

      const response = await ApiClient.get(`/api/admin/orders?${params}`)

      if (response.ok) {
        const data: OrdersResponse = await response.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, statusFilter, userFilter])

  const handleManageOrder = async (orderId: string, data: { status?: string; adminNotes?: string }) => {
    try {
      const response = await ApiClient.put(`/api/admin/orders/${orderId}`, data)

      if (response.ok) {
        fetchOrders()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      alert('Failed to update order')
    }
  }

  const openManageDialog = (order: Order) => {
    setSelectedOrder(order)
    setShowManageDialog(true)
  }

  const handleResetOrders = async () => {
    setResetting(true)
    try {
      // Use direct database deletion via a simple API call
      const response = await ApiClient.delete('/api/orders/reset')

      if (response.ok) {
        const data = await response.json()
        setShowResetDialog(false)
        fetchOrders()
        alert(`✅ ${data.message}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reset orders')
      }
    } catch (error) {
      console.error('Failed to reset orders:', error)
      alert('Failed to reset orders')
    } finally {
      setResetting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'CANCELLED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      case 'REFUNDED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      case 'REFUNDED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RDP': return <Server className="w-4 h-4" />
      case 'GAME_HOSTING': return <Gamepad2 className="w-4 h-4" />
      case 'FIVEM_DEVELOPMENT': return <Gamepad2 className="w-4 h-4" />
      case 'ROBLOX_DEVELOPMENT': return <Gamepad2 className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
      case 'ADMIN': return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
      case 'USER': return 'bg-gradient-to-r from-gray-600 to-slate-600 text-white'
      default: return 'bg-gray-600 text-white'
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              Order Management
            </span>
          </h2>
          <p className="text-purple-300">Kelola semua pesanan dari member</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUSD(!showUSD)}
            className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition-all duration-200"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {showUSD ? 'IDR Only' : 'IDR / USD'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-pink-500/20">
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
                  className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-black/40 border-pink-500/30 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-pink-500/30">
                  <SelectItem value="all" className="text-white hover:bg-pink-500/20">All Status</SelectItem>
                  <SelectItem value="PENDING" className="text-white hover:bg-pink-500/20">Pending</SelectItem>
                  <SelectItem value="COMPLETED" className="text-white hover:bg-pink-500/20">Completed</SelectItem>
                  <SelectItem value="CANCELLED" className="text-white hover:bg-pink-500/20">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED" className="text-white hover:bg-pink-500/20">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">User Email</Label>
              <Input
                placeholder="Filter by user email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-pink-500/20">
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
                <tr className="border-b border-pink-500/20">
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Service</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Payment</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-pink-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-pink-500/10 hover:bg-pink-500/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-pink-300 font-mono text-sm font-bold">{getInvoiceNumber(order.id)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-white text-sm">{order.user.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getRoleColor(order.user.role))}>
                            {order.user.role}
                          </Badge>
                          <span className="text-gray-400 text-xs">{order.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(order.type)}
                          <span className="text-white text-sm">{order.title}</span>
                        </div>
                        {order.serviceStatus && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {order.serviceStatus}
                          </Badge>
                        )}
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
                      <span className="text-gray-300 text-sm capitalize">{order.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(order.status))}>
                        {getStatusIcon(order.status)}
                        <span className="text-xs">{order.status}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-300 text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openManageDialog(order)}
                        className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300"
                      >
                        Manage Order
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-pink-500/20">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-white px-3">
                  {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Order Modal */}
      <ManageOrderModal
        order={selectedOrder}
        isOpen={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        onUpdate={handleManageOrder}
      />
    </div>
  )
}