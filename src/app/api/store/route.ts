import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    }

    if (category !== 'all') {
      where.category = category
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Get total count
    const total = await db.storeItem.count({ where })

    // Get items
    const items = await db.storeItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    console.error('Store GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, price, category, imageUrl, imageLink, featured } = body

    if (!title || !price || !category) {
      return NextResponse.json(
        { error: 'Title, price, and category are required' },
        { status: 400 }
      )
    }

    const storeItem = await db.storeItem.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        imageLink,
        featured: featured || false
      }
    })

    return NextResponse.json(storeItem, { status: 201 })
  } catch (error) {
    console.error('Store POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create store item' },
      { status: 500 }
    )
  }
}