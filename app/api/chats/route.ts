import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const chats = await db.collection('chats').find({}).sort({ created_at: -1 }).toArray();
    
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const chatData = await request.json();
    const db = await getDb();
    
    const result = await db.collection('chats').insertOne({
      ...chatData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const newChat = {
      _id: result.insertedId,
      ...chatData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
} 