import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

// GET /api/n8n - Fetch workflows from database
export async function GET(request: Request) {
  console.log('=== N8N API ENDPOINT HIT ===');
  
  try {
    console.log('Getting session...');
    const session = await getSession();
    console.log('Session:', session?.user?.sub ? 'Found' : 'Not found');
    
    if (!session?.user?.sub) {
      console.log('No session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'db_workflows';
    console.log('Action:', action);
    console.log('User ID:', session.user.sub);

    console.log('Connecting to database...');
    const db = await getDb();
    console.log('Database connected');
    
    switch (action) {
      case 'db_workflows':
        console.log('Fetching workflows from n8n_workflows collection...');
        // Get latest workflow from database (n8n_workflows collection) - only name and workflow_json
        const latestWorkflow = await db.collection('n8n_workflows')
          .findOne(
            { user_id: session.user.sub },
            { 
              sort: { created_at: -1 },
              projection: {
                name: 1,
                workflow_json: 1
              }
            }
          );
        console.log('Query result:', latestWorkflow ? 'Found workflow' : 'No workflows found');
        return NextResponse.json({ data: latestWorkflow ? [latestWorkflow] : [] });
      default:
        console.log('Invalid action:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('n8n API error:', error);
    console.error('Error stack:', (error as Error)?.stack);
    return NextResponse.json({ 
      error: (error as Error)?.message || 'Failed to fetch workflows from database',
      details: (error as Error)?.stack 
    }, { status: 500 });
  }
}

