import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: targetUserId } = params;
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.sub;
    const isAdmin = currentUserId === process.env.ADMIN_ID;

    // If not admin, can only view own chats
    if (!isAdmin && currentUserId !== targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Auth check:', { 
      currentUserId, 
      targetUserId,
      isAdmin
    });

    const { client } = await connectToDatabase();
    const db = client.db('vibeflows');
    
    // Get all chats for the user
    const chats = await db.collection('chats')
      .find({ user_id: targetUserId })
      .sort({ created_at: -1 })
      .toArray();

    console.log('Found chats:', {
      targetUserId,
      chatCount: chats.length,
      chats: chats.map(c => ({ id: c._id.toString(), title: c.title }))
    });

    // Format the response
    const formattedChats = chats.map(chat => ({
      id: chat._id.toString(),
      title: chat.title || 'Untitled Chat',
      created_at: chat.created_at || chat._id.getTimestamp(),
      messageCount: chat.messageCount || 0,
      lastMessageAt: chat.lastMessageAt || chat.created_at || chat._id.getTimestamp(),
      user_id: chat.user_id
    }));

    console.log('Sending response:', {
      targetUserId,
      chatCount: formattedChats.length,
      isAdmin
    });

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 