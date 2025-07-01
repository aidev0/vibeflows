import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    const db = await getDb();
    const query = chatId ? { chat_id: chatId } : {};
    const messages = await db.collection('messages').find(query).sort({ created_at: 1 }).toArray();
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const messageData = await request.json();
    const db = await getDb();
    
    const result = await db.collection('messages').insertOne({
      ...messageData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const newMessage = {
      _id: result.insertedId,
      ...messageData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
} 