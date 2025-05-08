import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient, ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  let client;
  try {
    const session = await getSession(request, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, title } = await request.json();
    const userId = session.user.sub;

    if (!chatId || !title || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Update the chat title
    await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId) },
      { $set: { title } }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error renaming chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 