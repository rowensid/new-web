import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'

// A4 dimensions in mm
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 20

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Invoice download request for order:', params.id)
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      console.log('No token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find session by token
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      console.log('Invalid or expired token')
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    console.log('Token valid for user:', session.user.id)

    // Get order with related data
    const order = await db.order.findFirst({
      where: { 
        id: params.id,
        userId: session.userId 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        storeItem: true,
      }
    })

    if (!order) {
      console.log('Order not found for user:', session.userId, 'order:', params.id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('Order found:', order.id, 'generating PDF...')

    // Create PDF
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Colors
    const primaryColor = [99, 102, 241] // Indigo
    const secondaryColor = [107, 114, 128] // Gray
    const accentColor = [16, 185, 129] // Emerald
    
    // Helper functions
    const setColor = (color: number[]) => pdf.setTextColor(...color)
    const setFillColor = (color: number[]) => pdf.setFillColor(...color)
    
    // Header Background
    setFillColor(primaryColor)
    pdf.rect(0, 0, pageWidth, 80, 'F')
    
    // Company Info (White text on colored background)
    pdf.setFontSize(24)
    pdf.setFont(undefined, 'bold')
    setColor([255, 255, 255])
    pdf.text('INVOICE', MARGIN, 30)
    
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'normal')
    setColor([255, 255, 255])
    pdf.text('Your Company Name', MARGIN, 40)
    pdf.text('Jl. Example No. 123, Jakarta, Indonesia', MARGIN, 47)
    pdf.text('Email: support@yourcompany.com', MARGIN, 54)
    pdf.text('Phone: +62 812-3456-7890', MARGIN, 61)
    
    // Invoice Details Box
    const detailsX = pageWidth - 80
    setFillColor([255, 255, 255])
    pdf.rect(detailsX - 10, 20, 70, 50, 'F')
    setFillColor(primaryColor)
    pdf.rect(detailsX - 10, 20, 70, 50)
    
    setColor([255, 255, 255])
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'bold')
    pdf.text('INVOICE #', detailsX, 30)
    pdf.setFont(undefined, 'normal')
    pdf.text(order.id, detailsX, 37)
    
    pdf.text('Date:', detailsX, 47)
    pdf.text(new Date(order.createdAt).toLocaleDateString('id-ID'), detailsX, 54)
    
    pdf.text('Status:', detailsX, 64)
    setColor([16, 185, 129])
    pdf.text(order.status, detailsX, 71)
    
    // Billing Information
    let yPosition = 100
    setColor(primaryColor)
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('Bill To:', MARGIN, yPosition)
    
    yPosition += 10
    setColor(secondaryColor)
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'normal')
    pdf.text(order.user.name, MARGIN, yPosition)
    
    yPosition += 7
    pdf.text(order.user.email, MARGIN, yPosition)
    
    yPosition += 7
    pdf.text(`Customer ID: ${order.user.id}`, MARGIN, yPosition)
    
    // Order Items Table
    yPosition += 20
    setColor(primaryColor)
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('Order Details:', MARGIN, yPosition)
    
    yPosition += 15
    
    // Table Header
    setFillColor([249, 250, 251])
    pdf.rect(MARGIN, yPosition - 5, pageWidth - 2 * MARGIN, 10, 'F')
    setColor(primaryColor)
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'bold')
    pdf.text('Description', MARGIN + 5, yPosition)
    pdf.text('Category', MARGIN + 80, yPosition)
    pdf.text('Qty', MARGIN + 130, yPosition)
    pdf.text('Price', MARGIN + 150, yPosition)
    pdf.text('Total', pageWidth - MARGIN - 30, yPosition)
    
    // Table Row
    yPosition += 10
    setFillColor([255, 255, 255])
    pdf.rect(MARGIN, yPosition - 5, pageWidth - 2 * MARGIN, 10, 'F')
    setColor(secondaryColor)
    pdf.setFont(undefined, 'normal')
    
    // Truncate long text to prevent jsPDF errors
    const title = order.storeItem.title.length > 40 ? order.storeItem.title.substring(0, 40) + '...' : order.storeItem.title
    pdf.text(title, MARGIN + 5, yPosition)
    pdf.text(order.storeItem.category, MARGIN + 80, yPosition)
    pdf.text('1', MARGIN + 130, yPosition)
    pdf.text(`Rp ${order.amount.toLocaleString('id-ID')}`, MARGIN + 150, yPosition)
    pdf.text(`Rp ${order.amount.toLocaleString('id-ID')}`, pageWidth - MARGIN - 30, yPosition)
    
    // Total Section
    yPosition += 30
    setFillColor([249, 250, 251])
    pdf.rect(pageWidth - 100, yPosition - 5, 80, 60, 'F')
    
    setColor(secondaryColor)
    pdf.setFontSize(11)
    pdf.text('Subtotal:', pageWidth - 90, yPosition)
    pdf.text(`Rp ${order.amount.toLocaleString('id-ID')}`, pageWidth - MARGIN - 10, yPosition)
    
    yPosition += 10
    pdf.text('Tax (0%):', pageWidth - 90, yPosition)
    pdf.text('Rp 0', pageWidth - MARGIN - 10, yPosition)
    
    yPosition += 10
    pdf.setDrawColor(primaryColor)
    pdf.setLineWidth(0.5)
    pdf.line(pageWidth - 90, yPosition + 2, pageWidth - MARGIN - 10, yPosition + 2)
    
    yPosition += 10
    setColor(primaryColor)
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.text('TOTAL:', pageWidth - 90, yPosition)
    pdf.text(`Rp ${order.amount.toLocaleString('id-ID')}`, pageWidth - MARGIN - 10, yPosition)
    
    // Payment Information
    yPosition += 30
    setColor(primaryColor)
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.text('Payment Information:', MARGIN, yPosition)
    
    yPosition += 10
    setColor(secondaryColor)
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(10)
    pdf.text(`Payment Method: ${order.paymentMethod}`, MARGIN, yPosition)
    
    yPosition += 7
    pdf.text(`Payment Status: ${order.status}`, MARGIN, yPosition)
    
    if (order.notes) {
      yPosition += 7
      pdf.text(`Notes: ${order.notes}`, MARGIN, yPosition)
    }
    
    // Footer
    yPosition = pageHeight - 40
    setColor(secondaryColor)
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'italic')
    pdf.text('Thank you for your business!', MARGIN, yPosition)
    
    yPosition += 7
    pdf.text('This is a computer-generated invoice and does not require a signature.', MARGIN, yPosition)
    
    // Add border
    setDrawColor(primaryColor)
    pdf.setLineWidth(1)
    pdf.rect(5, 5, pageWidth - 10, pageHeight - 10)
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    
    // Create response with proper headers
    const response = new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
    
    return response

  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}