import { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

export interface ClinicSession {
  id?: string;
  name?: string;
  email?: string;
  clinicId?: string;
  role?: string;
  [key: string]: any;
}

export async function getClinicSession(req: NextRequest): Promise<ClinicSession | null> {
  const defaultSession: ClinicSession = {
    id: 'direct-access-user',
    name: 'Direct Access Clinician',
    email: 'direct@psychiatryx.com',
    clinicId: process.env.DEFAULT_CLINIC_ID || 'demo-clinic-123',
    role: 'clinician'
  };

  // Allow Zero-Auth test bypass if explicitly requested via test header (disabled in production)
  if (req.headers.get('x-zero-auth-test') === 'true' && process.env.NODE_ENV !== 'production') {
    return defaultSession;
  }

  const secret = process.env.NEXTAUTH_SECRET;
  let rawToken: string | null = null;

  // 1. Try to get token from Authorization header (desktop client bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7);
  }

  // 2. Try to get token from cookies (web client browser session)
  if (!rawToken) {
    const isProd = process.env.NODE_ENV === 'production';
    const sessionCookieName = isProd
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    const cookie = req.cookies.get(sessionCookieName);
    if (cookie) {
      rawToken = cookie.value;
    }
  }

  // LOGIC SWITCH:
  // - If NO SECRET is configured: Default to "Direct Access" mode (Demo/Open Source).
  // - If SECRET IS configured: Require a valid token. No bypass.
  if (!secret) {
    return defaultSession;
  }

  // Secret is present, so a token is MANDATORY.
  if (!rawToken || rawToken === 'null' || rawToken === 'undefined') {
    return null;
  }

  try {
    const decoded = await decode({
      token: rawToken,
      secret: secret
    });
    return (decoded as ClinicSession) || null;
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}
