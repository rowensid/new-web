'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorAlertProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorAlert({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading the content.',
  onRetry,
  showRetry = true 
}: ErrorAlertProps) {
  return (
    <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription className="text-red-300">
          {message}
        </CardDescription>
      </CardHeader>
      {showRetry && onRetry && (
        <CardContent>
          <Button 
            onClick={onRetry}
            variant="outline" 
            className="border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  )
}