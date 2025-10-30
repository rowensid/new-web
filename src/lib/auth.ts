import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function auth() {
  try {
    // This is a simplified version for server-side auth
    // In a real app, you'd get the session token from cookies
    const sessionToken = 'mock_token' // You'd get this from request cookies
    
    if (!sessionToken) {
      return null
    }

    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function authMiddleware(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No token provided' }
    }

    const token = authHeader.substring(7)

    // Find session with token
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return { success: false, error: 'Invalid or expired token' }
    }

    if (!session.user.isActive) {
      return { success: false, error: 'User account is inactive' }
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return { success: false, error: 'Internal server error' }
  }
}