import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = await Promise.resolve(params.userId);
    const { client } = await connectToDatabase();
    const db = client.db('vibeflows');
    const chats = await db
      .collection('chats')
      .find({ user_id: userId })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Transform MongoDB documents to include string IDs
    const formattedChats = chats.map(chat => ({
      id: chat._id.toString(),
      title: chat.title || 'Untitled Chat',
      created_at: chat.created_at || chat._id.getTimestamp(),
      messageCount: chat.messageCount || 0,
      lastMessageAt: chat.lastMessageAt || chat.created_at || chat._id.getTimestamp(),
      user_id: chat.user_id
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 