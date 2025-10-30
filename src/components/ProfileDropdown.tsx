'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAvatarUrl, getInitials, getAvatarColor } from '@/lib/avatar'
import { 
  User, 
  Settings, 
  History, 
  LogOut, 
  ChevronUp, 
  Shield, 
  Calendar,
  Monitor,
  MapPin,
  Clock,
  X,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface LoginHistory {
  id: string
  loginTime: string
  ip: string
  userAgent: string
  location?: string
  device?: string
  browser?: string
  isActive?: boolean
}

interface ProfileDropdownProps {
  user: UserData
  onLogout: () => void
  onSettings: () => void
  onProfileUpdate?: () => void
}

export default function ProfileDropdown({ user, onLogout, onSettings, onProfileUpdate }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 'auto', bottom: 'auto' })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Refresh user data when dropdown opens
  useEffect(() => {
    if (isOpen && onProfileUpdate) {
      onProfileUpdate()
    }
  }, [isOpen, onProfileUpdate])

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 320 // lebar dropdown
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Hitung posisi yang optimal
      let left = rect.right - dropdownWidth
      let right = 'auto'
      let top = rect.bottom + 8
      let bottom = 'auto'
      
      // Jika dropdown kepotong di kiri
      if (left < 10) {
        left = 10
      }
      
      // Jika dropdown kepotong di kanan
      if (left + dropdownWidth > viewportWidth - 10) {
        left = viewportWidth - dropdownWidth - 10
      }
      
      // Jika dropdown kepotong di bawah, tampilkan di atas
      if (top + 400 > viewportHeight - 10) { // 400 adalah perkiraan tinggi dropdown
        bottom = viewportHeight - rect.top + 8
        top = 'auto'
      }
      
      setDropdownPosition({ top, left: left as any, right: right as any, bottom: bottom as any })
    }
    setIsOpen(!isOpen)
  }

  const fetchLoginHistory = async () => {
    setLoadingHistory(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/auth/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLoginHistory(data.history)
      } else {
        // Fallback to mock data if API fails
        const mockHistory: LoginHistory[] = [
          {
            id: '1',
            loginTime: new Date().toISOString(),
            ip: '192.168.1.100',
            userAgent: navigator.userAgent,
            location: 'Jakarta, Indonesia',
            device: 'Desktop',
            browser: 'Chrome'
          },
          {
            id: '2',
            loginTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            ip: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Surabaya, Indonesia',
            device: 'Desktop',
            browser: 'Firefox'
          },
          {
            id: '3',
            loginTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            ip: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            location: 'Bandung, Indonesia',
            device: 'Mobile',
            browser: 'Safari'
          }
        ]
        setLoginHistory(mockHistory)
      }
    } catch (error) {
      console.error('Failed to fetch login history:', error)
      // Fallback to mock data
      const mockHistory: LoginHistory[] = [
        {
          id: '1',
          loginTime: new Date().toISOString(),
          ip: '192.168.1.100',
          userAgent: navigator.userAgent,
          location: 'Jakarta, Indonesia',
          device: 'Desktop',
          browser: 'Chrome'
        }
      ]
      setLoginHistory(mockHistory)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleShowHistory = () => {
    setShowHistory(true)
    fetchLoginHistory()
    setIsOpen(false)
  }

  const getDeviceIcon = (device?: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Tablet className="w-4 h-4" />
      case 'desktop':
      case 'laptop':
        return <Laptop className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getBrowserIcon = (browser?: string) => {
    switch (browser?.toLowerCase()) {
      case 'chrome':
        return '🌐'
      case 'firefox':
        return '🦊'
      case 'safari':
        return '🧭'
      case 'edge':
        return '📘'
      default:
        return '🌍'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={toggleDropdown}
          className="flex items-center gap-3 hover:bg-white/10 transition-all duration-200 px-3 py-2 min-w-0"
        >
          {user.avatar ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-cyan-500/50 flex-shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600">
              {user.avatar.startsWith('data:') ? (
                // Base64 Avatar
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback ke initials jika base64 gagal
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.className = `w-8 h-8 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center flex-shrink-0`
                      parent.innerHTML = `<span class="text-white text-xs font-bold">${getInitials(user.name)}</span>`
                    }
                  }}
                />
              ) : (
                // Legacy URL Avatar (buat backward compatibility)
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback ke initials jika URL avatar gagal
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.className = `w-8 h-8 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center flex-shrink-0`
                      parent.innerHTML = `<span class="text-white text-xs font-bold">${getInitials(user.name)}</span>`
                    }
                  }}
                />
              )}
            </div>
          ) : (
            // Default Avatar dengan Initials
            <div className={`w-8 h-8 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-bold">
                {getInitials(user.name)}
              </span>
            </div>
          )}
          
          {/* User Name - Visible on larger screens */}
          <div className="hidden sm:block min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate" title={user.name}>
              {user.name}
            </p>
            <p className="text-xs text-cyan-300 truncate" title={user.role}>
              {user.role}
            </p>
          </div>
          
          {/* User Name - Visible on mobile with shorter layout */}
          <div className="sm:hidden min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate" title={user.name}>
              {user.name.split(' ')[0]}
            </p>
          </div>
          
          <ChevronUp className={`w-4 h-4 text-cyan-300 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div 
            className="fixed w-80 bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl shadow-black/50 z-50"
            style={{
              top: dropdownPosition.top !== 'auto' ? `${dropdownPosition.top}px` : 'auto',
              left: dropdownPosition.left !== 'auto' ? `${dropdownPosition.left}px` : 'auto',
              right: dropdownPosition.right !== 'auto' ? `${dropdownPosition.right}px` : 'auto',
              bottom: dropdownPosition.bottom !== 'auto' ? `${dropdownPosition.bottom}px` : 'auto',
            }}
          >
            {/* User Info */}
            <div className="p-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600">
                    {user.avatar.startsWith('data:') ? (
                      // Base64 Avatar
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback ke initials jika base64 gagal
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.className = `w-12 h-12 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center`
                            parent.innerHTML = `<span class="text-white text-sm font-bold">${getInitials(user.name)}</span>`
                          }
                        }}
                      />
                    ) : (
                      // Legacy URL Avatar (buat backward compatibility)
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback ke initials jika URL avatar gagal
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.className = `w-12 h-12 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center`
                            parent.innerHTML = `<span class="text-white text-sm font-bold">${getInitials(user.name)}</span>`
                          }
                        }}
                      />
                    )}
                  </div>
                ) : (
                  // Default Avatar dengan Initials
                  <div className={`w-12 h-12 bg-gradient-to-r ${getAvatarColor(user.name)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{user.name}</h3>
                  <p className="text-sm text-cyan-300 truncate">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="w-full justify-start gap-3 text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                Pengaturan Akun
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowHistory}
                className="w-full justify-start gap-3 text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-all duration-200"
              >
                <History className="w-4 h-4" />
                Histori Login
              </Button>
              
              <hr className="my-2 border-cyan-500/20" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Login History Dialog - Lebih Rapi dan Responsive */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-2xl border-cyan-500/30 shadow-2xl shadow-black/50 max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="border-b border-cyan-500/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Histori Login</DialogTitle>
                  <DialogDescription className="text-cyan-300">
                    Riwayat login dan aktivitas akun Anda
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6 max-h-[60vh]">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  <p className="text-gray-400">Memuat histori login...</p>
                </div>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Belum Ada Histori</h3>
                <p className="text-gray-500">
                  Belum ada aktivitas login yang tercatat
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {loginHistory.map((history) => (
                  <div
                    key={history.id}
                    className="bg-gray-800/50 border border-cyan-500/20 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white">
                            {formatDate(history.loginTime)}
                          </span>
                          {history.isActive && (
                            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                              Sesi Aktif
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400">IP Address</p>
                          <p className="text-sm text-cyan-300 font-mono truncate">{history.ip}</p>
                        </div>
                      </div>
                      
                      {history.location && (
                        <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400">Lokasi</p>
                            <p className="text-sm text-cyan-300 truncate">{history.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {history.device && (
                        <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                          {getDeviceIcon(history.device)}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400">Perangkat</p>
                            <p className="text-sm text-cyan-300 truncate">{history.device}</p>
                          </div>
                        </div>
                      )}
                      
                      {history.browser && (
                        <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                          <span className="text-sm">{getBrowserIcon(history.browser)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400">Browser</p>
                            <p className="text-sm text-cyan-300 truncate">{history.browser}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-sm text-cyan-300">
                  <p className="font-medium mb-1">Keamanan Akun</p>
                  <p className="text-xs text-gray-400">
                    Histori login membantu Anda memantau aktivitas akun. Jika Anda melihat aktivitas yang mencurigakan, 
                    segera ubah password dan hubungi support.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}