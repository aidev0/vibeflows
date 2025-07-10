import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const agents = await db.collection('agents').find({}).toArray();
    
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const agentData = await request.json();
    const db = await getDb();
    
    const result = await db.collection('agents').insertOne({
      ...agentData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const newAgent = {
      _id: result.insertedId,
      ...agentData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
} 