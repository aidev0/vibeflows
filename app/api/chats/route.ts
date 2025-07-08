import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Check if user is authenticated
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if requesting user's own chats or admin accessing any user's chats
    const ADMIN_ID = process.env.ADMIN_ID;
    const isAdmin = ADMIN_ID && session.user.sub === ADMIN_ID;
    
    // If userId is provided and user is not admin, they can only access their own chats
    if (userId && userId !== session.user.sub && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Cannot access other users chats' }, { status: 403 });
    }
    
    const db = await getDb();
    const query = userId ? { user_id: userId } : { user_id: session.user.sub };
    const chats = await db.collection('chats').find(query).sort({ created_at: -1 }).toArray();
    
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const chatData = await request.json();
    const db = await getDb();
    
    const result = await db.collection('chats').insertOne({
      ...chatData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const newChat = {
      _id: result.insertedId,
      ...chatData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
} 