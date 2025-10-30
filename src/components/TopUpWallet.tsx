'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ImageUpload from '@/components/ui/image-upload'
import { 
  Wallet, 
  CreditCard, 
  QrCode, 
  BanknoteIcon,
  Smartphone,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatRupiah } from '@/lib/currency'
import ApiClient from '@/lib/api-client'

interface PaymentMethod {
  id: string
  name: string
  type: 'QRIS' | 'BANK_TRANSFER' | 'EWALLET'
  config: any
  isActive: boolean
}

interface DepositRequest {
  id: string
  amount: number
  paymentMethod: string
  status: string
  createdAt: string
  proofUrl?: string
}

interface PaymentInfo {
  qrisImageUrl?: string
  qrisNumber?: string
  bankName?: string
  bankNumber?: string
  bankAccount?: string
  ewalletName?: string
  ewalletNumber?: string
}

const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000, 1000000]

// Helper function to get icon based on payment method type
const getPaymentIcon = (type: string) => {
  switch (type) {
    case 'QRIS': return <QrCode className="w-5 h-5" />
    case 'BANK_TRANSFER': return <BanknoteIcon className="w-5 h-5" />
    case 'EWALLET': return <Smartphone className="w-5 h-5" />
    default: return <CreditCard className="w-5 h-5" />
  }
}

export default function TopUpWallet() {
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'payment' | 'upload'>('form')
  const [depositRequest, setDepositRequest] = useState<DepositRequest | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [instructions, setInstructions] = useState<string[]>([])
  const [proofUrl, setProofUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showQrCode, setShowQrCode] = useState(true)
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [loadingDeposits, setLoadingDeposits] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)

  useEffect(() => {
    fetchBalance()
    fetchDeposits()
    fetchPaymentMethods()
    
    // Auto refresh balance every 10 seconds
    const interval = setInterval(async () => {
      await fetchBalance()
      await fetchDeposits()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await ApiClient.get('/api/user/profile')
      
      if (response.ok) {
        const data = await response.json()
        setBalance(data.user.balance || 0)
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await ApiClient.get('/api/wallet/topup?limit=5')
      
      if (response.ok) {
        const data = await response.json()
        setDeposits(data.deposits || [])
        // Also refresh balance after fetching deposits
        await fetchBalance()
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error)
    } finally {
      setLoadingDeposits(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await ApiClient.get('/api/payment-methods?onlyActive=true')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentMethods(data.data)
        } else if (data.maintenance) {
          // Handle maintenance mode
          setPaymentMethods([])
          console.log('Payment system maintenance:', data.message)
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  const handleCreateDeposit = async () => {
    if (!amount || !selectedMethod) {
      return
    }

    const depositAmount = parseInt(amount)
    if (depositAmount < 10000) {
      alert('Minimum top-up is Rp 10,000')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await ApiClient.post('/api/wallet/topup', {
        amount: depositAmount,
        paymentMethod: selectedMethod
      })

      if (response.ok) {
        const data = await response.json()
        setDepositRequest(data.deposit)
        setPaymentInfo(data.paymentInfo)
        setInstructions(data.instructions)
        setStep('payment')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create deposit request')
      }
    } catch (error) {
      console.error('Failed to create deposit:', error)
      alert('Failed to create deposit request')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadProof = async () => {
    if (!proofUrl || !depositRequest) {
      return
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await ApiClient.post(`/api/wallet/topup/${depositRequest.id}/proof`, {
        proofUrl
      })

      if (response.ok) {
        const data = await response.json()
        setDepositRequest(data.deposit)
        setStep('upload')
        fetchDeposits()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload proof')
      }
    } catch (error) {
      console.error('Failed to upload proof:', error)
      alert('Failed to upload proof')
    } finally {
      setUploading(false)
    }
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
      case 'REJECTED': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const resetForm = () => {
    setStep('form')
    setAmount('')
    setSelectedMethod('')
    setDepositRequest(null)
    setPaymentInfo(null)
    setInstructions([])
    setProofUrl('')
    setShowQrCode(true)
  }

  if (step === 'payment') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={resetForm} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">Payment Instructions</h2>
            <p className="text-gray-400">Complete your payment using the details below</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Details */}
          <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="text-xl font-bold text-white">{formatRupiah(depositRequest?.amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Method:</span>
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                  {depositRequest?.paymentMethod}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <Badge className={getStatusColor(depositRequest?.status || '')}>
                  {getStatusIcon(depositRequest?.status || '')}
                  <span className="ml-1">{depositRequest?.status}</span>
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Deposit ID:</span>
                <span className="text-violet-400 font-mono text-sm">{depositRequest?.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentInfo?.qrisImageUrl && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-white">QR Code</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="text-violet-400 hover:text-violet-300"
                    >
                      {showQrCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {showQrCode && (
                    <div className="bg-white p-4 rounded-lg flex justify-center">
                      <img 
                        src={paymentInfo.qrisImageUrl} 
                        alt="QRIS" 
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  )}
                  {paymentInfo.qrisNumber && (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={paymentInfo.qrisNumber} 
                        readOnly 
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentInfo.qrisNumber!)}
                        className="border-violet-500/50 text-violet-400"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {paymentInfo?.bankName && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Bank Account</Label>
                    <div className="mt-1 p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-white font-medium">{paymentInfo.bankName}</p>
                      <p className="text-violet-400 font-mono">{paymentInfo.bankNumber}</p>
                      <p className="text-gray-400">{paymentInfo.bankAccount}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(`${paymentInfo.bankNumber} - ${paymentInfo.bankAccount}`)}
                    className="w-full border-violet-500/50 text-violet-400"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Account Details
                  </Button>
                </div>
              )}

              {paymentInfo?.ewalletName && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">{paymentInfo.ewalletName} Number</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input 
                        value={paymentInfo.ewalletNumber} 
                        readOnly 
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paymentInfo.ewalletNumber!)}
                        className="border-violet-500/50 text-violet-400"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-300">{instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Upload Proof */}
        <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Upload Payment Proof</CardTitle>
            <CardDescription className="text-gray-400">
              After making the payment, please upload the proof here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              value={proofUrl}
              onChange={setProofUrl}
              placeholder="Upload payment proof image"
              maxSize={3072} // 3MB
              compress={true}
              className="w-full"
            />
            <Button
              onClick={handleUploadProof}
              disabled={!proofUrl || uploading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Proof
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Proof Uploaded!</h2>
            <p className="text-gray-400 mb-6">
              Your payment proof has been uploaded successfully. We will verify your payment shortly.
            </p>
            <div className="space-y-2">
              <Badge className={getStatusColor(depositRequest?.status || '')}>
                {getStatusIcon(depositRequest?.status || '')}
                <span className="ml-1">{depositRequest?.status}</span>
              </Badge>
              <p className="text-sm text-gray-400">Deposit ID: {depositRequest?.id.slice(0, 8)}...</p>
            </div>
            <Button onClick={resetForm} className="mt-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
              Create New Deposit
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 backdrop-blur-xl border-violet-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-300 text-sm">Current Balance</p>
              <p className="text-3xl font-bold text-white">{formatRupiah(balance)}</p>
            </div>
            <Wallet className="w-12 h-12 text-violet-400" />
          </div>
        </CardContent>
      </Card>

      {/* Top Up Form */}
      <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Top Up Wallet</CardTitle>
          <CardDescription className="text-gray-400">
            Add funds to your wallet using various payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-3">
            <Label className="text-white">Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="10000"
              className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
            />
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"
                >
                  {formatRupiah(quickAmount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-white">Payment Method</Label>
            {loadingPaymentMethods ? (
              <div className="bg-slate-700/50 border-slate-600 rounded-lg p-4 text-center">
                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-amber-400 font-semibold mb-2">Maintenance Deposit</h3>
                <p className="text-gray-400 text-sm">
                  Deposit system is currently under maintenance. Please try again later.
                </p>
              </div>
            ) : (
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {paymentMethods.map((method) => (
                    <SelectItem 
                      key={method.id} 
                      value={method.id}
                      className="text-white hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(method.type)}
                        {method.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleCreateDeposit}
            disabled={!amount || !selectedMethod || loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Deposit...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Create Deposit Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Deposits */}
      <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDeposits ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : deposits.length > 0 ? (
            <div className="space-y-3">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{formatRupiah(deposit.amount)}</p>
                    <p className="text-gray-400 text-sm">{deposit.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(deposit.status)}>
                      {getStatusIcon(deposit.status)}
                      <span className="ml-1 text-xs">{deposit.status}</span>
                    </Badge>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(deposit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No deposits yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}