import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { getAuthUrl, SCOPES } from '@/lib/google/oauth';

const SERVICE_SCOPES: Record<string, string[]> = {
  gmail: SCOPES.GMAIL,
  sheets: SCOPES.SHEETS,
  // Add more services here as needed
};

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    if (!service || !SERVICE_SCOPES[service]) {
      return NextResponse.json({ error: 'Invalid or missing service' }, { status: 400 });
    }

    const url = getAuthUrl(SERVICE_SCOPES[service], service);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 