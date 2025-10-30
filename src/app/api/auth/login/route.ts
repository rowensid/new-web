import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Simple ID generators
function generateShortId(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateSessionId(): string {
  return `session_${Date.now()}_${generateShortId(8)}`
}

function generateLoginHistoryId(): string {
  return `login_${Date.now()}_${generateShortId(6)}`
}

// Fungsi untuk mendeteksi device dari user agent
function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'Tablet'
    }
    return 'Mobile'
  }
  
  return 'Desktop'
}

// Fungsi untuk mendeteksi browser dari user agent
function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome'
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
  if (ua.includes('edg')) return 'Edge'
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera'
  
  return 'Unknown'
}

// Fungsi untuk mendapatkan lokasi dari IP (simplified version)
async function getLocationFromIP(ip: string): Promise<string> {
  try {
    // Untuk development, kita return default location
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return 'Local Network'
    }
    
    // Untuk production, bisa menggunakan external API seperti ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    if (response.ok) {
      const data = await response.json()
      if (data.status === 'success') {
        return `${data.city}, ${data.country}`
      }
    }
  } catch (error) {
    console.error('Error getting location:', error)
  }
  
  return 'Unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email belum terdaftar. Silakan daftar terlebih dahulu.' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Silakan hubungi admin.' },
        { status: 401 }
      )
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Password salah. Silakan coba lagi.' },
        { status: 401 }
      )
    }

    // Get client information
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1'
    
    const device = detectDevice(userAgent)
    const browser = detectBrowser(userAgent)
    const location = await getLocationFromIP(ip)

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Create session
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.session.create({
      data: {
        id: generateSessionId(), // Use short ID
        userId: user.id,
        token,
        expiresAt
      }
    })

    // Save login history to database
    try {
      const newLoginHistory = await db.loginHistory.create({
        data: {
          id: generateLoginHistoryId(), // Use short ID
          userId: user.id,
          ip,
          userAgent,
          location,
          device,
          browser,
          isActive: true
        }
      })

      // Set previous active sessions to inactive (only if we have the new ID)
      if (newLoginHistory?.id) {
        await db.loginHistory.updateMany({
          where: {
            userId: user.id,
            isActive: true,
            id: {
              not: newLoginHistory.id
            }
          },
          data: {
            isActive: false
          }
        })
      }
    } catch (historyError) {
      console.error('Error saving login history:', historyError)
      // Continue with login even if history saving fails
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    // Set HTTP-only cookie for token (more secure)
    const response = NextResponse.json({
      message: 'Login berhasil!',
      user: userWithoutPassword,
      token
    })

    // Set cookie as backup
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Tidak dapat terhubung ke server. Silakan coba lagi.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout. Silakan coba lagi.' },
          { status: 408 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}