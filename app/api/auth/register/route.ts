import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '../../../../lib/mongodb';
import { User } from '../../../../lib/models/User';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Response helper
function corsResponse(data: any, init: ResponseInit = {}) {
  const status = init.status || 200;
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...init.headers },
  });
}

// OPTIONS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { name, username, password, clinicName } = body;

    if (!name || !username || !password || !clinicName) {
      return corsResponse({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return corsResponse({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return corsResponse({ error: 'Username already taken' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const clinicId = 'clinic-' + uuidv4().substring(0, 8);

    const newUser = await User.create({
      id: userId,
      username: username.toLowerCase(),
      passwordHash,
      name,
      clinicId,
      role: 'clinician',
      createdAt: new Date().toISOString(),
    });

    // Sign the token using NextAuth JWT encoder
    const token = await encode({
      token: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.username,
        clinicId: newUser.clinicId,
        role: newUser.role
      },
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-only-not-for-production',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return corsResponse({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        clinicId: newUser.clinicId,
        role: newUser.role,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return corsResponse({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
