import { encode } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb';
import { User } from '../../../../lib/models/User';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
    const { username, password } = body;

    if (!username || !password) {
      return corsResponse({ error: 'Missing username or password' }, { status: 400 });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return corsResponse({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return corsResponse({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign the token using NextAuth JWT encoder
    const token = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.username,
        clinicId: user.clinicId,
        role: user.role
      },
      secret: process.env.NEXTAUTH_SECRET || '',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return corsResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        clinicId: user.clinicId,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return corsResponse({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
