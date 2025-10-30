'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, Users, Server, ShoppingBag, Database, Settings, 
  LogOut, TrendingUp, Activity, DollarSign, UserPlus,
  ChevronRight, BarChart3, Shield, Globe, Zap,
  Menu, X, Search, Filter, Download, RefreshCw,
  Eye, Lock, Cpu, HardDrive, Wifi, AlertCircle,
  CheckCircle, Clock, ArrowUpRight, ArrowDownRight,
  Sparkles, Flame, Star, Target, Rocket, Layers,
  Brain, Code, Terminal, Monitor, Smartphone, Tablet,
  Cloud, GitBranch, GitMerge, Package, Box, Archive, 
  FolderOpen, FileText, Bell, BellRing, Mail, MessageSquare, 
  Calendar, Timer, Gauge,
  Sun, Moon, CloudRain, CloudSnow, Wind,
  Heart, ActivityIcon, ZapIcon,
  Diamond, Gem, Trophy,
  Gamepad2, Joystick, Radio,
  Music, Headphones, Volume2, VolumeX,
  Camera, Image, Film, Video,
  Map, MapPin, Navigation, Compass,
  Palette, Brush, PenTool, Pencil,
  Calculator, CalculatorIcon,
  BookOpen, BookMarked, Library,
  GraduationCap, Award, Medal,
  Coffee, Cookie, Pizza,
  HeartHandshake, UserCheck, Fingerprint, LockKeyhole, 
  Key, KeyRound, Unlock, WifiOff, Battery, BatteryCharging, BatteryFull,
  Signal, Radar, Satellite, SatelliteDish,
  Telescope, Microscope, Dna,
  Atom, Sparkle,
  FlameKindling,
  Snowflake, Mountain,
  TreePine, Leaf, Flower,
  Waves, Droplet,
  ShootingStar,
  Star,
  Store as StoreIcon,
  Trash2
} from 'lucide-react'
import Logo from '@/components/logo'
import ProfileDropdown from '@/components/ProfileDropdown'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/currency'
import UserManagement from '@/components/UserManagement'
import StoreManagement from '@/components/StoreManagement'
import OrderManagement from '@/components/OrderManagement'
import DepositManagement from '@/components/DepositManagement'
import PaymentSettings from '@/components/owner/PaymentSettings'
import ServersList from '@/components/owner/servers-list'
import ApiManagement from '@/components/owner/api-management'

export default function OwnerPanel() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeSettingsTab, setActiveSettingsTab] = useState('payment')
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [notifications, setNotifications] = useState(3)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (mounted) {
      checkAuth()
      fetchStats()
    }
  }, [mounted])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.user.role === 'ADMIN' || data.user.role === 'OWNER') {
          setUser(data.user)
        } else {
          router.push('/gateway')
        }
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        router.push('/login')
      }
    } catch (error) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set default stats if API fails
      setStats({
        totalUsers: 1234,
        recentUsers: 12,
        totalServices: 42,
        recentServices: 8,
        totalOrders: 856,
        totalRevenue: 45200000
      })
    }
  }

  const handleSettings = () => {
    // TODO: Navigate to settings page
    console.log('Navigate to settings')
  }

  const refreshUserData = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    try {
      const response = await fetch('/api/auth/me', {
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

  const handleResetOrders = async () => {
    const confirmReset = window.confirm('⚠️ Apakah kamu yakin ingin menghapus SEMUA pesanan? Tindakan ini tidak bisa dibatalkan!')
    if (!confirmReset) return

    const doubleConfirm = window.confirm('🚨 Yakin banget? Semua data penjualan akan hilang selamanya!')
    if (!doubleConfirm) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/admin/reset-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ ${data.message}\n📊 ${data.deletedCount} pesanan dihapus\n⏰ ${new Date(data.timestamp).toLocaleString('id-ID')}`)
        fetchStats() // Refresh stats
      } else {
        const error = await response.json()
        alert(`❌ Gagal reset: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to reset orders:', error)
      alert('❌ Terjadi kesalahan saat reset pesanan')
    }
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center relative overflow-hidden">
        {/* Advanced Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gradient-to-r from-violet-500 to-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-gradient-to-r from-cyan-500 to-blue-500 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-gradient-to-r from-pink-500 to-rose-500 border-t-transparent rounded-full animate-spin animation-delay-300"></div>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Initializing Dashboard
              </h2>
              <p className="text-purple-300 text-sm animate-pulse">Preparing your advanced workspace...</p>
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
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Gauge className="w-5 h-5" />, 
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-violet-600/10',
      borderColor: 'border-violet-500/30'
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: <Users className="w-5 h-5" />, 
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-500/30'
    },
    { 
      id: 'store', 
      label: 'Store', 
      icon: <StoreIcon className="w-5 h-5" />, 
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
      id: 'orders', 
      label: 'Orders', 
      icon: <ShoppingBag className="w-5 h-5" />, 
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-amber-600/10',
      borderColor: 'border-amber-500/30'
    },
    { 
      id: 'deposits', 
      label: 'Deposits', 
      icon: <DollarSign className="w-5 h-5" />, 
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-600/10',
      borderColor: 'border-emerald-500/30'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      color: 'from-slate-600 to-gray-600',
      bgColor: 'bg-slate-600/10',
      borderColor: 'border-slate-500/30',
      hasSubmenu: true,
      submenu: [
        { id: 'payment', label: 'Payment', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'api', label: 'API', icon: <Terminal className="w-4 h-4" /> },
        { id: 'website', label: 'Website', icon: <Globe className="w-4 h-4" />, comingSoon: true }
      ]
    },
  ]

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: stats?.recentUsers || 0,
      changeType: 'increase',
      icon: Users,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-gradient-to-br from-violet-600/20 to-purple-600/20',
      borderColor: 'border-violet-500/30',
      glowColor: 'glow-violet'
    },
    {
      title: 'Active Services',
      value: stats?.totalServices || 0,
      change: stats?.recentServices || 0,
      changeType: 'increase',
      icon: Server,
      color: 'from-cyan-600 to-blue-600',
      bgColor: 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20',
      borderColor: 'border-cyan-500/30',
      glowColor: 'glow-cyan'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: 0,
      changeType: 'neutral',
      icon: ShoppingBag,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-600/20 to-orange-600/20',
      borderColor: 'border-amber-500/30',
      glowColor: 'glow-amber'
    },
    {
      title: 'Revenue',
      value: formatRupiah(stats?.totalRevenue || 0),
      change: 0,
      changeType: 'neutral',
      icon: DollarSign,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30',
      glowColor: 'glow-emerald'
    }
  ]

  const quickActions = [
    { icon: UserPlus, label: 'Create User', color: 'from-violet-600 to-purple-600' },
    { icon: Server, label: 'Add Service', color: 'from-cyan-600 to-blue-600' },
    { icon: RefreshCw, label: 'Refresh Data', color: 'from-emerald-600 to-teal-600' },
    { icon: Download, label: 'Export Report', color: 'from-amber-600 to-orange-600' },
    { icon: Trash2, label: 'Reset Orders', color: 'from-rose-600 to-red-600', action: handleResetOrders, danger: true }
  ]

  const systemStatus = [
    { label: 'API Status', status: 'online', icon: <Wifi className="w-5 h-5 text-purple-400" />, value: '100%' },
    { label: 'Database', status: 'online', icon: <Database className="w-5 h-5 text-purple-400" />, value: 'Connected' },
    { label: 'Server Load', status: 'warning', icon: <Cpu className="w-5 h-5 text-purple-400" />, value: '68%' },
    { label: 'Storage', status: 'online', icon: <HardDrive className="w-5 h-5 text-purple-400" />, value: '45%' },
    { label: 'Network', status: 'online', icon: <Signal className="w-5 h-5 text-purple-400" />, value: 'Stable' },
    { label: 'Security', status: 'online', icon: <Shield className="w-5 h-5 text-purple-400" />, value: 'Active' }
  ]

  const recentActivities = [
    { icon: UserPlus, label: 'New user registered', time: '2 min ago', color: 'text-violet-400' },
    { icon: Server, label: 'Service deployed', time: '5 min ago', color: 'text-cyan-400' },
    { icon: ShoppingBag, label: 'New order received', time: '12 min ago', color: 'text-amber-400' },
    { icon: Download, label: 'Report generated', time: '1 hour ago', color: 'text-emerald-400' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Advanced Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
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
                  <h2 className="text-lg font-bold text-white">Owner Panel</h2>
                  <p className="text-xs text-purple-300">Control Center</p>
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
                <div key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id)
                      if (item.id === 'settings') {
                        setActiveSettingsTab('payment')
                      }
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                      activeTab === item.id
                        ? `${item.bgColor} ${item.borderColor} border text-white`
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      activeTab === item.id ? item.color : ""
                    )}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {item.hasSubmenu && (
                      <ChevronRight className={cn(
                        "w-4 h-4 ml-auto transition-transform duration-200",
                        activeTab === item.id ? "rotate-90" : ""
                      )} />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {item.hasSubmenu && activeTab === item.id && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setActiveSettingsTab(subItem.id)}
                          className={cn(
                            "w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200",
                            activeSettingsTab === subItem.id
                              ? "bg-white/10 text-white border border-white/20"
                              : "text-gray-500 hover:text-white hover:bg-white/5"
                          )}
                          disabled={subItem.comingSoon}
                        >
                          <div className="w-6 h-6 rounded flex items-center justify-center">
                            {subItem.icon}
                          </div>
                          <span className="text-sm font-medium">{subItem.label}</span>
                          {subItem.comingSoon && (
                            <Badge className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Coming Soon
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
          {/* Advanced Header */}
          <header className="bg-black/30 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-2xl shadow-black/20">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center space-x-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Crown className="w-7 h-7 text-gradient-to-r from-violet-400 to-purple-400" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                        {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                      </h1>
                      <p className="text-xs text-purple-300">Advanced Management System</p>
                    </div>
                  </div>
                </div>
                
                {/* Center Section - Time & Status */}
                <div className="hidden lg:flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-xs text-purple-300 uppercase tracking-wider">System Time</p>
                    <p className="text-sm font-mono text-white">
                      {currentTime || '--:--:--'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-purple-300 uppercase tracking-wider">Status</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">All Systems Operational</span>
                    </div>
                  </div>
                </div>
                
                {/* Right Section - User & Actions */}
                <div className="flex items-center space-x-4">
                  {/* Notifications */}
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 backdrop-blur-sm relative">
                      <BellRing className="w-5 h-5" />
                      {notifications > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                          {notifications}
                        </span>
                      )}
                    </Button>
                  </div>
                  
                  {/* Search */}
                  <div className="hidden md:block">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statCards.map((stat, index) => (
                    <Card key={index} className={cn(
                      "bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group",
                      stat.borderColor
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center",
                            stat.color
                          )}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-xs font-semibold",
                            stat.changeType === 'increase' ? 'text-green-400 border-green-400/30' : 
                            stat.changeType === 'decrease' ? 'text-red-400 border-red-400/30' : 
                            'text-gray-400 border-gray-400/30'
                          )}>
                            {stat.changeType === 'increase' ? '+' : ''}{stat.change}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                          <p className="text-sm text-purple-300">{stat.title}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions & System Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Actions */}
                  <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-violet-400" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription className="text-purple-300">
                        Common tasks and shortcuts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={action.action || undefined}
                          className={cn(
                            "w-full justify-start gap-3 bg-black/20 border-white/10 text-white hover:bg-white/10 transition-all duration-300",
                            "hover:scale-105 hover:shadow-lg",
                            action.danger && "border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center",
                            action.color
                          )}>
                            <action.icon className="w-4 h-4 text-white" />
                          </div>
                          {action.label}
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <ActivityIcon className="w-5 h-5 text-violet-400" />
                        System Status
                      </CardTitle>
                      <CardDescription className="text-purple-300">
                        Real-time system monitoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {systemStatus.map((status, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                              {status.icon}
                              <div>
                                <p className="text-sm text-white font-medium">{status.label}</p>
                                <p className="text-xs text-purple-300">{status.value}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              status.status === 'online' ? 'bg-green-500' : 
                              status.status === 'warning' ? 'bg-yellow-500' : 
                              'bg-red-500'
                            )}></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activities */}
                <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-violet-400" />
                      Recent Activities
                    </CardTitle>
                    <CardDescription className="text-purple-300">
                      Latest system events and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-black/20 rounded-lg border border-white/5">
                          <div className={cn("w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center", activity.color)}>
                            <activity.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{activity.label}</p>
                            <p className="text-xs text-purple-300">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'users' && <UserManagement />}

            {activeTab === 'store' && <StoreManagement />}

            {activeTab === 'services' && (
              <ServersList />
            )}

            {activeTab === 'orders' && <OrderManagement />}

            {activeTab === 'deposits' && <DepositManagement />}

            {activeTab === 'settings' && (
              <div>
                {/* Settings Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                  <p className="text-purple-300">Manage your application settings and configurations</p>
                </div>

                {/* Settings Submenu Navigation */}
                <div className="flex space-x-1 mb-6 p-1 bg-black/20 rounded-lg border border-white/10">
                  <button
                    onClick={() => setActiveSettingsTab('payment')}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200",
                      activeSettingsTab === 'payment'
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Payment</span>
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('api')}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200",
                      activeSettingsTab === 'api'
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>API</span>
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('website')}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200",
                      activeSettingsTab === 'website'
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                    <Badge className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      Coming Soon
                    </Badge>
                  </button>
                </div>

                {/* Settings Content */}
                {activeSettingsTab === 'payment' && <PaymentSettings />}
                
                {activeSettingsTab === 'api' && <ApiManagement />}
                
                {activeSettingsTab === 'website' && (
                  <Card className="bg-black/40 backdrop-blur-2xl border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-400" />
                        Website Settings
                      </CardTitle>
                      <CardDescription className="text-purple-300">
                        Customize website appearance, content, and SEO settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Website Configuration</h3>
                        <p className="text-purple-300 mb-4">Advanced website management features coming soon...</p>
                        <div className="space-y-2 text-sm text-gray-400">
                          <p>• Theme Customization</p>
                          <p>• SEO Settings</p>
                          <p>• Content Management</p>
                          <p>• Analytics Integration</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}