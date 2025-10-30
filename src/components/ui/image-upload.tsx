'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, ZoomIn, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange?: (base64: string) => void
  placeholder?: string
  className?: string
  maxSize?: number // in KB
  compress?: boolean
}

export default function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Upload image", 
  className,
  maxSize = 2048, // 2MB default
  compress = true 
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFullImage, setShowFullImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Cannot get canvas context'))
            return
          }

          // Calculate new dimensions (max width 800px, max height 600px)
          let { width, height } = img
          const maxWidth = 800
          const maxHeight = 600

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with quality 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
          resolve(compressedBase64)
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      // Check file size
      if (file.size > maxSize * 1024) {
        throw new Error(`File size must be less than ${maxSize}KB`)
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      let base64: string
      
      if (compress) {
        base64 = await compressImage(file)
      } else {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      setPreview(base64)
      onChange?.(base64)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange?.('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = () => {
    if (!preview) return
    
    const link = document.createElement('a')
    link.href = preview
    link.download = `payment-proof-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {!preview ? (
          <Card className="border-dashed border-gray-600 hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-300">{placeholder}</span>
                  <span className="text-xs text-gray-500">
                    Max size: {maxSize}KB • JPG, PNG, WebP
                  </span>
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500 mt-2"></div>
                  )}
                </label>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="relative group">
              <div className="rounded-lg overflow-hidden border border-gray-700 bg-black/40">
                <img 
                  src={preview} 
                  alt="Payment proof" 
                  className="w-full h-auto max-h-96 object-contain cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setShowFullImage(true)}
                />
              </div>
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowFullImage(true)}
                  className="bg-black/80 hover:bg-black/90"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  className="bg-black/80 hover:bg-black/90"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  className="bg-red-600/80 hover:bg-red-600/90"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Click image to view full size</span>
              <span>Compressed for faster loading</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-2">
            {error}
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-6xl max-h-full">
            <img 
              src={preview} 
              alt="Payment proof full size" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-black/80 hover:bg-black/90"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}