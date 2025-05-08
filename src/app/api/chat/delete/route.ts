import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient, ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  let client;
  try {
    const session = await getSession(request, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const userId = session.user.sub;

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // First verify the chat belongs to the user
    const chat = await db.collection('chats').findOne({ 
      _id: new ObjectId(chatId),
      user_id: userId 
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Delete all messages associated with this chat
    await db.collection('messages').deleteMany({ chatId });

    // Delete the chat
    await db.collection('chats').deleteOne({ _id: new ObjectId(chatId) });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 