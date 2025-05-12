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

    const { title, type } = await request.json();
    const userId = session.user.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Create new chat with complete user information
    const chatId = new ObjectId();
    const now = new Date();
    
    const result = await db.collection('chats').insertOne({
      _id: chatId,
      id: chatId.toString(), // Add string ID for easier reference
      user_id: userId,
      // Store both prefixed and unprefixed versions for compatibility
      user_name: session.user.name,
      name: session.user.name,
      user_email: session.user.email,
      email: session.user.email,
      user_nickname: session.user.nickname,
      nickname: session.user.nickname,
      user_picture: session.user.picture,
      picture: session.user.picture,
      title: title || 'New Chat',
      type: type || 'workflow',
      created_at: now,
      updated_at: now,
      messageCount: 0,
      lastMessageAt: now
    });

    console.log('Created new chat:', chatId.toString());
    
    // Return the formatted chat object
    return NextResponse.json({ 
      chat: {
        id: chatId.toString(),
        title: title || 'New Chat',
        created_at: now.toISOString(),
        messageCount: 0,
        lastMessageAt: now.toISOString()
      },
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