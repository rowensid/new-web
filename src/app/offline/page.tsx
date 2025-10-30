'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WifiOff, RefreshCw, Home, Smartphone, Monitor, Zap } from 'lucide-react'

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        <Card className="bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Offline Mode
            </CardTitle>
            <CardDescription className="text-purple-300">
              Kamu sedang offline. Beberapa fitur mungkin tidak tersedia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Badge className="bg-white/20 text-white border-white/30 justify-center py-2">
                <Smartphone className="w-3 h-3 mr-1" />
                Mobile Ready
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 justify-center py-2">
                <Monitor className="w-3 h-3 mr-1" />
                Desktop Ready
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 justify-center py-2">
                <Zap className="w-3 h-3 mr-1" />
                Fast Loading
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 justify-center py-2">
                <RefreshCw className="w-3 h-3 mr-1" />
                Auto Sync
              </Badge>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                Halaman Utama
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-purple-300">
                A&S Studio tetap bisa diakses secara offline untuk beberapa fitur dasar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}