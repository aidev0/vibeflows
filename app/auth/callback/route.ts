import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('Auth0 error:', error);
    return NextResponse.redirect(new URL('/?error=' + error, request.url));
  }

  if (code) {
    // In a real implementation, you would exchange the code for tokens here
    // For now, just redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.redirect(new URL('/', request.url));
} 