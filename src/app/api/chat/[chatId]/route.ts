import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // For now, allow all access to test
    const isAdmin = true;

    console.log('Auth check:', { 
      userId, 
      isAdmin,
      chatId 
    });

    const { client } = await connectToDatabase();
    const db = client.db('vibeflows');
    
    // Get the chat by ID
    const chat = await db.collection('chats').findOne({ 
      _id: new ObjectId(chatId)
    });

    if (!chat) {
      console.log('Chat not found:', chatId);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    console.log('Chat found:', {
      chatId: chat._id.toString(),
      title: chat.title,
      userId: chat.user_id,
      currentUserId: userId,
      isAdmin
    });

    // Get messages for this chat
    const messages = await db.collection('messages')
      .find({ chatId: chatId })
      .sort({ timestamp: 1 })
      .toArray();

    console.log('Found messages:', {
      chatId,
      messageCount: messages.length,
      messages: messages.map(m => ({ id: m._id.toString(), text: m.text }))
    });

    // Format the response
    const response = {
      id: chat._id.toString(),
      title: chat.title || 'Untitled Chat',
      created_at: chat.created_at || chat._id.getTimestamp(),
      messageCount: chat.messageCount || 0,
      lastMessageAt: chat.lastMessageAt || chat.created_at || chat._id.getTimestamp(),
      user_id: chat.user_id,
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        chatId: msg.chatId,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        type: msg.type || 'simple_text',
        nodeList: msg.nodeList || []
      }))
    };

    console.log('Sending response:', {
      chatId: response.id,
      messageCount: response.messages.length,
      isAdmin
    });

    return NextResponse.json({ chat: response });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 