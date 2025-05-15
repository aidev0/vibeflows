import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { getAuthUrl, SCOPES } from '@/lib/google/oauth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = getAuthUrl(SCOPES.SHEETS, 'sheets');
    console.log('Generated Sheets auth URL:', url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating Google Sheets auth URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 