'use client'

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <Card className="border-purple-500/20 bg-black/40 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className={`animate-spin text-purple-400 ${sizeClasses[size]}`} />
        <p className="text-gray-400 mt-4">{message}</p>
      </CardContent>
    </Card>
  )
}