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

    // Get the latest message for the current user
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

    console.log('Latest message query result:', latestMessage); // Debug log

    if (latestMessage.length === 0) {
      console.log('No messages found for user:', session.user.sub); // Debug log
      return NextResponse.json({ latestMessage: null });
    }

    const response = { 
      latestMessage: {
        ...latestMessage[0],
        chatId: latestMessage[0].chatId
      }
    };
    console.log('Returning response:', response); // Debug log

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching latest message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 