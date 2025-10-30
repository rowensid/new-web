import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get store item
    const storeItem = await db.storeItem.findUnique({
      where: { id }
    })

    if (!storeItem) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(storeItem)
  } catch (error) {
    console.error('Store GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, price, category, imageUrl, imageLink, featured, isActive } = body

    // Check if item exists
    const existingItem = await db.storeItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      )
    }

    // Update item
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (category !== undefined) updateData.category = category
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (imageLink !== undefined) updateData.imageLink = imageLink
    if (featured !== undefined) updateData.featured = featured
    if (isActive !== undefined) updateData.isActive = isActive

    const storeItem = await db.storeItem.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(storeItem)
  } catch (error) {
    console.error('Store PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update store item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if item exists
    const existingItem = await db.storeItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      )
    }

    // Delete item
    await db.storeItem.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Store item deleted successfully' })
  } catch (error) {
    console.error('Store DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete store item' },
      { status: 500 }
    )
  }
}