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
    
    // Get all chats for the user, sorted by creation date
    const chats = await db.collection('chats')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    // Get message counts for each chat
    const chatsWithMessageCounts = await Promise.all(chats.map(async (chat) => {
      const messageCount = await db.collection('messages')
        .countDocuments({ chatId: chat._id.toString() });
      
      return {
        id: chat._id.toString(),
        title: chat.title || 'Untitled Chat',
        created_at: chat.created_at || chat._id.getTimestamp(),
        messageCount
      };
    }));

    return NextResponse.json({ chats: chatsWithMessageCounts });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 