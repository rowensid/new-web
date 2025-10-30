'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/avatar'

interface AvatarUploadProps {
  currentAvatar?: string
  userName: string
  onAvatarUpdate: (avatar: string | null) => void
  maxSize?: number // in MB
  disabled?: boolean
}

export default function AvatarUpload({ 
  currentAvatar, 
  userName, 
  onAvatarUpdate, 
  maxSize = 5,
  disabled = false
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Hanya file JPEG, PNG, WebP, dan GIF yang diperbolehkan')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSize}MB`)
      return
    }

    setError(null)
    setSuccess(false)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!preview || !fileInputRef.current?.files?.[0]) return

    setUploading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      const formData = new FormData()
      formData.append('file', fileInputRef.current.files[0])

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        onAvatarUpdate(data.avatar)
        setSuccess(true)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(data.error || 'Gagal mengupload avatar')
      }

    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      const response = await fetch('/api/user/upload-avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        onAvatarUpdate(null)
        setSuccess(true)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(data.error || 'Gagal menghapus avatar')
      }

    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menghapus avatar')
    } finally {
      setUploading(false)
    }
  }

  const cancelPreview = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayAvatar = preview || currentAvatar

  return (
    <Card className="bg-gray-900/50 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          Foto Profil
        </CardTitle>
        <CardDescription className="text-cyan-300">
          Upload foto profil anda. Maksimal {maxSize}MB. Format: JPEG, PNG, WebP, GIF.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Avatar Preview */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${getAvatarColor(userName)} flex items-center justify-center`}>
                  <span className="text-white text-xl font-bold">
                    {getInitials(userName)}
                  </span>
                </div>
              )}
            </div>
            
            {preview && (
              <div className="absolute -top-2 -right-2">
                <Badge variant="destructive" className="text-xs">
                  Preview
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
            disabled={disabled || uploading}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              variant="outline"
              className="flex-1 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Pilih Foto
            </Button>
            
            {currentAvatar && !preview && (
              <Button
                onClick={handleRemove}
                disabled={disabled || uploading}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview Actions */}
        {preview && (
          <div className="flex gap-2 p-3 bg-gray-800/50 rounded-lg border border-cyan-500/20">
            <div className="flex-1">
              <p className="text-sm text-cyan-300 mb-1">Preview avatar baru:</p>
              <p className="text-xs text-gray-400">
                Klik "Upload" untuk menyimpan atau "Batal" untuk membatalkan
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={cancelPreview}
                disabled={uploading}
                variant="outline"
                size="sm"
                className="border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400">
              {currentAvatar ? 'Avatar berhasil diperbarui!' : 'Avatar berhasil dihapus!'}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Foto akan disimpan sebagai file di server</p>
          <p>• URL file yang pendek akan disimpan di database</p>
          <p>• Maksimal ukuran file: {maxSize}MB</p>
        </div>
      </CardContent>
    </Card>
  )
}