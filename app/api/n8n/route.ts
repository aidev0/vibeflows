import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

// GET /api/n8n - Fetch workflows from database
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'db_workflows';

    const db = await getDb();
    
    switch (action) {
      case 'db_workflows':
        // Get latest workflow from database (n8n_workflows collection)
        const latestWorkflow = await db.collection('n8n_workflows')
          .findOne(
            { user_id: session.user.sub },
            { sort: { created_at: -1 } }
          );
        return NextResponse.json({ data: latestWorkflow ? [latestWorkflow] : [] });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('n8n API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch workflows from database',
      details: error.stack 
    }, { status: 500 });
  }
}

