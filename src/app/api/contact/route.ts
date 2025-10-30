import { NextRequest, NextResponse } from 'next/server';
import { insert } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'All fields are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Insert contact message into database
    const contactData = {
      name,
      email,
      message,
      status: 'unread',
      createdAt: new Date()
    };

    // Assuming you have a 'contacts' table
    const contactId = await insert('contacts', contactData);

    return NextResponse.json({
      success: true,
      message: 'Contact message saved successfully',
      data: {
        id: contactId,
        ...contactData
      }
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save contact message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}