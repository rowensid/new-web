'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles, CheckCircle } from 'lucide-react'
import Logo from '@/components/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'error' | 'warning' | 'info'>('error')
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Add animation trigger after mount
  useEffect(() => {
    if (isMounted) {
      // Trigger animations
      const timer = setTimeout(() => {
        document.querySelectorAll('.opacity-0').forEach(el => {
          el.classList.remove('opacity-0')
          el.classList.add('opacity-100')
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorType('error')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        
        // Show success message briefly before redirect
        setError('Login berhasil! Mengalihkan...')
        setErrorType('info')
        
        // Small delay to show success message
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Redirect to gateway page
        router.push('/gateway')
      } else {
        setError(data.error || 'Login gagal')
        // Set error type based on message
        if (data.error?.includes('belum terdaftar')) {
          setErrorType('info')
        } else if (data.error?.includes('dinonaktifkan')) {
          setErrorType('warning')
        } else {
          setErrorType('error')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.name === 'AbortError') {
        setError('Timeout. Silakan coba lagi.')
      } else {
        setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
      }
      setErrorType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Elemen Background Animasi */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-4000"></div>
        
        {/* Overlay Pola Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Konten Utama */}
      <div className={`relative z-10 w-full max-w-lg mx-auto p-4 transition-all duration-700 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Kartu Login */}
        <Card className={`bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden transition-all duration-700 delay-500 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Header Kartu dengan Border Gradient */}
          <div className="h-1 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600"></div>
          
          <CardHeader className="text-center pb-6">
            <div className={`flex justify-center mb-6 transition-all duration-500 delay-700 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div className="relative">
                <Logo size="lg" />
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              </div>
            </div>
            
            <div className={`space-y-2 transition-all duration-500 delay-900 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <CardTitle className="text-3xl font-bold text-white">
                Masuk ke Akun Anda
              </CardTitle>
              <CardDescription className="text-purple-300 text-base">
                Selamat datang kembali! Silakan masuk untuk melanjutkan
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field Email */}
              <div className={`space-y-2 transition-all duration-300 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <Label htmlFor="email" className="text-white font-medium flex items-center gap-2">
                  <Mail className={`w-4 h-4 text-violet-400 transition-colors duration-200 ${isFocused === 'email' ? 'text-violet-300' : ''}`} />
                  Alamat Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                    placeholder="nama@email.com"
                    className={`bg-black/20 border-white/10 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200 h-12 ${isFocused === 'email' ? 'border-violet-500/50 bg-black/30' : ''}`}
                    required
                  />
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${email && email.includes('@') ? 'text-green-400' : 'text-gray-400'}`}>
                    {email && email.includes('@') ? <CheckCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                </div>
              </div>
              
              {/* Field Password */}
              <div className={`space-y-2 transition-all duration-300 delay-100 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <Label htmlFor="password" className="text-white font-medium flex items-center gap-2">
                  <Lock className={`w-4 h-4 text-violet-400 transition-colors duration-200 ${isFocused === 'password' ? 'text-violet-300' : ''}`} />
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    placeholder="Masukkan kata sandi Anda"
                    className={`bg-black/20 border-white/10 text-white placeholder-gray-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200 h-12 pr-12 ${isFocused === 'password' ? 'border-violet-500/50 bg-black/30' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Pesan Error/Info */}
              {error && (
                <div className={`
                  p-4 border rounded-xl flex items-start gap-3 transition-all duration-300 animate-slideIn
                  ${errorType === 'error' ? 'bg-red-500/10 border-red-500/30' : ''}
                  ${errorType === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : ''}
                  ${errorType === 'info' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                `}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {errorType === 'error' && <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>}
                    {errorType === 'warning' && <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>}
                    {errorType === 'info' && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                  </div>
                  <p className={`
                    text-sm font-medium
                    ${errorType === 'error' ? 'text-red-400' : ''}
                    ${errorType === 'warning' ? 'text-amber-400' : ''}
                    ${errorType === 'info' ? 'text-blue-400' : ''}
                  `}>{error}</p>
                </div>
              )}

              {/* Tombol Login */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium h-12 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sedang Masuk...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Masuk</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-900 {
          animation-delay: 900ms;
        }
      `}</style>
    </div>
  )
}