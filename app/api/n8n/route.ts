import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

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
            { 
              sort: { created_at: -1 },
              projection: {
                workflow_json: 1,
                n8n_response: 1
              }
            }
          );
        
        if (latestWorkflow) {
          // Add name from n8n_response if available
          const displayName = latestWorkflow.n8n_response?.name || latestWorkflow.workflow_json?.name || `Workflow ${latestWorkflow._id}`;
          latestWorkflow.name = displayName;
        }
        
        return NextResponse.json({ data: latestWorkflow ? [latestWorkflow] : [] });

      case 'list_workflows': {
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
        
        // Get N8N URL from credentials
        const n8nUrlKey = await db.collection('credentials').findOne({
          user_id: session.user.sub,
          name: 'N8N_URL'
        });
        
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
        const workflowId = searchParams.get('workflow_id');
        
        if (!workflowId) {
          return NextResponse.json({ error: 'workflow_id parameter required' }, { status: 400 });
        }
        
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
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }
        
        // Get N8N URL from credentials
        const n8nUrlKey = await db.collection('credentials').findOne({
          user_id: session.user.sub,
          name: 'N8N_URL'
        });
        
        const displayName = specificWorkflow.n8n_response?.name || specificWorkflow.workflow_json?.name || `Workflow ${specificWorkflow._id}`;
        
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
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error)?.message || 'Failed to fetch workflows from database',
      details: (error as Error)?.stack 
    }, { status: 500 });
  }
}

