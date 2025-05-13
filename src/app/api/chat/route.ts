// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { cookies } from 'next/headers';
import { MongoClient, ObjectId } from 'mongodb';
import { Message } from '@/models/Chat';

export async function GET(request: NextRequest) {
  let client;
  try {
    console.log('Starting chat API request...');
    
    const session = await getSession(request, new NextResponse());
    console.log('Session data:', {
      user: session?.user ? {
        sub: session.user.sub,
        email: session.user.email,
        allClaims: Object.keys(session.user)
      } : null
    });

    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access this chat'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const userId = session.user.sub;
    const isAdmin = userId === process.env.ADMIN_ID;

    console.log('Access check:', {
      userId,
      chatId,
      isAdmin
    });

    if (!chatId) {
      return NextResponse.json({ 
        error: 'Missing required parameters',
        message: 'Chat ID is required'
      }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');
    
    // Get chat by ID
    const chatQuery = { _id: new ObjectId(chatId) };
    const chat = await db.collection('chats').findOne(chatQuery);

    if (!chat) {
      return NextResponse.json({ 
        error: 'Chat not found',
        message: 'Chat not found'
      }, { status: 404 });
    }

    // If not admin, verify chat belongs to user
    if (!isAdmin && chat.user_id !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You do not have access to this chat'
      }, { status: 401 });
    }

    // Get messages for this chat
    const messages = await db.collection('messages')
      .find({ chatId })
      .sort({ timestamp: 1 })
      .toArray();

    return NextResponse.json({ 
      messages,
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        created_at: chat.created_at,
        user_id: chat.user_id,
        isAdmin
      }
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while loading the chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  try {
    const session = await getSession(request, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, message } = await request.json();
    const userId = session.user.sub;

    if (!chatId || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Verify chat belongs to user
    const chat = await db.collection('chats').findOne({
      _id: new ObjectId(chatId),
      user_id: userId
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Save message
    await db.collection('messages').insertOne({
      ...message,
      chatId,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
