import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { storeTokens, getUserEmail, GoogleTokens } from '@/lib/google/oauth';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const client = new MongoClient(uri);

// Get base URL for redirect URI
const getBaseUrl = () => {
  if (process.env.AUTH0_BASE_URL) {
    return process.env.AUTH0_BASE_URL;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return 'https://vibeflows.app';
};

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/api/auth/login', getBaseUrl()));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      return NextResponse.redirect(new URL('/integrations?error=no_code', getBaseUrl()));
    }

    if (!state || !['gmail', 'sheets'].includes(state)) {
      return NextResponse.redirect(new URL('/integrations?error=invalid_state', getBaseUrl()));
    }

    // Create OAuth client with correct redirect URI
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${getBaseUrl()}/api/integrations/google/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const googleTokens: GoogleTokens = {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date!,
      token_type: tokens.token_type!,
      scope: tokens.scope!
    };
    
    // Get user's email
    const email = await getUserEmail(googleTokens);
    
    // Store tokens and email in database
    await storeTokens(session.user.sub, state as 'gmail' | 'sheets', googleTokens);

    // Update email in database
    await client.connect();
    const db = client.db('vibeflows');
    const collection = db.collection('integrations');
    
    await collection.updateOne(
      { 
        user_id: session.user.sub,
        provider: 'google',
        service: state
      },
      { $set: { email } }
    );
    
    await client.close();

    return NextResponse.redirect(new URL('/integrations?success=true', getBaseUrl()));
  } catch (error) {
    console.error('Error in Google callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, getBaseUrl()));
  }
} 