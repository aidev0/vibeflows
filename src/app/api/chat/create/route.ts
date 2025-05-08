import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient, ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  let client;
  try {
    const session = await getSession(request, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json();
    const userId = session.user.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Create new chat
    const result = await db.collection('chats').insertOne({
      user_id: userId,
      title: title || 'New Chat',
      created_at: new Date(),
      updated_at: new Date()
    });

    return NextResponse.json({ 
      chatId: result.insertedId.toString(),
      success: true 
    });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 