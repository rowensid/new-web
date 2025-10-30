'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Camera,
  FileImage,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  DollarSign
} from 'lucide-react'
import Logo from '@/components/logo'
import ProfileDropdown from '@/components/ProfileDropdown'
import { Suspense } from 'react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface OrderData {
  id: string
  amount: number
  status: string
  paymentMethod: string
  paymentProof?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  service?: {
    name: string
    type: string
    description?: string
  }
}

interface PaymentSettings {
  qrisImageUrl?: string
  qrisNumber?: string
  banks?: Array<{
    bankName: string
    bankNumber: string
    bankAccount: string
  }>
  ewallets?: Array<{
    ewalletName: string
    ewalletNumber: string
  }>
}

function InvoicePageContent() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  
  const [user, setUser] = useState<UserData | null>(null)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    if (orderId && user) {
      fetchOrder()
      fetchPaymentSettings()
    }
  }, [orderId, user])

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        setError('Order tidak ditemukan')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      setError('Gagal memuat order')
    }
  }

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings')
      if (response.ok) {
        const data = await response.json()
        setPaymentSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch payment settings:', error)
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Hanya file gambar yang diperbolehkan')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pilih file bukti pembayaran terlebih dahulu')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          // Remove data:image/...;base64, prefix
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(selectedFile)

      const base64Data = await base64Promise

      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentProof: `data:image/jpeg;base64,${base64Data}`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setOrder(prev => prev ? { ...prev, paymentProof: data.order.paymentProof, status: 'VALIDATING' } : null)
        setSelectedFile(null)
        setPreviewUrl('')
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Gagal mengupload bukti pembayaran')
      }
    } catch (error) {
      console.error('Failed to upload payment proof:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getOrderNumber = (id: string) => {
    // Extract numeric part dari ID dan format jadi invoice number
    const numericId = id.replace(/\D/g, '').slice(-6)
    const invoiceNum = parseInt(numericId, 36) % 99999 + 1
    return `#${invoiceNum.toString().padStart(5, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'VALIDATING': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'COMPLETED': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'VALIDATING': return <AlertCircle className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'transfer': return <Banknote className="w-5 h-5" />
      case 'ewallet': return <Smartphone className="w-5 h-5" />
      case 'qris': return <DollarSign className="w-5 h-5" />
      default: return <CreditCard className="w-5 h-5" />
    }
  }

  const getPaymentInfo = () => {
    if (!paymentSettings || !order) return null

    switch (order.paymentMethod) {
      case 'transfer':
        return paymentSettings.banks?.[0]
      case 'ewallet':
        return paymentSettings.ewallets?.[0]
      case 'qris':
        return {
          qrisNumber: paymentSettings.qrisNumber,
          qrisImageUrl: paymentSettings.qrisImageUrl
        }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Logo size="sm" />
                <h1 className="text-xl font-bold text-white">Invoice</h1>
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
              {error || 'Order tidak ditemukan'}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  const paymentInfo = getPaymentInfo()

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
                  Invoice {getOrderNumber(order.id)}
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
        {success && (
          <Alert className="mb-6 bg-emerald-500/20 border-emerald-500/30 backdrop-blur-xl">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">
              Bukti pembayaran berhasil diupload! Menunggu validasi admin.
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
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">
                      {getOrderNumber(order.id)}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border flex items-center gap-2`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Details */}
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">{order.service?.name || 'Unknown Service'}</h3>
                  <p className="text-slate-400 text-sm">{order.service?.description || 'No description available'}</p>
                </div>

                {/* Payment Method */}
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(order.paymentMethod)}
                    <div>
                      <p className="text-white font-medium">Metode Pembayaran</p>
                      <p className="text-slate-400 text-sm capitalize">{order.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                </div>

                {/* Admin Notes (if completed) */}
                {order.adminNotes && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">📝 Pesan dari Admin</h4>
                    <p className="text-emerald-300 text-sm whitespace-pre-wrap">{order.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            {order.status === 'PENDING' && paymentInfo && (
              <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-violet-400" />
                    Informasi Pembayaran
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Silahkan transfer ke rekening berikut:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.paymentMethod === 'transfer' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-slate-400 text-sm mb-1">Bank</p>
                        <p className="text-white font-semibold">{paymentInfo.bankName}</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-slate-400 text-sm mb-1">No. Rekening</p>
                        <p className="text-white font-semibold font-mono">{paymentInfo.bankNumber}</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-slate-400 text-sm mb-1">Atas Nama</p>
                        <p className="text-white font-semibold">{paymentInfo.bankAccount}</p>
                      </div>
                    </div>
                  )}

                  {order.paymentMethod === 'ewallet' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-slate-400 text-sm mb-1">E-Wallet</p>
                        <p className="text-white font-semibold">{paymentInfo.ewalletName}</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <p className="text-slate-400 text-sm mb-1">No. HP</p>
                        <p className="text-white font-semibold font-mono">{paymentInfo.ewalletNumber}</p>
                      </div>
                    </div>
                  )}

                  {order.paymentMethod === 'qris' && (
                    <div className="space-y-3">
                      {paymentInfo.qrisImageUrl && (
                        <div className="flex justify-center p-4 bg-slate-700/30 rounded-lg">
                          <img 
                            src={paymentInfo.qrisImageUrl} 
                            alt="QRIS Payment" 
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                      )}
                      {paymentInfo.qrisNumber && (
                        <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                          <p className="text-slate-400 text-sm mb-1">QRIS Number</p>
                          <p className="text-white font-semibold font-mono">{paymentInfo.qrisNumber}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      ⚠️ Pastikan jumlah transfer sesuai dengan total order. Upload bukti pembayaran setelah transfer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-6">
            {order.status === 'PENDING' && (
              <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <Upload className="w-6 h-6 text-violet-400" />
                    Upload Bukti Pembayaran
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload screenshot atau foto bukti transfer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="payment-proof" className="text-white font-medium text-sm">
                      Bukti Pembayaran
                    </Label>
                    <div className="relative">
                      <Input
                        id="payment-proof"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('payment-proof')?.click()}
                        variant="outline"
                        className="w-full h-24 border-dashed border-slate-600 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-200"
                      >
                        <div className="flex flex-col items-center gap-2">
                          {previewUrl ? (
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <Camera className="w-8 h-8 text-slate-400" />
                          )}
                          <span className="text-sm text-slate-400">
                            {previewUrl ? 'Ganti Gambar' : 'Pilih File'}
                          </span>
                        </div>
                      </Button>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded">
                        <FileImage className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-slate-300 truncate">{selectedFile.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Bukti Pembayaran
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-slate-400 text-center">
                    <p>Maksimal ukuran file: 5MB</p>
                    <p>Format: JPG, PNG, GIF</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Status */}
            <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Status Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      order.status === 'PENDING' ? 'bg-yellow-500' :
                      order.status === 'VALIDATING' ? 'bg-blue-500' :
                      order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-white capitalize">{order.status}</span>
                  </div>
                  
                  {order.status === 'PENDING' && (
                    <p className="text-sm text-slate-400">
                      Menunggu pembayaran. Upload bukti pembayaran untuk melanjutkan.
                    </p>
                  )}
                  
                  {order.status === 'VALIDATING' && (
                    <p className="text-sm text-slate-400">
                      Pembayaran sedang divalidasi oleh admin. Mohon tunggu.
                    </p>
                  )}
                  
                  {order.status === 'COMPLETED' && (
                    <p className="text-sm text-green-400">
                      Pembayaran telah divalidasi! Order selesai.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <InvoicePageContent />
    </Suspense>
  )
}