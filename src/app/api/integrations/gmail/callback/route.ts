import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { getTokens, storeTokens } from '@/lib/google/oauth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.redirect('/api/auth/login');
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect('/integrations?error=no_code');
    }

    // Exchange code for tokens
    const tokens = await getTokens(code);
    
    // Store tokens in database
    await storeTokens(session.user.sub, 'gmail', tokens);

    return NextResponse.redirect('/integrations?success=true');
  } catch (error) {
    console.error('Error in Gmail callback:', error);
    return NextResponse.redirect('/integrations?error=callback_failed');
  }
} 