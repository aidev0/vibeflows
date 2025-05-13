import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;
    const session = await getSession();
    const userId = session?.user?.sub;
    const isAdmin = userId === process.env.ADMIN_ID;

    // If admin, allow access without further checks
    if (isAdmin) {
      const { client } = await connectToDatabase();
      const db = client.db('vibeflows');
      
      const chat = await db.collection('chats').findOne({ 
        _id: new ObjectId(chatId)
      });

      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }

      const messages = await db.collection('messages')
        .find({ chatId: chatId })
        .sort({ timestamp: 1 })
        .toArray();

      return NextResponse.json({ 
        chat: {
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
        }
      });
    }

    // For non-admin users, require session
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client } = await connectToDatabase();
    const db = client.db('vibeflows');
    
    const chat = await db.collection('chats').findOne({ 
      _id: new ObjectId(chatId)
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify chat belongs to user
    if (chat.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await db.collection('messages')
      .find({ chatId: chatId })
      .sort({ timestamp: 1 })
      .toArray();

    return NextResponse.json({ 
      chat: {
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
      }
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 