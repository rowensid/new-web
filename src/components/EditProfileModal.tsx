'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Camera, User, Mail, Save, Loader2 } from 'lucide-react'
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

interface EditProfileModalProps {
  user: UserData
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedUser: UserData) => void
}

export default function EditProfileModal({ user, isOpen, onClose, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || ''
  })
  const [previewAvatar, setPreviewAvatar] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || ''
      })
      setPreviewAvatar(user.avatar || '')
      setErrors({})
    }
  }, [isOpen, user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ avatar: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' })
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setErrors({ avatar: 'File size must be less than 2MB' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewAvatar(e.target?.result as string)
      setErrors(prev => ({ ...prev, avatar: '' }))
    }
    reader.readAsDataURL(file)

    // Upload file
    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setErrors({ avatar: 'Authentication required' })
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({ ...prev, avatar: data.avatar }))
        setPreviewAvatar(data.avatar)
        setErrors({})
      } else {
        setErrors({ avatar: data.error || 'Failed to upload avatar' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrors({ avatar: 'Failed to upload avatar' })
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Email validation removed since it's read-only for members
    // Admin can change email in owner-panel

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setErrors({ submit: 'Authentication required' })
        return
      }

      // For regular users, only send name and avatar
      // Don't include email in the request
      const submitData = {
        name: formData.name,
        avatar: formData.avatar || null
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok) {
        // Update user data in localStorage
        localStorage.setItem('user_data', JSON.stringify(data.user))
        onUpdate(data.user)
        onClose()
      } else {
        // Handle specific error messages
        if (data.error === 'Email changes are not allowed. Please contact admin.') {
          setErrors({ 
            email: data.error,
            submit: 'Email changes are not allowed. Please contact admin.' 
          })
        } else {
          setErrors({ submit: data.error || 'Failed to update profile' })
        }
      }
    } catch (error) {
      console.error('Update error:', error)
      setErrors({ submit: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const removeAvatar = async () => {
    setPreviewAvatar('')
    setFormData(prev => ({ ...prev, avatar: '' }))
    
    // Update database to remove avatar
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, avatar: null })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('user_data', JSON.stringify(data.user))
        onUpdate(data.user)
      }
    } catch (error) {
      console.error('Remove avatar error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Update your profile information and photo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-violet-400" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-6">
                {/* Avatar Preview */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 p-1">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                      {previewAvatar ? (
                        <img 
                          src={previewAvatar} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                  </div>
                  {previewAvatar && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/50 rounded-lg hover:bg-violet-600/30 transition-colors">
                        <Upload className="w-4 h-4 text-violet-400" />
                        <span className="text-violet-300 text-sm">
                          {uploading ? 'Uploading...' : 'Choose Photo'}
                        </span>
                      </div>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                      />
                    </Label>
                  </div>
                  <p className="text-xs text-slate-500">
                    JPEG, PNG, WebP, or GIF (max 2MB, auto-compressed to max 500KB)
                  </p>
                  {errors.avatar && (
                    <p className="text-xs text-red-400">{errors.avatar}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-violet-400" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-400">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className={cn(
                      "bg-slate-800/30 border-slate-700/50 text-slate-400 placeholder:text-slate-600 cursor-not-allowed",
                      errors.email && "border-red-500/50 focus:ring-red-500/20"
                    )}
                    placeholder="Email (read-only)"
                  />
                  <p className="text-xs text-slate-500">
                    <i>Email cannot be changed here. Contact admin for email changes.</i>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Account Type</Label>
                <Badge className={cn(
                  "text-sm",
                  user.role === 'OWNER' ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500/30" :
                  user.role === 'ADMIN' ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-500/30" :
                  "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30"
                )}>
                  {user.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              disabled={saving || uploading}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}