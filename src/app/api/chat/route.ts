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
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access this chat'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ 
        error: 'Missing required parameters',
        message: 'Chat ID is required'
      }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');
    
    const chat = await db.collection('chats').findOne({ 
      _id: new ObjectId(chatId)
    });

    if (!chat) {
      return NextResponse.json({ 
        error: 'Chat not found',
        message: 'Chat not found'
      }, { status: 404 });
    }

    const messages = await db.collection('messages')
      .find({ chatId })
      .sort({ timestamp: 1 })
      .toArray();

    console.log('Loaded messages:', JSON.stringify(messages, null, 2));

    // Ensure JSON data is properly parsed
    const parsedMessages = messages.map(msg => ({
      ...msg,
      json: msg.json ? JSON.parse(JSON.stringify(msg.json)) : undefined
    }));

    return NextResponse.json({ 
      messages: parsedMessages,
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        created_at: chat.created_at,
        user_id: chat.user_id
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
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to send messages'
      }, { status: 401 });
    }

    const { chatId, message, chatType } = await request.json();
    const userId = session.user.sub;

    if (!chatId || !message || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Chat ID and message are required'
      }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Save user message
    const messageToSave = {
      ...message,
      chatId,
      timestamp: new Date(),
      type: message.type || 'simple_text',
      json: message.json || undefined
    };

    await db.collection('messages').insertOne(messageToSave);

    return NextResponse.json({ 
      success: true,
      message: messageToSave
    });

  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while saving the message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
