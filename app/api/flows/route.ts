import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const flows = await db.collection('flows').find({}).toArray();
    
    return NextResponse.json(flows);
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const flowData = await request.json();
    const db = await getDb();
    
    const result = await db.collection('flows').insertOne({
      ...flowData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const newFlow = {
      _id: result.insertedId,
      ...flowData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return NextResponse.json(newFlow, { status: 201 });
  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 });
  }
} 