import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
})

// Simple ID generator
function generateShortId(length = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

function generateUserId(): string {
  return generateShortId(6)
}

// Random avatar URLs
const randomAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=',
  'https://api.dicebear.com/7.x/bottts/svg?seed=',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=',
]

function getRandomAvatar() {
  const avatarType = randomAvatars[Math.floor(Math.random() * randomAvatars.length)]
  const randomSeed = Math.random().toString(36).substring(7)
  return avatarType + randomSeed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with short ID
    const user = await db.user.create({
      data: {
        id: generateUserId(), // Use short ID instead of cuid
        email,
        name,
        password: hashedPassword,
        avatar: getRandomAvatar(), // Auto assign random avatar
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}