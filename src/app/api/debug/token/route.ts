import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // Get admin user
    const admin = await db.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
    }

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Also create session for database tracking
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.session.create({
      data: {
        id: 'session_debug_' + Date.now(),
        userId: admin.id,
        token,
        expiresAt
      }
    });

    return NextResponse.json({ 
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Token debug error:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}