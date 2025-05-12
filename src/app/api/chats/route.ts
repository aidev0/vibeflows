import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const headersList = headers();
    const session = await getSession(request, { headers: headersList });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.sub;
    const isAdmin = currentUserId === process.env.ADMIN_ID;

    // Only allow admin to view all chats
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { client } = await connectToDatabase();
    const db = client.db('vibeflows');
    
    // Get all chats, sorted by lastMessageAt
    const chats = await db.collection('chats')
      .find({})
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Get all users
    const users = await db.collection('users').find({}).toArray();
    const userMap = new Map(users.map(user => [user.sub, user]));

    // Group chats by user
    const userChats: { [key: string]: { user: any; chats: any[] } } = {};
    chats.forEach(chat => {
      const userId = chat.user_id;
      if (!userChats[userId]) {
        userChats[userId] = {
          user: userMap.get(userId) || { name: 'Unknown User', email: 'unknown@example.com' },
          chats: []
        };
      }
      userChats[userId].chats.push({
        id: chat._id.toString(),
        title: chat.title || 'Untitled Chat',
        created_at: chat.created_at || chat._id.getTimestamp(),
        messageCount: chat.messageCount || 0,
        lastMessageAt: chat.lastMessageAt || chat.created_at || chat._id.getTimestamp(),
        user_id: chat.user_id
      });
    });

    return NextResponse.json({ userChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 