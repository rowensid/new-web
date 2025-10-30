'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, User, ArrowRight, Shield, Store, Users, Settings } from 'lucide-react'
import Logo from '@/components/logo'
import ProfileDropdown from '@/components/ProfileDropdown'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  balance?: number
  createdAt: string
  updatedAt: string
}

export default function GatewayPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
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
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleSelectDashboard = (type: 'owner' | 'member') => {
    if (type === 'owner') {
      router.push('/owner-panel')
    } else {
      router.push('/member-dashboard')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    router.push('/gateway')
  }

  const handleSettings = () => {
    // TODO: Navigate to settings page
    console.log('Navigate to settings')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <Logo size="xl" />
            <div className="flex-1 flex justify-end">
              <ProfileDropdown 
                user={user} 
                onLogout={handleLogout}
                onSettings={handleSettings}
                onProfileUpdate={refreshUserData}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Selamat Datang Kembali!
          </h1>
          <p className="text-purple-300 text-lg">
            {user.name} • {user.email}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">
              {user.role === 'OWNER' ? 'Owner Access' : 'Member Access'}
            </span>
          </div>
        </div>

        {/* Dashboard Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Owner Panel Card */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-2xl border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group cursor-pointer"
                onClick={() => handleSelectDashboard('owner')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Owner Panel
              </CardTitle>
              <CardDescription className="text-purple-300">
                Kelola seluruh sistem, pengguna, dan konfigurasi platform
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-purple-200">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">System Configuration</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-purple-200">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">User Management</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-purple-200">
                  <Store className="w-4 h-4" />
                  <span className="text-sm">Store Management</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-purple-500/40 group-hover:scale-105">
                Buka Owner Panel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Member Dashboard Card */}
          <Card className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-2xl border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 group cursor-pointer"
                onClick={() => handleSelectDashboard('member')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Member Dashboard
              </CardTitle>
              <CardDescription className="text-cyan-300">
                Akses personal dashboard untuk melihat layanan dan pesanan
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-cyan-200">
                  <Store className="w-4 h-4" />
                  <span className="text-sm">Browse Services</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-cyan-200">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">My Orders</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-cyan-200">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Account Settings</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:shadow-cyan-500/40 group-hover:scale-105">
                Buka Member Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
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
      `}</style>
    </div>
  )
}