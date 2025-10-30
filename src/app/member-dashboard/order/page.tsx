'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  CreditCard, 
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Server,
  Gamepad2,
  Download
} from 'lucide-react'
import Logo from '@/components/logo'
import ProfileDropdown from '@/components/ProfileDropdown'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  balance: number
  createdAt: string
  updatedAt: string
}

interface StoreItem {
  id: string
  title: string
  description: string
  price: number
  category: string
  imageUrl?: string
  featured: boolean
  metadata?: any
}

import { Suspense } from 'react'

function OrderPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('serviceId')
  
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingItem, setLoadingItem] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [storeItem, setStoreItem] = useState<StoreItem | null>(null)
  const [formData, setFormData] = useState({
    notes: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

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
    if (serviceId) {
      fetchStoreItem(serviceId)
    }
  }, [serviceId])

  const fetchStoreItem = async (id: string) => {
    try {
      const response = await fetch(`/api/store/${id}`)
      if (response.ok) {
        const data = await response.json()
        setStoreItem(data)
      } else {
        setError('Item tidak ditemukan')
      }
    } catch (error) {
      console.error('Failed to fetch store item:', error)
      setError('Gagal memuat item')
    } finally {
      setLoadingItem(false)
    }
  }

  const handleBack = () => {
    router.push('/member-dashboard')
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

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setDownloadingInvoice(true)
      setError('')
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Token tidak ditemukan. Silakan login kembali.')
        return
      }

      console.log('Starting invoice download for order:', orderId)
      
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        console.log('Content-Type:', contentType)
        
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob()
          console.log('Blob size:', blob.size, 'bytes')
          
          if (blob.size === 0) {
            setError('PDF file is empty. Please try again.')
            return
          }
          
          // Try to download using blob URL
          if (window.URL && window.URL.createObjectURL) {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoice-${orderId}.pdf`
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            
            // Cleanup
            setTimeout(() => {
              document.body.removeChild(a)
              window.URL.revokeObjectURL(url)
            }, 100)
            
            console.log('Download initiated successfully')
          } else {
            // Fallback for older browsers
            if (window.navigator && window.navigator.msSaveBlob) {
              // For IE
              window.navigator.msSaveBlob(blob, `invoice-${orderId}.pdf`)
            } else {
              // Open in new tab as fallback
              const fileURL = URL.createObjectURL(blob)
              window.open(fileURL, '_blank')
            }
          }
          
          // Show success message
          setDownloadSuccess(true)
          setTimeout(() => setDownloadSuccess(false), 3000)
        } else {
          const text = await response.text()
          console.error('Response is not PDF:', text)
          setError('Server returned non-PDF response. Please try again.')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to download invoice:', errorData)
        setError(errorData.error || `Gagal download invoice (${response.status})`)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      setError('Terjadi kesalahan saat download invoice. Silakan coba lagi.')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!storeItem) {
      setError('Item tidak valid')
      setSubmitting(false)
      return
    }

    // Check wallet balance
    if (user.balance < storeItem.price) {
      setError(`Saldo wallet tidak mencukupi. Diperlukan ${formatCurrency(storeItem.price)}, saldo Anda ${formatCurrency(user.balance)}`)
      setSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          storeId: storeItem.id,
          amount: storeItem.price,
          paymentMethod: 'WALLET',
          notes: formData.notes
        })
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError)
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch (textError) {
          console.error('Failed to parse text:', textError)
          data = { error: 'Invalid response format' }
        }
      }

      if (response.ok) {
        setSuccess(true)
        setCreatedOrder(data.order)
        // Refresh user data to get updated balance
        await refreshUserData()
      } else {
        console.error('Order creation failed:', data)
        setError(data.error || data.details || 'Gagal membuat pesanan')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MOD': return <Gamepad2 className="w-6 h-6" />
      case 'GAME': return <Gamepad2 className="w-6 h-6" />
      case 'HOSTING': return <Server className="w-6 h-6" />
      case 'SERVER': return <Server className="w-6 h-6" />
      default: return <Package className="w-6 h-6" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-blue-950 to-indigo-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (loadingItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-blue-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-cyan-300">Memuat item...</p>
        </div>
      </div>
    )
  }

  if (!storeItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-blue-950 to-indigo-950">
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-cyan-300 hover:text-white hover:bg-cyan-500/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Logo size="sm" />
                <h1 className="text-xl font-bold text-white">Buat Pesanan</h1>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="bg-red-500/20 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error || 'Item tidak ditemukan'}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-white/[0.03] bg-[size:60px_60px]" />
      
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Logo size="sm" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Create Order
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {success && createdOrder && (
          <div className="mb-6 bg-emerald-500/20 border-emerald-500/30 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <div>
                <h3 className="text-lg font-semibold text-emerald-300">Order Created Successfully!</h3>
                <p className="text-emerald-400 text-sm">Your order has been placed and payment has been processed.</p>
              </div>
            </div>
            
            <div className="bg-emerald-500/10 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-300 text-sm">Order ID:</span>
                <span className="text-white font-mono font-semibold">{createdOrder.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-300 text-sm">Amount Paid:</span>
                <span className="text-white font-semibold">{formatCurrency(createdOrder.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-300 text-sm">New Balance:</span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(user.balance)}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => handleDownloadInvoice(createdOrder.id)}
                disabled={downloadingInvoice}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {downloadSuccess && (
          <Alert className="mb-6 bg-emerald-500/20 border-emerald-500/30 backdrop-blur-xl">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">
              Invoice berhasil diunduh!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-rose-500/20 border-rose-500/30 backdrop-blur-xl">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <AlertDescription className="text-rose-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item Details */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-violet-400" />
                  </div>
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="w-full h-40 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {getCategoryIcon(storeItem.category)}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{storeItem.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{storeItem.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                      {storeItem.category}
                    </Badge>
                    {storeItem.featured && (
                      <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-none text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Price</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                        {formatCurrency(storeItem.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  Order Form
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Complete the form below to proceed with your purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Wallet Payment */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-white font-medium flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          Wallet Payment
                        </Label>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Available
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm">Your Balance:</span>
                          <span className="text-lg font-bold text-emerald-400">
                            {formatCurrency(user.balance)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm">Item Price:</span>
                          <span className="text-lg font-semibold text-white">
                            {formatCurrency(storeItem.price)}
                          </span>
                        </div>
                        
                        <div className="border-t border-emerald-500/30 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">Remaining Balance:</span>
                            <span className={`text-lg font-bold ${user.balance >= storeItem.price ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(user.balance - storeItem.price)}
                            </span>
                          </div>
                        </div>
                        
                        {user.balance < storeItem.price && (
                          <Alert className="bg-rose-500/20 border-rose-500/30 mt-3">
                            <AlertCircle className="h-4 w-4 text-rose-400" />
                            <AlertDescription className="text-rose-300 text-sm">
                              Insufficient balance. Please top up your wallet first.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-white font-medium text-sm">
                      Notes <span className="text-slate-400">(Optional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any special requests or notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 hover:border-slate-500 focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-200 min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-slate-700/50 pt-8">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-violet-400" />
                      </div>
                      Order Summary
                    </h3>
                    <div className="space-y-4 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Item</span>
                          <span className="text-white font-medium">{storeItem.title}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Category</span>
                          <span className="text-white">{storeItem.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Payment Method</span>
                          <span className="text-white capitalize flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            Wallet Balance
                          </span>
                        </div>
                        <div className="border-t border-slate-700/50 pt-3">
                          <div className="flex justify-between">
                            <span className="text-lg font-semibold text-white">Total</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                              {formatCurrency(storeItem.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500 font-medium transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || user.balance < storeItem.price}
                      className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Pay with Wallet ({formatCurrency(storeItem.price)})
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  )
}