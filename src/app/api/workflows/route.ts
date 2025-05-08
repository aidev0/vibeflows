import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  let client;
  try {
    const session = await getSession(request, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const userId = session.user.sub;

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Get workflows for this chat
    const workflows = await db.collection('workflows')
      .find({ 
        chat_id: chatId,
        user_id: userId 
      })
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({ workflows });

  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const { chatId, nodes, messageId } = await request.json();
    const userId = session.user.sub;

    if (!chatId || !nodes || !messageId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Save workflow
    const result = await db.collection('workflows').insertOne({
      chat_id: chatId,
      user_id: userId,
      message_id: messageId,
      nodes,
      created_at: new Date()
    });

    return NextResponse.json({ 
      workflowId: result.insertedId.toString(),
      success: true 
    });

  } catch (error) {
    console.error('Error saving workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 