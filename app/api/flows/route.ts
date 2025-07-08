import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const latest = searchParams.get('latest');
    
    // Check if user is authenticated
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if requesting user's own flows or admin accessing any user's flows
    const ADMIN_ID = process.env.ADMIN_ID;
    const isAdmin = ADMIN_ID && session.user.sub === ADMIN_ID;
    
    // If userId is provided and user is not admin, they can only access their own flows
    if (userId && userId !== session.user.sub && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Cannot access other users flows' }, { status: 403 });
    }
    
    const db = await getDb();
    
    // If userId and latest are specified, get the latest flow for that user
    if (userId && latest === 'true') {
      const latestFlow = await db.collection('flows')
        .findOne(
          { user_id: userId },
          { sort: { updated_at: -1, created_at: -1 } }
        );
      
      if (!latestFlow) {
        return NextResponse.json({ error: 'No flows found for this user' }, { status: 404 });
      }
      
      return NextResponse.json(latestFlow);
    }
    
    // If userId is specified, get all flows for that user
    if (userId) {
      const flows = await db.collection('flows')
        .find({ user_id: userId })
        .sort({ updated_at: -1, created_at: -1 })
        .toArray();
      
      return NextResponse.json(flows);
    }
    
    // Default: get flows for current user (or all flows if admin and no userId specified)
    const query = isAdmin ? {} : { user_id: session.user.sub };
    const flows = await db.collection('flows')
      .find(query)
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
    
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