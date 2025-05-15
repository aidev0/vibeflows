import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { getTokens, storeTokens } from '@/lib/google/oauth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      return NextResponse.redirect(new URL('/integrations?error=no_code', request.url));
    }

    if (!state || !['gmail', 'sheets'].includes(state)) {
      return NextResponse.redirect(new URL('/integrations?error=invalid_state', request.url));
    }

    // Exchange code for tokens
    const tokens = await getTokens(code);
    
    // Store tokens in database based on state
    await storeTokens(session.user.sub, state as 'gmail' | 'sheets', tokens);

    return NextResponse.redirect(new URL('/integrations?success=true', request.url));
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/integrations?error=callback_failed', request.url));
  }
} 