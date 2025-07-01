import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

// Mock database - replace with your actual database connection
const mockFlows = [
  {
    _id: '1',
    name: 'Customer Onboarding Flow',
    description: 'Automated customer onboarding process with email verification and welcome sequence',
    nodes: [
      {
        id: 'node1',
        name: 'Email Capture',
        description: 'Capture customer email address',
        type: 'function',
        position: { x: 100, y: 100 }
      },
      {
        id: 'node2',
        name: 'Send Welcome Email',
        description: 'Send personalized welcome email',
        type: 'action',
        position: { x: 300, y: 100 }
      }
    ],
    edges: [
      { source: 'node1', target: 'node2' }
    ],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15')
  },
  {
    _id: '2',
    name: 'Lead Scoring Flow',
    description: 'Automated lead scoring based on user behavior and demographics',
    nodes: [
      {
        id: 'node1',
        name: 'Track User Behavior',
        description: 'Monitor user interactions',
        type: 'function',
        position: { x: 100, y: 100 }
      },
      {
        id: 'node2',
        name: 'Calculate Score',
        description: 'Calculate lead score',
        type: 'condition',
        position: { x: 300, y: 100 }
      }
    ],
    edges: [
      { source: 'node1', target: 'node2' }
    ],
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-20')
  }
];

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