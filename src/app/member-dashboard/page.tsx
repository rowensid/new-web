'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  User, 
  Store, 
  Package, 
  Settings, 
  LogOut, 
  TrendingUp,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Activity,
  Server,
  Gamepad2,
  Home,
  CreditCard,
  History,
  Star,
  Heart,
  Download,
  Upload,
  Shield,
  Bell,
  Menu,
  X,
  ChevronRight,
  Zap,
  Trophy,
  Target,
  Flame,
  Sparkles,
  Gift,
  Crown,
  Diamond,
  Rocket,
  Gauge,
  BarChart3,
  Wallet,
  FileText,
  HelpCircle,
  MessageSquare,
  Calendar,
  UserCheck,
  Cpu,
  Database,
  Wifi,
  Globe,
  Smartphone,
  Filter,
  Search
} from 'lucide-react'
import Logo from '@/components/logo'
import TopUpWallet from '@/components/TopUpWallet'
import ProfileDropdown from '@/components/ProfileDropdown'
import EditProfileModal from '@/components/EditProfileModal'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface DashboardStats {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalSpent: number
  activeServices: number
  completionRate: number
}

interface Order {
  id: string
  title: string
  type: string
  amount: number
  status: string
  paymentMethod: string
  adminNotes?: string
  createdAt: string
  serviceStatus?: string
}

interface StoreItem {
  id: string
  title: string
  description: string
  price: number
  category: string
  imageUrl?: string
  featured: boolean
}

export default function MemberDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [storeItems, setStoreItems] = useState<StoreItem[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingStore, setLoadingStore] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Failed to parse user data:', error)
      router.push('/login')
      return
    }

    setLoading(false)
  }, [router])

  useEffect(() => {
    if (user && mounted) {
      fetchDashboardData()
      fetchStoreItems()
    }
  }, [user, mounted])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentOrders(data.recentOrders)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchStoreItems = async () => {
    try {
      const response = await fetch('/api/store?limit=6&featured=true')
      if (response.ok) {
        const data = await response.json()
        setStoreItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch store items:', error)
    } finally {
      setLoadingStore(false)
    }
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
    setEditProfileOpen(true)
  }

  const refreshUserData = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        localStorage.setItem('user_data', JSON.stringify(userData.user))
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  const handleEditProfile = () => {
    setEditProfileOpen(true)
  }

  const handleChangePassword = () => {
    setChangePasswordOpen(true)
  }

  const handleUserUpdate = (updatedUser: UserData) => {
    setUser(updatedUser)
    // Update localStorage
    localStorage.setItem('user_data', JSON.stringify(updatedUser))
  }

  const handlePurchaseItem = (item: StoreItem) => {
    router.push(`/member-dashboard/order?serviceId=${item.id}`)
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'CANCELLED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MOD': return <Gamepad2 className="w-5 h-5" />
      case 'GAME': return <Gamepad2 className="w-5 h-5" />
      case 'HOSTING': return <Server className="w-5 h-5" />
      case 'SERVER': return <Server className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Loading Dashboard
              </h2>
              <p className="text-purple-300 text-sm animate-pulse">Preparing your workspace...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const menuItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <Home className="w-5 h-5" />, 
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-violet-600/10',
      borderColor: 'border-violet-500/30'
    },
    { 
      id: 'store', 
      label: 'Store', 
      icon: <Store className="w-5 h-5" />, 
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-500/30'
    },
    { 
      id: 'orders', 
      label: 'My Orders', 
      icon: <ShoppingCart className="w-5 h-5" />, 
      color: 'from-pink-600 to-rose-600',
      bgColor: 'bg-pink-600/10',
      borderColor: 'border-pink-500/30'
    },
    { 
      id: 'services', 
      label: 'Services', 
      icon: <Server className="w-5 h-5" />, 
      color: 'from-cyan-600 to-blue-600',
      bgColor: 'bg-cyan-600/10',
      borderColor: 'border-cyan-500/30'
    },
    { 
      id: 'database', 
      label: 'Database', 
      icon: <Database className="w-5 h-5" />, 
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-600/10',
      borderColor: 'border-emerald-500/30'
    },
    { 
      id: 'wallet', 
      label: 'Wallet', 
      icon: <Wallet className="w-5 h-5" />, 
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-amber-600/10',
      borderColor: 'border-amber-500/30'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: <User className="w-5 h-5" />, 
      color: 'from-rose-600 to-pink-600',
      bgColor: 'bg-rose-600/10',
      borderColor: 'border-rose-500/30'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      color: 'from-slate-600 to-gray-600',
      bgColor: 'bg-slate-600/10',
      borderColor: 'border-slate-500/30'
    },
  ]

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: stats?.pendingOrders || 0,
      changeType: 'pending' as const,
      icon: ShoppingCart,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-gradient-to-br from-violet-600/20 to-purple-600/20',
      borderColor: 'border-violet-500/30',
      description: `${stats?.pendingOrders || 0} pending`
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats?.totalSpent || 0),
      change: stats?.completedOrders || 0,
      changeType: 'completed' as const,
      icon: DollarSign,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30',
      description: `${stats?.completedOrders || 0} completed`
    },
    {
      title: 'Active Services',
      value: stats?.activeServices || 0,
      change: 0,
      changeType: 'neutral' as const,
      icon: Server,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-600/20 to-orange-600/20',
      borderColor: 'border-amber-500/30',
      description: 'Currently running'
    },
    {
      title: 'Success Rate',
      value: `${stats?.completionRate || 0}%`,
      change: 0,
      changeType: 'neutral' as const,
      icon: TrendingUp,
      color: 'from-rose-600 to-pink-600',
      bgColor: 'bg-gradient-to-br from-rose-600/20 to-pink-600/20',
      borderColor: 'border-rose-500/30',
      description: 'Completion rate'
    }
  ]

  const quickActions = [
    { icon: Store, label: 'Browse Store', color: 'from-purple-600 to-pink-600', action: () => setActiveTab('store') },
    { icon: ShoppingCart, label: 'New Order', color: 'from-cyan-600 to-blue-600', action: () => setActiveTab('store') },
    { icon: CreditCard, label: 'Top Up', color: 'from-emerald-600 to-teal-600', action: () => setActiveTab('wallet') },
    { icon: History, label: 'View History', color: 'from-amber-600 to-orange-600', action: () => setActiveTab('orders') }
  ]

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
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-black/40 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Logo size="md" />
                <div>
                  <h2 className="text-lg font-bold text-white">Member Panel</h2>
                  <p className="text-xs text-purple-300">Your Dashboard</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activeTab === item.id
                      ? `${item.bgColor} ${item.borderColor} border text-white`
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    activeTab === item.id ? `bg-gradient-to-r ${item.color}` : ""
                  )}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10">
              <ProfileDropdown 
                user={user} 
                onLogout={handleLogout}
                onSettings={handleSettings}
                onProfileUpdate={refreshUserData}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <header className="bg-black/30 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center space-x-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden text-white hover:bg-white/10"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Welcome back, <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{user.name}</span>! 👋
                    </h1>
                    <p className="text-purple-300 text-sm">Manage your account and explore our premium services</p>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-sm font-medium">Account Active</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Bell className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statCards.map((stat, index) => (
                    <Card key={index} className={`group relative overflow-hidden ${stat.bgColor} backdrop-blur-xl ${stat.borderColor} border hover:shadow-2xl transition-all duration-300`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium text-white/80">
                          {stat.title}
                        </CardTitle>
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                          <stat.icon className="h-4 w-4 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-white mb-1">
                          {loadingStats ? (
                            <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                          ) : (
                            stat.value
                          )}
                        </div>
                        <p className="text-xs text-white/60">
                          {loadingStats ? 'Loading...' : stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      className={`h-20 bg-gradient-to-r ${action.color} hover:shadow-lg hover:shadow-${action.color.split(' ')[1]}/25 transition-all duration-300 group`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <action.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Recent Orders & Featured Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Orders */}
                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-violet-400" />
                          </div>
                          Recent Orders
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                          View All
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-80">
                        <div className="space-y-4">
                          {recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                              <div 
                                key={order.id} 
                                className={cn(
                                  "flex items-center justify-between p-4 bg-slate-700/30 rounded-lg transition-colors",
                                  order.status === 'COMPLETED' ? "hover:bg-slate-700/50 cursor-pointer" : ""
                                )}
                                onClick={() => order.status === 'COMPLETED' && handleViewOrderDetails(order)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                                    {getCategoryIcon(order.type)}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{order.title}</p>
                                    <p className="text-slate-400 text-sm">{formatDate(order.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-medium">{formatCurrency(order.amount)}</p>
                                  <Badge className={getStatusColor(order.status)}>
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1">{order.status}</span>
                                  </Badge>
                                  {order.status === 'COMPLETED' && order.adminNotes && (
                                    <p className="text-xs text-emerald-400 mt-1">Has notes</p>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                              <p className="text-slate-400">No orders yet</p>
                              <Button variant="outline" className="mt-4 border-violet-500/50 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 hover:border-violet-400/50 transition-all duration-200" onClick={() => setActiveTab('store')}>
                                Browse Store
                              </Button>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Featured Store Items */}
                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Store className="w-5 h-5 text-purple-400" />
                          </div>
                          Featured Items
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('store')}>
                          View All
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-80">
                        <div className="space-y-4">
                          {storeItems.length > 0 ? (
                            storeItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    {getCategoryIcon(item.category)}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{item.title}</p>
                                    <p className="text-slate-400 text-sm">{item.category}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-medium">{formatCurrency(item.price)}</p>
                                  <Button size="sm" onClick={() => handlePurchaseItem(item)} className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 hover:border-violet-400/50 transition-all duration-200">
                                    Purchase
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Store className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                              <p className="text-slate-400">No featured items</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Store Tab */}
            {activeTab === 'store' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white">Browse Store</h2>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 hover:border-violet-400/50 transition-all duration-200">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 hover:border-violet-400/50 transition-all duration-200">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storeItems.map((item) => (
                    <Card key={item.id} className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group">
                      <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 rounded-t-lg flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-t-lg" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(item.category)}
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-violet-500/50 text-violet-300">
                            {item.category}
                          </Badge>
                          {item.featured && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white">{item.title}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(item.price)}</p>
                          </div>
                          <Button onClick={() => handlePurchaseItem(item)} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                            Purchase
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white">My Orders</h2>
                  <Button onClick={() => setActiveTab('store')} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                </div>

                <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className={cn(
                              "flex items-center justify-between p-6 bg-slate-700/30 rounded-lg transition-colors",
                              order.status === 'COMPLETED' ? "hover:bg-slate-700/50 cursor-pointer" : ""
                            )}
                            onClick={() => order.status === 'COMPLETED' && handleViewOrderDetails(order)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center">
                                {getCategoryIcon(order.type)}
                              </div>
                              <div>
                                <p className="text-white font-medium text-lg">{order.title}</p>
                                <p className="text-slate-400">{formatDate(order.createdAt)}</p>
                                <p className="text-slate-500 text-sm">Payment: {order.paymentMethod}</p>
                                {order.status === 'COMPLETED' && order.adminNotes && (
                                  <p className="text-emerald-400 text-sm mt-1">📝 Click to view notes</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium text-lg">{formatCurrency(order.amount)}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{order.status}</span>
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <ShoppingCart className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400 text-lg mb-4">No orders yet</p>
                          <Button onClick={() => setActiveTab('store')} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                            Browse Store
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white">My Services</h2>
                  <Button onClick={() => setActiveTab('store')} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    <Server className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 backdrop-blur-xl border-violet-500/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Minecraft Server</CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">IP Address:</span>
                          <span className="text-white">192.168.1.100</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Port:</span>
                          <span className="text-white">25565</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">RAM:</span>
                          <span className="text-white">2GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status:</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-400">Online</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl border-cyan-500/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">FiveM Development</CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">IP Address:</span>
                          <span className="text-white">192.168.1.101</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Port:</span>
                          <span className="text-white">30120</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">RAM:</span>
                          <span className="text-white">4GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status:</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-400">Online</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border-amber-500/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Windows RDP</CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">IP Address:</span>
                          <span className="text-white">192.168.1.102</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Port:</span>
                          <span className="text-white">3389</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">RAM:</span>
                          <span className="text-white">4GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status:</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-400">Online</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white">Database Control</h2>
                    <p className="text-purple-300 text-sm mt-2">Manage your database for assigned servers</p>
                  </div>
                  <Button 
                    onClick={() => window.open('/database-control', '_blank')}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Open Database Panel
                  </Button>
                </div>

                <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border-emerald-500/30">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Database Access</CardTitle>
                        <CardDescription className="text-emerald-300">
                          Full control over your server databases
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-emerald-400 font-medium">Database Management</span>
                        </div>
                        <p className="text-slate-400 text-sm">View and manage database tables</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-emerald-400 font-medium">SQL Query Editor</span>
                        </div>
                        <p className="text-slate-400 text-sm">Execute custom SQL queries</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-emerald-400 font-medium">Connection Testing</span>
                        </div>
                        <p className="text-slate-400 text-sm">Test database connection status</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Secure Access</span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Each user has isolated database access with unique credentials. Your data is secure and separated from other users.
                      </p>
                    </div>

                    <div className="mt-6">
                      <Button 
                        onClick={() => window.open('/database-control', '_blank')}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Launch Database Control Panel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <TopUpWallet />
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white">My Profile</h2>
                  <Button onClick={handleEditProfile} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full p-1">
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-white" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-white font-medium text-lg">{user.name}</p>
                          <p className="text-slate-400">{user.email}</p>
                          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Member Since:</span>
                        <span className="text-white">{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Account Status:</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Last Updated:</span>
                        <span className="text-white">{formatDate(user.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={handleChangePassword} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                        <Shield className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Two-Factor Auth
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white">Settings</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Language</span>
                        <select className="bg-slate-700 text-white rounded px-3 py-1">
                          <option>English</option>
                          <option>Bahasa Indonesia</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Timezone</span>
                        <select className="bg-slate-700 text-white rounded px-3 py-1">
                          <option>UTC+7 (WIB)</option>
                          <option>UTC+8 (WITA)</option>
                          <option>UTC+9 (WIT)</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Currency</span>
                        <select className="bg-slate-700 text-white rounded px-3 py-1">
                          <option>IDR</option>
                          <option>USD</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Notification Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email Notifications</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Push Notifications</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">SMS Notifications</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {user && (
        <>
          <EditProfileModal
            user={user}
            isOpen={editProfileOpen}
            onClose={() => setEditProfileOpen(false)}
            onUpdate={handleUserUpdate}
          />
          <ChangePasswordModal
            isOpen={changePasswordOpen}
            onClose={() => setChangePasswordOpen(false)}
          />
          
          {/* Order Details Dialog */}
          <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
            <DialogContent className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 shadow-2xl shadow-black/50 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Order Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-4 py-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Service:</span>
                      <span className="text-white font-medium">{selectedOrder.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Type:</span>
                      <span className="text-white font-medium">{selectedOrder.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Amount:</span>
                      <span className="text-white font-medium">{formatCurrency(selectedOrder.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Payment Method:</span>
                      <span className="text-white font-medium">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Date:</span>
                      <span className="text-white font-medium">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Status:</span>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{selectedOrder.status}</span>
                      </Badge>
                    </div>
                  </div>

                  {selectedOrder.adminNotes && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <h4 className="text-emerald-400 font-medium">Admin Notes</h4>
                      </div>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedOrder.adminNotes}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowOrderDetails(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}