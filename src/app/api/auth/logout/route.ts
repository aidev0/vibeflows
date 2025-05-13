import { NextResponse } from 'next/server';

export async function GET() {
  const auth0Domain = 'vibeflows.us.auth0.com';
  const clientId = process.env.AUTH0_CLIENT_ID;
  const returnTo = process.env.AUTH0_BASE_URL;
  
  const logoutUrl = `https://${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo)}`;
  
  return NextResponse.redirect(logoutUrl);
} 