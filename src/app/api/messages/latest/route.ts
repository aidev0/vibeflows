import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Get the latest message for the user
    const latestMessage = await db.collection('messages')
      .aggregate([
        {
          $lookup: {
            from: 'chats',
            localField: 'chatId',
            foreignField: 'id',
            as: 'chat'
          }
        },
        {
          $match: {
            'chat.userId': session.user.sub
          }
        },
        {
          $sort: {
            timestamp: -1
          }
        },
        {
          $limit: 1
        }
      ])
      .toArray();

    if (latestMessage.length === 0) {
      return NextResponse.json({ latestMessage: null });
    }

    return NextResponse.json({ 
      latestMessage: {
        ...latestMessage[0],
        chatId: latestMessage[0].chatId
      }
    });
  } catch (error) {
    console.error('Error fetching latest message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 