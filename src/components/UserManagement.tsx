'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Users, Plus, Edit, Trash2, Search, Filter, Eye, EyeOff, 
  ChevronLeft, ChevronRight, Crown, Shield, User, Mail, Calendar,
  Activity, ShoppingBag, Server, ToggleLeft, ToggleRight,
  Wallet, ArrowDownCircle, ArrowUpCircle, DollarSign, TrendingUp,
  CreditCard, PiggyBank, HandCoins, Receipt, BanknoteIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN' | 'OWNER'
  isActive: boolean
  avatar: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  balance: number // Add balance field
  _count: {
    orders: number
    services: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  
  // Balance management states
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawReason, setWithdrawReason] = useState('')
  const [updatingBalance, setUpdatingBalance] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'OWNER',
    isActive: true
  })

  const [editFormData, setEditFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'OWNER',
    isActive: true
  })

  const getToken = () => localStorage.getItem('auth_token')

  const fetchUsers = async () => {
    try {
      const token = getToken()
      if (!token) return

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        role: roleFilter,
        status: statusFilter
      })

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, search, roleFilter, statusFilter])

  const handleCreateUser = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setFormData({
          email: '',
          name: '',
          password: '',
          role: 'USER',
          isActive: true
        })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      alert('Failed to create user')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        setShowEditDialog(false)
        setSelectedUser(null)
        setEditFormData({
          email: '',
          name: '',
          password: '',
          role: 'USER',
          isActive: true
        })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
      alert('Failed to update user status')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
      isActive: user.isActive
    })
    setShowEditDialog(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4" />
      case 'ADMIN':
        return <Shield className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-gradient-to-r from-violet-600 to-purple-600'
      case 'ADMIN':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600'
      default:
        return 'bg-gradient-to-r from-gray-600 to-slate-600'
    }
  }

  // Balance management functions
  const openBalanceDialog = (user: User) => {
    setSelectedUser(user)
    setShowBalanceDialog(true)
  }

  const openWithdrawDialog = (user: User) => {
    setSelectedUser(user)
    setWithdrawAmount('')
    setWithdrawReason('')
    setShowWithdrawDialog(true)
  }

  const handleWithdrawBalance = async () => {
    if (!selectedUser || !withdrawAmount) return

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (amount > selectedUser.balance) {
      alert('Insufficient balance')
      return
    }

    setUpdatingBalance(true)
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/users/${selectedUser.id}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'withdraw',
          amount,
          reason: withdrawReason || 'Balance withdrawal by admin'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShowWithdrawDialog(false)
        setSelectedUser(null)
        setWithdrawAmount('')
        setWithdrawReason('')
        fetchUsers()
        alert(`✅ Successfully withdrew ${formatRupiah(amount)} from ${selectedUser.name || selectedUser.email}\n💳 New balance: ${formatRupiah(data.newBalance)}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to withdraw balance')
      }
    } catch (error) {
      console.error('Failed to withdraw balance:', error)
      alert('Failed to withdraw balance')
    } finally {
      setUpdatingBalance(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              User Management
            </span>
          </h2>
          <p className="text-purple-300">Manage system users and permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-violet-500/30 shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New User
              </DialogTitle>
              <DialogDescription className="text-purple-300">
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/40 border-violet-500/30 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-white font-medium">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-black/40 border-violet-500/30 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-black/40 border-white/20 text-white pr-10 placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-violet-400 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="role" className="text-white font-medium">Role</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-black/40 border-violet-500/30 text-white focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-violet-500/30 shadow-2xl">
                    <SelectItem value="USER" className="text-white hover:bg-violet-500/20 focus:bg-violet-500/20">User</SelectItem>
                    <SelectItem value="ADMIN" className="text-white hover:bg-violet-500/20 focus:bg-violet-500/20">Admin</SelectItem>
                    <SelectItem value="OWNER" className="text-white hover:bg-violet-500/20 focus:bg-violet-500/20">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="bg-white/10 border-violet-500/30 text-white hover:bg-white/20 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser} 
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40"
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder-gray-400 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-black/20 border-white/10 text-white focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-violet-500/30 shadow-2xl">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-black/20 border-white/10 text-white focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-violet-500/30 shadow-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-purple-300">User</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Balance</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Orders</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Services</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Last Login</th>
                  <th className="text-left p-4 text-sm font-medium text-purple-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          getRoleColor(user.role)
                        )}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name || 'Unknown'}</p>
                          <p className="text-purple-300 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "text-white",
                        getRoleColor(user.role)
                      )}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-white font-medium">{formatRupiah(user.balance)}</p>
                          <p className="text-xs text-purple-300">Available</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={cn(
                          "p-2 rounded-lg border transition-all duration-200 hover:scale-105",
                          user.isActive 
                            ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" 
                            : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                        )}
                      >
                        {user.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-red-400" />
                        )}
                      </Button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-purple-300">
                        <ShoppingBag className="w-4 h-4" />
                        {user._count.orders}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-purple-300">
                        <Server className="w-4 h-4" />
                        {user._count.services}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-purple-300 text-sm">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openBalanceDialog(user)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200"
                          title="View Balance Details"
                        >
                          <Wallet className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openWithdrawDialog(user)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-200"
                          title="Withdraw Balance"
                          disabled={user.balance <= 0}
                        >
                          <ArrowDownCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-red-500/30 shadow-2xl shadow-black/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                Delete User
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-purple-300">
                                Are you sure you want to delete <span className="text-white font-semibold">{user.name || user.email}</span>? This action cannot be undone and will remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="bg-white/10 border-red-500/30 text-white hover:bg-white/20 transition-all duration-200">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-red-500/40"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-purple-300 text-sm">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="bg-black/20 border-white/10 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white px-3">
            {pagination.page} / {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="bg-black/20 border-white/10 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-purple-300">
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email" className="text-white font-medium">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-name" className="text-white font-medium">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="edit-password" className="text-white font-medium">New Password (leave empty to keep current)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showEditPassword ? 'text' : 'password'}
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="bg-black/40 border-white/20 text-white pr-10 placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-role" className="text-white font-medium">Role</Label>
              <Select value={editFormData.role} onValueChange={(value: any) => setEditFormData({ ...editFormData, role: value })}>
                <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl">
                  <SelectItem value="USER" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">User</SelectItem>
                  <SelectItem value="ADMIN" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">Admin</SelectItem>
                  <SelectItem value="OWNER" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="bg-white/10 border-cyan-500/30 text-white hover:bg-white/20 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser} 
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:shadow-cyan-500/40"
            >
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Details Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-emerald-500/30 shadow-2xl shadow-black/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Balance Details - {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription className="text-purple-300">
              View user's current balance and transaction history
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Current Balance Card */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-300 text-sm mb-1">Current Balance</p>
                    <p className="text-3xl font-bold text-white">{formatRupiah(selectedUser.balance)}</p>
                    <p className="text-emerald-300 text-xs mt-1">Available for withdrawal</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                    <PiggyBank className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowBalanceDialog(false)
                    openWithdrawDialog(selectedUser)
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200"
                  disabled={selectedUser.balance <= 0}
                >
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Withdraw Balance
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button 
              onClick={() => setShowBalanceDialog(false)}
              className="bg-white/10 border-emerald-500/30 text-white hover:bg-white/20 transition-all duration-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Balance Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-amber-500/30 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5" />
              Withdraw Balance - {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription className="text-purple-300">
              Withdraw balance from user's wallet
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* Current Balance Display */}
              <div className="bg-amber-600/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 text-sm">Available Balance</span>
                  <span className="text-white font-bold">{formatRupiah(selectedUser.balance)}</span>
                </div>
              </div>

              {/* Withdraw Amount */}
              <div>
                <Label htmlFor="withdrawAmount" className="text-white font-medium">Withdraw Amount</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-black/40 border-amber-500/30 text-white placeholder-gray-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
                  placeholder="Enter amount to withdraw"
                  min="0"
                  max={selectedUser.balance}
                />
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="withdrawReason" className="text-white font-medium">Reason (Optional)</Label>
                <textarea
                  id="withdrawReason"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full bg-black/40 border-amber-500/30 text-white placeholder-gray-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 rounded-md p-3 min-h-[80px] resize-none"
                  placeholder="Enter reason for withdrawal..."
                />
              </div>

              {/* Warning */}
              {withdrawAmount && parseFloat(withdrawAmount) > selectedUser.balance && (
                <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">⚠️ Insufficient balance</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawDialog(false)}
              className="bg-white/10 border-amber-500/30 text-white hover:bg-white/20 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleWithdrawBalance}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (selectedUser?.balance || 0) || updatingBalance}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/40"
            >
              {updatingBalance ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <HandCoins className="w-4 h-4 mr-2" />
                  Withdraw {withdrawAmount ? formatRupiah(parseFloat(withdrawAmount)) : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}