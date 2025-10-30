'use client'

// Store Management Component - Updated with gradient buttons and better category visibility - v2
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Store, Plus, Edit, Trash2, Search, Filter, Eye, EyeOff, 
  ChevronLeft, ChevronRight, Image, Link, DollarSign, Package,
  Gamepad2, Server, Cloud, HardDrive, Star, TrendingUp, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRupiah, formatUSD } from '@/lib/currency'

interface StoreItem {
  id: string
  title: string
  description: string | null
  price: number
  category: 'MOD' | 'GAME' | 'HOSTING' | 'SERVER'
  imageUrl: string | null
  imageLink: string | null
  isActive: boolean
  featured: boolean
  metadata: any
  createdAt: string
  updatedAt: string
}

interface StoreItemsResponse {
  items: StoreItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function StoreManagement() {
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUSD, setShowUSD] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [imageMode, setImageMode] = useState<'upload' | 'link'>('upload')

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'MOD' as 'MOD' | 'GAME' | 'HOSTING' | 'SERVER',
    imageUrl: '',
    imageLink: '',
    featured: false
  })

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'MOD' as 'MOD' | 'GAME' | 'HOSTING' | 'SERVER',
    imageUrl: '',
    imageLink: '',
    featured: false
  })

  const getToken = () => localStorage.getItem('auth_token')

  const fetchItems = async () => {
    try {
      const token = getToken()
      if (!token) return

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        category: categoryFilter,
        status: statusFilter
      })

      const response = await fetch(`/api/store?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data: StoreItemsResponse = await response.json()
        setItems(data.items)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch store items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [pagination.page, search, categoryFilter, statusFilter])

  const handleCreateItem = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setFormData({
          title: '',
          description: '',
          price: '',
          category: 'MOD',
          imageUrl: '',
          imageLink: '',
          featured: false
        })
        setImageMode('upload')
        fetchItems()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create store item')
      }
    } catch (error) {
      console.error('Failed to create store item:', error)
      alert('Failed to create store item')
    }
  }

  const handleEditItem = async () => {
    if (!selectedItem) return

    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/store/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editFormData,
          price: parseFloat(editFormData.price)
        })
      })

      if (response.ok) {
        setShowEditDialog(false)
        setSelectedItem(null)
        setEditFormData({
          title: '',
          description: '',
          price: '',
          category: 'MOD',
          imageUrl: '',
          imageLink: '',
          featured: false
        })
        setImageMode('upload')
        fetchItems()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update store item')
      }
    } catch (error) {
      console.error('Failed to update store item:', error)
      alert('Failed to update store item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/store/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchItems()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete store item')
      }
    } catch (error) {
      console.error('Failed to delete store item:', error)
      alert('Failed to delete store item')
    }
  }

  const handleToggleStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/store/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchItems()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update item status')
      }
    } catch (error) {
      console.error('Failed to update item status:', error)
      alert('Failed to update item status')
    }
  }

  const openEditDialog = (item: StoreItem) => {
    setSelectedItem(item)
    setEditFormData({
      title: item.title,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || '',
      imageLink: item.imageLink || '',
      featured: item.featured
    })
    setImageMode(item.imageUrl ? 'upload' : 'link')
    setShowEditDialog(true)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MOD':
        return <Package className="w-4 h-4" />
      case 'GAME':
        return <Gamepad2 className="w-4 h-4" />
      case 'HOSTING':
        return <Cloud className="w-4 h-4" />
      case 'SERVER':
        return <HardDrive className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MOD':
        return 'bg-gradient-to-r from-violet-600 to-purple-600'
      case 'GAME':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600'
      case 'HOSTING':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600'
      case 'SERVER':
        return 'bg-gradient-to-r from-amber-600 to-orange-600'
      default:
        return 'bg-gradient-to-r from-gray-600 to-slate-600'
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'MOD':
        return 'border-violet-400 text-violet-100 bg-violet-500/30'
      case 'GAME':
        return 'border-cyan-400 text-cyan-100 bg-cyan-500/30'
      case 'HOSTING':
        return 'border-emerald-400 text-emerald-100 bg-emerald-500/30'
      case 'SERVER':
        return 'border-amber-400 text-amber-100 bg-amber-500/30'
      default:
        return 'border-gray-400 text-gray-100 bg-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              Store Management
            </span>
          </h2>
          <p className="text-purple-300">Kelola item toko dengan format harga Rupiah & USD</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUSD(!showUSD)}
            className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition-all duration-200"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {showUSD ? 'IDR Only' : 'IDR / USD'}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all duration-200 hover:shadow-pink-500/40">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-pink-500/30 shadow-2xl shadow-black/50 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Store Item
                </DialogTitle>
                <DialogDescription className="text-purple-300">
                  Fill in the details to add a new item
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white font-medium text-sm">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200"
                      placeholder="Item title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white font-medium text-sm">Harga (IDR) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 font-medium">IDR</span>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200 pl-16"
                        placeholder="0"
                        step="1000"
                        min="0"
                      />
                      {formData.price && parseFloat(formData.price) > 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                          ≈ {formatUSD(parseFloat(formData.price))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white font-medium text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200 resize-none"
                    placeholder="Describe your item..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white font-medium text-sm">Category *</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="bg-black/40 border-pink-500/30 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-pink-500/30 shadow-2xl">
                        <SelectItem value="MOD" className="text-white hover:bg-pink-500/20 focus:bg-pink-500/20">Mod</SelectItem>
                        <SelectItem value="GAME" className="text-white hover:bg-pink-500/20 focus:bg-pink-500/20">Game</SelectItem>
                        <SelectItem value="HOSTING" className="text-white hover:bg-pink-500/20 focus:bg-pink-500/20">Hosting</SelectItem>
                        <SelectItem value="SERVER" className="text-white hover:bg-pink-500/20 focus:bg-pink-500/20">Server (RDP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">Featured</Label>
                    <div className="flex items-center space-x-2 h-10 px-3 bg-black/40 border-pink-500/30 rounded-lg">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-pink-500/30 bg-black/40 text-pink-500 focus:ring-pink-500/20"
                      />
                      <Label htmlFor="featured" className="text-white text-sm cursor-pointer">
                        Featured item
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium text-sm">Image</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={imageMode === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageMode('upload')}
                      className={imageMode === 'upload' ? 'bg-pink-600 hover:bg-pink-700' : 'border-pink-500/30 text-white hover:bg-pink-500/20'}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant={imageMode === 'link' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImageMode('link')}
                      className={imageMode === 'link' ? 'bg-pink-600 hover:bg-pink-700' : 'border-pink-500/30 text-white hover:bg-pink-500/20'}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                  </div>
                  {imageMode === 'upload' ? (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          console.log('File selected:', file)
                        }
                      }}
                      className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200"
                      alt="Product image upload"
                    />
                  ) : (
                    <Input
                      value={formData.imageLink}
                      onChange={(e) => setFormData({ ...formData, imageLink: e.target.value })}
                      className="bg-black/40 border-pink-500/30 text-white placeholder-gray-400 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200"
                      placeholder="https://example.com/image.jpg"
                    />
                  )}
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="bg-white/10 border-pink-500/30 text-white hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateItem} 
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:shadow-pink-500/40"
                >
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder-gray-400 focus:border-pink-500/30 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-black/20 border-white/10 text-white focus:border-pink-500/30 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-pink-500/30 shadow-2xl">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="MOD">Mods</SelectItem>
                <SelectItem value="GAME">Games</SelectItem>
                <SelectItem value="HOSTING">Hosting</SelectItem>
                <SelectItem value="SERVER">Servers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-black/20 border-white/10 text-white focus:border-pink-500/30 focus:ring-2 focus:ring-pink-500/20 transition-all duration-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-pink-500/30 shadow-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="bg-gray-900/50 border-white/10 backdrop-blur-lg hover:border-pink-500/50 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", getCategoryColor(item.category))}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <Badge variant="outline" className={cn("border-2", getCategoryBadgeColor(item.category))}>
                    {item.category}
                  </Badge>
                </div>
                {item.featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <CardTitle className="text-white text-lg line-clamp-2">{item.title}</CardTitle>
              <CardDescription className="text-purple-300 line-clamp-3">
                {item.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-xl font-bold text-white">
                      {formatRupiah(item.price)}
                    </div>
                    {showUSD && (
                      <div className="text-xs text-gray-400">
                        ≈ {formatUSD(item.price)}
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={item.isActive ? "bg-green-500" : "bg-red-500"}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              {(item.imageUrl || item.imageLink) && (
                <div className="mb-4 rounded-lg overflow-hidden bg-black/20">
                  <img 
                    src={item.imageUrl || item.imageLink} 
                    alt={item.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200/1f2937/9ca3af?text=No+Image'
                      e.currentTarget.alt = 'No image available'
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => openEditDialog(item)}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:shadow-pink-500/40"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleToggleStatus(item.id, item.isActive)}
                  className={cn(
                    "flex-1 text-white shadow-lg transition-all duration-200",
                    item.isActive 
                      ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-yellow-500/25 hover:shadow-yellow-500/40" 
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/25 hover:shadow-green-500/40"
                  )}
                >
                  {item.isActive ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-red-500/40">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-red-500/30 shadow-2xl shadow-black/50 max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-lg font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Delete Store Item
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-purple-300">
                        Are you sure you want to delete <span className="text-white font-semibold">{item.title}</span>?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="py-2">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-300 text-sm">
                          This action cannot be undone and will permanently remove this item.
                        </p>
                      </div>
                    </div>

                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel className="bg-white/10 border-red-500/30 text-white hover:bg-white/20 transition-all duration-200">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteItem(item.id)}
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-red-500/40"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900/90 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-black/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Store Item
            </DialogTitle>
            <DialogDescription className="text-purple-300">
              Update the item information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-white font-medium text-sm">Title *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  placeholder="Item title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-white font-medium text-sm">Harga (IDR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 font-medium">IDR</span>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 pl-16"
                    placeholder="0"
                    step="1000"
                    min="0"
                  />
                  {editFormData.price && parseFloat(editFormData.price) > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      ≈ {formatUSD(parseFloat(editFormData.price))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-white font-medium text-sm">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 resize-none"
                placeholder="Describe your item..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-white font-medium text-sm">Category *</Label>
                <Select value={editFormData.category} onValueChange={(value: any) => setEditFormData({ ...editFormData, category: value })}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/90 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl">
                    <SelectItem value="MOD" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">Mod</SelectItem>
                    <SelectItem value="GAME" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">Game</SelectItem>
                    <SelectItem value="HOSTING" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">Hosting</SelectItem>
                    <SelectItem value="SERVER" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20">Server (RDP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Featured</Label>
                <div className="flex items-center space-x-2 h-10 px-3 bg-black/40 border-cyan-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={editFormData.featured}
                    onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-cyan-500/30 bg-black/40 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <Label htmlFor="edit-featured" className="text-white text-sm cursor-pointer">
                    Featured item
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium text-sm">Image</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={imageMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageMode('upload')}
                  className={imageMode === 'upload' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500/30 text-white hover:bg-cyan-500/20'}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={imageMode === 'link' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageMode('link')}
                  className={imageMode === 'link' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500/30 text-white hover:bg-cyan-500/20'}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Link
                </Button>
              </div>
              {imageMode === 'upload' ? (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      console.log('File selected:', file)
                    }
                  }}
                  className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  alt="Edit product image upload"
                />
              ) : (
                <Input
                  value={editFormData.imageLink}
                  onChange={(e) => setEditFormData({ ...editFormData, imageLink: e.target.value })}
                  className="bg-black/40 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  placeholder="https://example.com/image.jpg"
                />
              )}
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
              onClick={handleEditItem} 
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:shadow-cyan-500/40"
            >
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {items.length === 0 && (
        <Card className="bg-gray-900/50 border-white/10 backdrop-blur-lg">
          <CardContent className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Store Items Found</h3>
            <p className="text-purple-300 mb-4">Get started by adding your first store item</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}