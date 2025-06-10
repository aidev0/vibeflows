import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'vibeflows';

async function getDb() {
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(dbName);
}

// GET: Get all n8n integrations for the current user
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = await getDb();
  const integrations = await db
    .collection('integrations')
    .find({ user_id: session.user.sub, type: 'n8n' })
    .toArray();
  return NextResponse.json(integrations);
}

// POST: Add a new n8n integration
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, data } = body;
  if (!name || !data?.N8N_API_KEY || !data?.N8N_URL) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const db = await getDb();
  const result = await db.collection('integrations').insertOne({
    name,
    type: 'n8n',
    data,
    user_id: session.user.sub,
    created_at: new Date(),
  });
  return NextResponse.json({ success: true, insertedId: result.insertedId });
} 