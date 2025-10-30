'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import ImageUpload from '@/components/ui/image-upload'
import { 
  DollarSign, 
  Search, Filter, ChevronLeft, ChevronRight, Eye, 
  CheckCircle, XCircle, Clock, AlertCircle, User, CreditCard,
  Calendar, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity,
  Download, Upload, QrCode, BanknoteIcon, Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRupiah, formatUSD } from '@/lib/currency'
import ApiClient from '@/lib/api-client'

interface Deposit {
  id: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  amount: number
  paymentMethod: string
  status: 'PENDING' | 'VALIDATING' | 'APPROVED' | 'REJECTED'
  proofUrl?: string
  adminNotes?: string
  createdAt: string
  processedAt?: string
  processedBy?: string
}

interface DepositsResponse {
  deposits: Deposit[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface DepositStats {
  totalDeposits: number
  pendingDeposits: number
  approvedDeposits: number
  rejectedDeposits: number
  totalAmount: number
  pendingAmount: number
  approvedAmount: number
  rejectedAmount: number
}

export default function DepositManagement() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
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
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState<DepositStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [updatedProofUrl, setUpdatedProofUrl] = useState<string>('')

  useEffect(() => {
    fetchDeposits()
    fetchStats()
  }, [pagination.page, statusFilter, userFilter])

  const fetchDeposits = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        userId: userFilter
      })

      const response = await ApiClient.get(`/api/admin/deposits?${params}`)

      if (response.ok) {
        const data: DepositsResponse = await response.json()
        setDeposits(data.deposits)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await ApiClient.get('/api/admin/deposits?limit=1000')
      
      if (response.ok) {
        const data = await response.json()
        const deposits = data.deposits
        
        const calculatedStats: DepositStats = {
          totalDeposits: deposits.length,
          pendingDeposits: deposits.filter((d: Deposit) => d.status === 'PENDING').length,
          approvedDeposits: deposits.filter((d: Deposit) => d.status === 'APPROVED').length,
          rejectedDeposits: deposits.filter((d: Deposit) => d.status === 'REJECTED').length,
          totalAmount: deposits.reduce((sum: number, d: Deposit) => sum + d.amount, 0),
          pendingAmount: deposits.filter((d: Deposit) => d.status === 'PENDING').reduce((sum: number, d: Deposit) => sum + d.amount, 0),
          approvedAmount: deposits.filter((d: Deposit) => d.status === 'APPROVED').reduce((sum: number, d: Deposit) => sum + d.amount, 0),
          rejectedAmount: deposits.filter((d: Deposit) => d.status === 'REJECTED').reduce((sum: number, d: Deposit) => sum + d.amount, 0),
        }
        
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleUpdateDeposit = async (status: string) => {
    if (!selectedDeposit) return

    setUpdating(true)
    try {
      const response = await ApiClient.put('/api/admin/deposits', {
        depositId: selectedDeposit.id,
        status,
        adminNotes: adminNotes.trim() || undefined,
        proofUrl: updatedProofUrl || selectedDeposit.proofUrl
      })

      if (response.ok) {
        const data = await response.json()
        setShowManageDialog(false)
        setSelectedDeposit(null)
        setAdminNotes('')
        fetchDeposits()
        fetchStats()
        
        // Show success message with more details
        let message = `✅ Deposit ${status.toLowerCase()} successfully!`
        if (status === 'APPROVED' && data.transaction) {
          message += `\n💰 Transaction ID: ${data.transaction.id}\n💳 Balance updated for user!`
        }
        alert(message)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update deposit')
      }
    } catch (error) {
      console.error('Failed to update deposit:', error)
      alert('Failed to update deposit')
    } finally {
      setUpdating(false)
    }
  }

  const openManageDialog = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setAdminNotes(deposit.adminNotes || '')
    setUpdatedProofUrl('')
    setShowManageDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'VALIDATING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'REJECTED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'VALIDATING': return <Eye className="w-4 h-4" />
      case 'REJECTED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'QRIS': return <QrCode className="w-4 h-4" />
      case 'BCA':
      case 'BNI':
      case 'BRI':
      case 'MANDIRI': return <BanknoteIcon className="w-4 h-4" />
      case 'GOPAY':
      case 'OVO':
      case 'DANA':
      case 'SHOPEEPAY': return <Smartphone className="w-4 h-4" />
      default: return <CreditCard className="w-4 h-4" />
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

  const statCards = [
    {
      title: 'Total Deposits',
      value: stats?.totalDeposits || 0,
      change: stats?.pendingDeposits || 0,
      changeType: 'pending' as const,
      icon: Wallet,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-gradient-to-br from-violet-600/20 to-purple-600/20',
      borderColor: 'border-violet-500/30',
      description: `${stats?.pendingDeposits || 0} pending`
    },
    {
      title: 'Total Amount',
      value: showUSD ? formatUSD(stats?.totalAmount || 0) : formatRupiah(stats?.totalAmount || 0),
      change: stats?.approvedAmount || 0,
      changeType: 'approved' as const,
      icon: DollarSign,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30',
      description: `${showUSD ? formatUSD(stats?.approvedAmount || 0) : formatRupiah(stats?.approvedAmount || 0)} approved`
    },
    {
      title: 'Approved Rate',
      value: stats?.totalDeposits ? `${Math.round((stats.approvedDeposits / stats.totalDeposits) * 100)}%` : '0%',
      change: 0,
      changeType: 'neutral' as const,
      icon: TrendingUp,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-600/20 to-orange-600/20',
      borderColor: 'border-amber-500/30',
      description: 'Success rate'
    },
    {
      title: 'Pending Amount',
      value: showUSD ? formatUSD(stats?.pendingAmount || 0) : formatRupiah(stats?.pendingAmount || 0),
      change: stats?.pendingDeposits || 0,
      changeType: 'pending' as const,
      icon: Clock,
      color: 'from-rose-600 to-pink-600',
      bgColor: 'bg-gradient-to-br from-rose-600/20 to-pink-600/20',
      borderColor: 'border-rose-500/30',
      description: `${stats?.pendingDeposits || 0} deposits`
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Deposit Management
            </span>
          </h2>
          <p className="text-purple-300">Manage all wallet top-up requests from users</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUSD(!showUSD)}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all duration-200"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {showUSD ? 'IDR Only' : 'IDR / USD'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDeposits()
              fetchStats()
            }}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className={cn("bg-gray-900/50 backdrop-blur-xl border", stat.borderColor)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{stat.description}</p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                  <stat.icon className={cn("w-6 h-6", stat.color.replace('from-', 'text-').split(' ')[0])} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-emerald-500/20">
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
                  placeholder="Search deposits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-black/40 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-black/40 border-emerald-500/30 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-emerald-500/30">
                  <SelectItem value="all" className="text-white hover:bg-emerald-500/20">All Status</SelectItem>
                  <SelectItem value="PENDING" className="text-white hover:bg-emerald-500/20">Pending</SelectItem>
                  <SelectItem value="VALIDATING" className="text-white hover:bg-emerald-500/20">Validating</SelectItem>
                  <SelectItem value="APPROVED" className="text-white hover:bg-emerald-500/20">Approved</SelectItem>
                  <SelectItem value="REJECTED" className="text-white hover:bg-emerald-500/20">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">User Email</Label>
              <Input
                placeholder="Filter by user email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposits Table */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-emerald-500/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Deposits ({pagination.total})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-500/20">
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-emerald-300 font-mono text-sm">{deposit.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-white text-sm">{deposit.user.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getRoleColor(deposit.user.role))}>
                            {deposit.user.role}
                          </Badge>
                          <span className="text-gray-400 text-xs">{deposit.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-white font-medium">
                          {showUSD ? formatUSD(deposit.amount) : formatRupiah(deposit.amount)}
                        </div>
                        {!showUSD && (
                          <div className="text-gray-400 text-xs">
                            ≈ {formatUSD(deposit.amount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(deposit.paymentMethod)}
                        <span className="text-gray-300 text-sm">{deposit.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(deposit.status))}>
                        {getStatusIcon(deposit.status)}
                        <span className="text-xs">{deposit.status}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-300 text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(deposit.createdAt)}
                        </div>
                        {deposit.processedAt && (
                          <div className="text-gray-400 text-xs">
                            Processed: {formatDate(deposit.processedAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openManageDialog(deposit)}
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-emerald-500/20">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} deposits
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-emerald-300 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Deposit Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="bg-gray-900 border-emerald-500/30 text-white max-w-5xl w-full max-h-[85vh] overflow-hidden">
          {/* Fixed Header */}
          <DialogHeader className="px-6 py-4 border-b border-emerald-500/20">
            <DialogTitle className="text-emerald-400 flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5" />
              Manage Deposit Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedDeposit && (
            <>
              {/* Scrollable Content - Hidden Scrollbar */}
              <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-hide">
                {/* Deposit Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                    <Label className="text-gray-400 text-xs">Deposit ID</Label>
                    <p className="text-emerald-300 font-mono text-sm mt-1">{selectedDeposit.id.slice(0, 8)}...</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                    <Label className="text-gray-400 text-xs">Amount</Label>
                    <p className="text-white font-semibold text-base mt-1">{formatRupiah(selectedDeposit.amount)}</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                    <Label className="text-gray-400 text-xs">Method</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {getPaymentMethodIcon(selectedDeposit.paymentMethod)}
                      <p className="text-white text-sm">{selectedDeposit.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/20">
                    <Label className="text-gray-400 text-xs">Status</Label>
                    <div className="mt-1">
                      <Badge className={cn("text-xs", getStatusColor(selectedDeposit.status))}>
                        {getStatusIcon(selectedDeposit.status)}
                        <span className="ml-1">{selectedDeposit.status}</span>
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20">
                  <Label className="text-gray-400 text-sm font-medium mb-3 block">User Information</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedDeposit.user.name}</p>
                        <p className="text-gray-400 text-sm">{selectedDeposit.user.email}</p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", getRoleColor(selectedDeposit.user.role))}>
                      {selectedDeposit.user.role}
                    </Badge>
                  </div>
                </div>

                {/* Payment Proof */}
                <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20">
                  <Label className="text-gray-400 text-sm font-medium mb-3 block">Payment Proof</Label>
                  <ImageUpload
                    value={updatedProofUrl || selectedDeposit.proofUrl || ''}
                    onChange={setUpdatedProofUrl}
                    placeholder="Upload new payment proof or replace existing"
                    maxSize={3072}
                    compress={true}
                    className="w-full"
                  />
                  {(updatedProofUrl || selectedDeposit.proofUrl) && (
                    <div className="mt-3 text-xs text-gray-400 bg-emerald-500/10 rounded p-2">
                      <span>✅ Image compressed for faster loading</span>
                      <br />
                      <span>💡 Click image to view full size</span>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                <div className="bg-black/40 rounded-lg p-4 border border-emerald-500/20">
                  <Label className="text-gray-400 text-sm font-medium mb-3 block">Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this deposit..."
                    className="bg-black/60 border-gray-600 text-white placeholder-gray-400 resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Fixed Footer Actions */}
              <div className="px-6 py-4 border-t border-emerald-500/20 bg-gray-900/50">
                <div className="flex gap-3 justify-end">
                  {selectedDeposit.status !== 'APPROVED' && (
                    <Button
                      onClick={() => handleUpdateDeposit('APPROVED')}
                      disabled={updating}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  )}
                  {selectedDeposit.status !== 'REJECTED' && (
                    <Button
                      onClick={() => handleUpdateDeposit('REJECTED')}
                      disabled={updating}
                      variant="destructive"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowManageDialog(false)}
                    className="border-gray-600 text-gray-400 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}