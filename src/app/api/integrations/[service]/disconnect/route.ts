import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const client = new MongoClient(uri);

export async function POST(
  request: Request,
  { params }: { params: { service: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = params;
    if (!['gmail', 'sheets'].includes(service)) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    const { id } = await request.json();

    await client.connect();
    const db = client.db('vibeflows');
    const collection = db.collection('integrations');

    const query: any = {
      user_id: session.user.sub,
      provider: 'google',
      service
    };

    // If an ID is provided, only delete that specific integration
    if (id) {
      query._id = id;
    }

    await collection.deleteOne(query);
    await client.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 