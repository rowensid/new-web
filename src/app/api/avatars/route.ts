import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function POST() {
  try {
    // Cari user yang belum punya avatar
    const usersWithoutAvatar = await db.user.findMany({
      where: {
        avatar: null
      }
    })
    
    if (usersWithoutAvatar.length === 0) {
      return NextResponse.json({ 
        message: 'Semua user sudah punya avatar',
        count: 0 
      })
    }
    
    // Update semua user tanpa avatar
    const updatePromises = usersWithoutAvatar.map(async (user) => {
      const randomAvatar = getRandomAvatar()
      await db.user.update({
        where: { id: user.id },
        data: { avatar: randomAvatar }
      })
      return { userId: user.id, email: user.email, avatar: randomAvatar }
    })
    
    const results = await Promise.all(updatePromises)
    
    return NextResponse.json({ 
      message: 'Berhasil update avatar',
      count: results.length,
      users: results
    })
    
  } catch (error) {
    console.error('Error updating avatars:', error)
    return NextResponse.json({ 
      error: 'Gagal update avatar' 
    }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}

export async function GET() {
  try {
    // Get statistics
    const totalUsers = await db.user.count()
    const usersWithAvatar = await db.user.count({
      where: {
        avatar: {
          not: null
        }
      }
    })
    const usersWithoutAvatar = totalUsers - usersWithAvatar
    
    return NextResponse.json({
      totalUsers,
      usersWithAvatar,
      usersWithoutAvatar,
      percentage: totalUsers > 0 ? Math.round((usersWithAvatar / totalUsers) * 100) : 0
    })
    
  } catch (error) {
    console.error('Error getting avatar stats:', error)
    return NextResponse.json({ 
      error: 'Gagal mendapatkan statistik' 
    }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}