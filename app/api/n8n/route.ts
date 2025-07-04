import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

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
        // Get latest workflow from database (n8n_workflows collection)
        const latestWorkflow = await db.collection('n8n_workflows')
          .findOne(
            { user_id: session.user.sub },
            { 
              sort: { created_at: -1 },
              projection: {
                workflow_json: 1,
                n8n_response: 1
              }
            }
          );
        console.log('Query result:', latestWorkflow ? 'Found workflow' : 'No workflows found');
        
        if (latestWorkflow) {
          // Add name from n8n_response if available
          const displayName = latestWorkflow.n8n_response?.name || latestWorkflow.workflow_json?.name || `Workflow ${latestWorkflow._id}`;
          latestWorkflow.name = displayName;
        }
        
        return NextResponse.json({ data: latestWorkflow ? [latestWorkflow] : [] });

      case 'list_workflows': {
        console.log('Fetching all workflows from n8n_workflows collection for list view...');
        // Get all workflows from database filtered by user_id
        const workflows = await db.collection('n8n_workflows')
          .find(
            { user_id: session.user.sub },
            { 
              sort: { created_at: -1 },
              projection: {
                workflow_json: 1,
                n8n_workflow_id: 1,
                n8n_response: 1,
                created_at: 1,
                updated_at: 1
              }
            }
          ).toArray();
        
        console.log('Query result:', workflows.length ? `Found ${workflows.length} workflows` : 'No workflows found');
        
        // Get N8N URL from credentials
        const n8nUrlKey = await db.collection('credentials').findOne({
          user_id: session.user.sub,
          name: 'N8N_URL'
        });
        
        console.log('N8N URL key found:', n8nUrlKey ? 'Yes' : 'No');
        if (n8nUrlKey) {
          console.log('N8N URL from key:', n8nUrlKey.value);
        }
        
        // Transform workflows to include URL and description
        const transformedWorkflows = workflows.map(workflow => {
          const nodeCount = workflow.workflow_json?.nodes?.length || 0;
          const N8N_URL = n8nUrlKey?.value || '';
          
          // Get name from n8n_response if available, otherwise use workflow_json name or fallback
          const n8nResponseName = workflow.n8n_response?.name;
          const workflowJsonName = workflow.workflow_json?.name;
          const displayName = n8nResponseName || workflowJsonName || `Workflow ${workflow._id}`;
          
          // Use n8n_response.id for the workflow ID
          const workflowId = workflow.n8n_response?.id || workflow.n8n_workflow_id;
          
          console.log(`Workflow ${workflow._id}: n8n_response.id=${workflow.n8n_response?.id}, n8n_workflow_id=${workflow.n8n_workflow_id}, final_id=${workflowId}`);
          console.log(`URL will be: ${N8N_URL && workflowId ? `${N8N_URL}/workflow/${workflowId}` : 'null'}`);
          
          return {
            _id: workflow._id,
            name: displayName,
            description: `n8n workflow with ${nodeCount} nodes`,
            workflow_json: workflow.workflow_json,
            n8n_response: workflow.n8n_response,
            url: N8N_URL && workflowId ? `${N8N_URL}/workflow/${workflowId}` : null,
            created_at: workflow.created_at,
            updated_at: workflow.updated_at,
            type: 'n8n_workflow'
          };
        });
        
        return NextResponse.json(transformedWorkflows);
      }

      case 'get_workflow': {
        console.log('Fetching specific workflow by ID...');
        const workflowId = searchParams.get('workflow_id');
        
        if (!workflowId) {
          return NextResponse.json({ error: 'workflow_id parameter required' }, { status: 400 });
        }
        
        console.log('Looking for workflow with _id:', workflowId);
        
        // Get specific workflow by _id
        const specificWorkflow = await db.collection('n8n_workflows')
          .findOne(
            { 
              _id: new (await import('mongodb')).ObjectId(workflowId),
              user_id: session.user.sub 
            },
            { 
              projection: {
                workflow_json: 1,
                n8n_workflow_id: 1,
                n8n_response: 1,
                created_at: 1,
                updated_at: 1
              }
            }
          );
        
        if (!specificWorkflow) {
          console.log('Workflow not found with _id:', workflowId);
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }
        
        // Get N8N URL from credentials
        const n8nUrlKey = await db.collection('credentials').findOne({
          user_id: session.user.sub,
          name: 'N8N_URL'
        });
        
        const displayName = specificWorkflow.n8n_response?.name || specificWorkflow.workflow_json?.name || `Workflow ${specificWorkflow._id}`;
        console.log('Found specific workflow:', displayName);
        
        // Use n8n_response.id for the workflow ID
        const n8nWorkflowId = specificWorkflow.n8n_response?.id || specificWorkflow.n8n_workflow_id;
        const N8N_URL = n8nUrlKey?.value || '';
        
        const transformedWorkflow = {
          _id: specificWorkflow._id,
          name: displayName,
          workflow_json: specificWorkflow.workflow_json,
          n8n_response: specificWorkflow.n8n_response,
          url: N8N_URL && n8nWorkflowId ? `${N8N_URL}/workflow/${n8nWorkflowId}` : null,
          created_at: specificWorkflow.created_at,
          updated_at: specificWorkflow.updated_at
        };
        
        return NextResponse.json(transformedWorkflow);
      }

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

