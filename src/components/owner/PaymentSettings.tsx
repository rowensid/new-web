'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Upload, Image as ImageIcon, Smartphone, Building2, CreditCard, Save, Trash2, 
  Plus, Edit2, Eye, EyeOff, Check, X, Sparkles, Zap, Shield, Crown,
  QrCode, Wallet, Banknote, ArrowUpRight, ArrowDownRight, Settings2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PaymentSetting {
  id?: string
  qrisImageUrl?: string
  qrisNumber?: string
  isActive?: boolean
  banks?: BankAccount[]
  ewallets?: EWalletAccount[]
}

interface BankAccount {
  id?: string
  bankName: string
  bankNumber: string
  bankAccount: string
  isActive: boolean
}

interface EWalletAccount {
  id?: string
  ewalletName: string
  ewalletNumber: string
  isActive: boolean
}

export default function PaymentSettings() {
  const [paymentSetting, setPaymentSetting] = useState<PaymentSetting>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankDialogOpen, setBankDialogOpen] = useState(false)
  const [ewalletDialogOpen, setEwalletDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [editingEwallet, setEditingEwallet] = useState<EWalletAccount | null>(null)
  const [newBank, setNewBank] = useState<BankAccount>({ bankName: '', bankNumber: '', bankAccount: '', isActive: true })
  const [newEwallet, setNewEwallet] = useState<EWalletAccount>({ ewalletName: '', ewalletNumber: '', isActive: true })

  useEffect(() => {
    fetchPaymentSettings()
  }, [])

  const fetchPaymentSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/payment-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPaymentSetting(data || { banks: [], ewallets: [] })
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
      toast.error('Gagal mengambil pengaturan pembayaran')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentSetting),
      })

      if (response.ok) {
        toast.success('Pengaturan pembayaran berhasil disimpan! ✨')
        await fetchPaymentSettings()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menyimpan pengaturan pembayaran')
      }
    } catch (error) {
      console.error('Error saving payment settings:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentSetting(prev => ({
          ...prev,
          qrisImageUrl: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addBank = () => {
    if (editingBank) {
      setPaymentSetting(prev => ({
        ...prev,
        banks: prev.banks?.map(bank => 
          bank.id === editingBank.id ? { ...newBank, id: editingBank.id } : bank
        ) || [{ ...newBank, id: Date.now().toString() }]
      }))
      setEditingBank(null)
    } else {
      setPaymentSetting(prev => ({
        ...prev,
        banks: [...(prev.banks || []), { ...newBank, id: Date.now().toString() }]
      }))
    }
    setNewBank({ bankName: '', bankNumber: '', bankAccount: '', isActive: true })
    setBankDialogOpen(false)
  }

  const deleteBank = (id: string) => {
    setPaymentSetting(prev => ({
      ...prev,
      banks: prev.banks?.filter(bank => bank.id !== id) || []
    }))
  }

  const toggleBankStatus = (id: string) => {
    setPaymentSetting(prev => ({
      ...prev,
      banks: prev.banks?.map(bank => 
        bank.id === id ? { ...bank, isActive: !bank.isActive } : bank
      ) || []
    }))
  }

  const addEwallet = () => {
    if (editingEwallet) {
      setPaymentSetting(prev => ({
        ...prev,
        ewallets: prev.ewallets?.map(ewallet => 
          ewallet.id === editingEwallet.id ? { ...newEwallet, id: editingEwallet.id } : ewallet
        ) || [{ ...newEwallet, id: Date.now().toString() }]
      }))
      setEditingEwallet(null)
    } else {
      setPaymentSetting(prev => ({
        ...prev,
        ewallets: [...(prev.ewallets || []), { ...newEwallet, id: Date.now().toString() }]
      }))
    }
    setNewEwallet({ ewalletName: '', ewalletNumber: '', isActive: true })
    setEwalletDialogOpen(false)
  }

  const deleteEwallet = (id: string) => {
    setPaymentSetting(prev => ({
      ...prev,
      ewallets: prev.ewallets?.filter(ewallet => ewallet.id !== id) || []
    }))
  }

  const toggleEwalletStatus = (id: string) => {
    setPaymentSetting(prev => ({
      ...prev,
      ewallets: prev.ewallets?.map(ewallet => 
        ewallet.id === id ? { ...ewallet, isActive: !ewallet.isActive } : ewallet
      ) || []
    }))
  }

  const updateField = (field: keyof PaymentSetting, value: any) => {
    setPaymentSetting(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gradient-to-r from-violet-500 to-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-gradient-to-r from-cyan-500 to-blue-500 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-gradient-to-r from-pink-500 to-rose-500 border-t-transparent rounded-full animate-spin animation-delay-300"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-6 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Loading Payment Settings...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Payment Settings
              </h1>
              <p className="text-purple-300 mt-1">Kelola metode pembayaran untuk transaksi</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <Label htmlFor="active-status" className="text-white">Aktif</Label>
              <Switch
                id="active-status"
                checked={paymentSetting.isActive || false}
                onCheckedChange={(checked) => updateField('isActive', checked)}
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="qris" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="qris" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <QrCode className="h-4 w-4" />
              QRIS
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Building2 className="h-4 w-4" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="ewallet" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Wallet className="h-4 w-4" />
              E-Wallet
            </TabsTrigger>
          </TabsList>

          {/* QRIS Tab */}
          <TabsContent value="qris" className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  QRIS Configuration
                  <Badge className="ml-auto bg-gradient-to-r from-violet-600 to-purple-600">Popular</Badge>
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Upload QR code untuk pembayaran via QRIS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-white font-semibold">QRIS Image</Label>
                    <div className="flex items-center space-x-4">
                      {paymentSetting.qrisImageUrl ? (
                        <div className="relative group">
                          <img
                            src={paymentSetting.qrisImageUrl}
                            alt="QRIS"
                            className="w-32 h-32 object-cover rounded-xl border-2 border-violet-500/30 shadow-xl group-hover:scale-105 transition-transform"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full shadow-lg"
                            onClick={() => updateField('qrisImageUrl', '')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-violet-500/30 rounded-xl flex items-center justify-center bg-violet-500/10">
                          <QrCode className="h-8 w-8 text-violet-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="cursor-pointer bg-black/40 border-violet-500/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                        />
                        <p className="text-sm text-purple-300 mt-2">
                          Upload QRIS (PNG, JPG, max 2MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-white font-semibold">Nomor HP Terkait</Label>
                    <Input
                      placeholder="0812-3456-7890"
                      value={paymentSetting.qrisNumber || ''}
                      onChange={(e) => updateField('qrisNumber', e.target.value)}
                      className="bg-black/40 border-violet-500/30 text-white placeholder:text-purple-400"
                    />
                    <p className="text-sm text-purple-300">
                      Nomor HP yang terhubung dengan QRIS
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Tab */}
          <TabsContent value="bank" className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    Bank Transfer Configuration
                  </div>
                  <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        onClick={() => {
                          setEditingBank(null)
                          setNewBank({ bankName: '', bankNumber: '', bankAccount: '', isActive: true })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bank
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 backdrop-blur-2xl border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
                        </DialogTitle>
                        <DialogDescription className="text-purple-300">
                          Add bank account information for transfer payments
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white">Bank Name</Label>
                          <Input
                            placeholder="BCA, Mandiri, BNI, etc"
                            value={newBank.bankName}
                            onChange={(e) => setNewBank(prev => ({ ...prev, bankName: e.target.value }))}
                            className="bg-black/40 border-violet-500/30 text-white placeholder:text-purple-400"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Account Number</Label>
                          <Input
                            placeholder="1234567890"
                            value={newBank.bankNumber}
                            onChange={(e) => setNewBank(prev => ({ ...prev, bankNumber: e.target.value }))}
                            className="bg-black/40 border-violet-500/30 text-white placeholder:text-purple-400"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Account Name</Label>
                          <Input
                            placeholder="Account Holder Name"
                            value={newBank.bankAccount}
                            onChange={(e) => setNewBank(prev => ({ ...prev, bankAccount: e.target.value }))}
                            className="bg-black/40 border-violet-500/30 text-white placeholder:text-purple-400"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={addBank}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                          >
                            {editingBank ? 'Update' : 'Add'} Bank
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Manage multiple bank accounts for transfer payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentSetting.banks?.map((bank) => (
                    <Card key={bank.id} className="bg-black/40 border-violet-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBankStatus(bank.id!)}
                              className="h-6 w-6 p-0"
                            >
                              {bank.isActive ? <Eye className="h-3 w-3 text-green-400" /> : <EyeOff className="h-3 w-3 text-gray-400" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingBank(bank)
                                setNewBank(bank)
                                setBankDialogOpen(true)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBank(bank.id!)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-white mb-1">{bank.bankName}</h4>
                        <p className="text-sm text-purple-300 mb-1">{bank.bankNumber}</p>
                        <p className="text-xs text-purple-400">a.n {bank.bankAccount}</p>
                        {bank.isActive && (
                          <Badge className="mt-2 bg-green-600/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!paymentSetting.banks || paymentSetting.banks.length === 0) && (
                    <div className="col-span-full text-center py-12">
                      <Building2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Bank Accounts</h3>
                      <p className="text-purple-300">Add your first bank account to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* E-Wallet Tab */}
          <TabsContent value="ewallet" className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-rose-600 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    E-Wallet Configuration
                  </div>
                  <Dialog open={ewalletDialogOpen} onOpenChange={setEwalletDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                        onClick={() => {
                          setEditingEwallet(null)
                          setNewEwallet({ ewalletName: '', ewalletNumber: '', isActive: true })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add E-Wallet
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 backdrop-blur-2xl border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          {editingEwallet ? 'Edit E-Wallet' : 'Add New E-Wallet'}
                        </DialogTitle>
                        <DialogDescription className="text-purple-300">
                          Add e-wallet account for digital payments
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white">E-Wallet Provider</Label>
                          <select
                            value={newEwallet.ewalletName}
                            onChange={(e) => setNewEwallet(prev => ({ ...prev, ewalletName: e.target.value }))}
                            className="w-full p-2 bg-black/40 border-violet-500/30 text-white rounded-md"
                          >
                            <option value="">Select E-Wallet</option>
                            <option value="GoPay">GoPay</option>
                            <option value="OVO">OVO</option>
                            <option value="DANA">DANA</option>
                            <option value="ShopeePay">ShopeePay</option>
                            <option value="LinkAja">LinkAja</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-white">Phone Number</Label>
                          <Input
                            placeholder="0812-3456-7890"
                            value={newEwallet.ewalletNumber}
                            onChange={(e) => setNewEwallet(prev => ({ ...prev, ewalletNumber: e.target.value }))}
                            className="bg-black/40 border-violet-500/30 text-white placeholder:text-purple-400"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEwalletDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={addEwallet}
                            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                          >
                            {editingEwallet ? 'Update' : 'Add'} E-Wallet
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Manage multiple e-wallet accounts for digital payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentSetting.ewallets?.map((ewallet) => (
                    <Card key={ewallet.id} className="bg-black/40 border-pink-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-pink-600 to-rose-600 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEwalletStatus(ewallet.id!)}
                              className="h-6 w-6 p-0"
                            >
                              {ewallet.isActive ? <Eye className="h-3 w-3 text-green-400" /> : <EyeOff className="h-3 w-3 text-gray-400" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEwallet(ewallet)
                                setNewEwallet(ewallet)
                                setEwalletDialogOpen(true)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEwallet(ewallet.id!)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-white mb-1">{ewallet.ewalletName}</h4>
                        <p className="text-sm text-purple-300">{ewallet.ewalletNumber}</p>
                        {ewallet.isActive && (
                          <Badge className="mt-2 bg-green-600/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!paymentSetting.ewallets || paymentSetting.ewallets.length === 0) && (
                    <div className="col-span-full text-center py-12">
                      <Wallet className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No E-Wallet Accounts</h3>
                      <p className="text-purple-300">Add your first e-wallet account to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Section */}
        {(paymentSetting.qrisImageUrl || paymentSetting.banks?.length || paymentSetting.ewallets?.length) && (
          <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                Customer Preview
                <Badge className="ml-auto bg-gradient-to-r from-amber-600 to-orange-600">Live Preview</Badge>
              </CardTitle>
              <CardDescription className="text-purple-300">
                This is how customers will see your payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentSetting.qrisImageUrl && (
                  <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="h-4 w-4 text-violet-400" />
                      <span className="font-medium text-white">QRIS</span>
                      {paymentSetting.isActive && (
                        <Badge className="ml-auto bg-green-600/20 text-green-400 border-green-500/30">
                          Active
                        </Badge>
                      )}
                    </div>
                    <img
                      src={paymentSetting.qrisImageUrl}
                      alt="QRIS"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    {paymentSetting.qrisNumber && (
                      <p className="text-sm text-purple-300">
                        <Smartphone className="h-3 w-3 inline mr-1" />
                        {paymentSetting.qrisNumber}
                      </p>
                    )}
                  </div>
                )}

                {paymentSetting.banks?.filter(bank => bank.isActive).map((bank) => (
                  <div key={bank.id} className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span className="font-medium text-white">{bank.bankName}</span>
                      <Badge className="ml-auto bg-green-600/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <p className="font-medium text-white mb-1">{bank.bankNumber}</p>
                    <p className="text-sm text-purple-300">
                      a.n {bank.bankAccount}
                    </p>
                  </div>
                ))}

                {paymentSetting.ewallets?.filter(ewallet => ewallet.isActive).map((ewallet) => (
                  <div key={ewallet.id} className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="h-4 w-4 text-pink-400" />
                      <span className="font-medium text-white">{ewallet.ewalletName}</span>
                      <Badge className="ml-auto bg-green-600/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-300">{ewallet.ewalletNumber}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}