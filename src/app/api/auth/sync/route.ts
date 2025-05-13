import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import { connectToDatabase } from '@/lib/mongodb';

const ADMIN_ID = process.env.ADMIN_ID;

export async function GET() {
  try {
    const session = await getSession();
    console.log('Sync route - Session:', session);
    console.log('Sync route - Session user:', session?.user);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Update or insert the current user
    const result = await db.collection('users').updateOne(
      { user_id: session.user.sub },
      {
        $set: {
          user_id: session.user.sub,
          name: session.user.name,
          email: session.user.email,
          nickname: session.user.nickname,
          picture: session.user.picture,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isAdmin: session.user.sub === ADMIN_ID
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in sync route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 