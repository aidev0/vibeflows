import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  let client;
  try {
    const session = await getSession(request, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');
    
    // Get all chats for the user
    const chats = await db.collection('chats')
      .find({ user_id: userId })
      .toArray();

    // Get latest message and message count for each chat
    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      // Get the latest message for this chat
      const latestMessage = await db.collection('messages')
        .find({ chatId: chat._id.toString() })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      // Get total message count
      const messageCount = await db.collection('messages')
        .countDocuments({ chatId: chat._id.toString() });
      
      return {
        id: chat._id.toString(),
        title: chat.title || 'Untitled Chat',
        type: chat.type || 'workflow',
        created_at: chat.created_at || chat._id.getTimestamp(),
        messageCount,
        lastMessageAt: latestMessage[0]?.timestamp || chat.created_at || chat._id.getTimestamp()
      };
    }));

    // Sort chats by last message timestamp, newest first
    const sortedChats = chatsWithDetails.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({ chats: sortedChats });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 