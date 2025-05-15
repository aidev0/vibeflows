import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

export async function GET() {
  const client = new MongoClient(uri);
  
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('vibeflows');
    const collection = db.collection('integrations');

    const integrations = await collection
      .find({ user_id: session.user.sub })
      .project({ 
        _id: 1,
        provider: 1, 
        service: 1, 
        email: 1,
        access_token: 1,
        expires_at: 1,
        updated_at: 1 
      })
      .toArray();

    // Check for expired tokens
    const validIntegrations = integrations.map(integration => ({
      ...integration,
      connected: integration.access_token && integration.expires_at > Date.now()
    }));

    return NextResponse.json(validIntegrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 