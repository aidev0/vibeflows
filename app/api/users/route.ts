import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { ensureUserExists, getUserById } from '@/app/utils/userManager';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// GET /api/users - Get current user or ensure user exists
export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get';

    switch (action) {
      case 'ensure': {
        // Ensure user exists in database (create if not)
        const user = await ensureUserExists(session.user);
        return NextResponse.json({ user });
      }
      
      case 'get':
      default: {
        // Get existing user
        const user = await getUserById(session.user.sub);
        return NextResponse.json({ user });
      }
    }
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error)?.message 
    }, { status: 500 });
  }
}

// POST /api/users - Create or update user
export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists and update with latest Auth0 data
    const user = await ensureUserExists(session.user);
    
    return NextResponse.json({ 
      user,
      created: !user.created_at || user.created_at === user.updated_at
    });
  } catch (error) {
    console.error('User creation/update error:', error);
    return NextResponse.json({ 
      error: 'Failed to create/update user',
      details: (error as Error)?.message 
    }, { status: 500 });
  }
}