import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

export async function GET() {
  const client = new MongoClient(uri);
  
  try {
    const session = await getSession();
    console.log('Sync attempt - Session:', session?.user ? 'exists' : 'none');
    
    if (!session?.user) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('vibeflows');
    const usersCollection = db.collection('users');

    // Create user document with sub renamed to user_id
    const { sub, picture, ...rest } = session.user;
    const now = new Date().toISOString();
    const userDoc = {
      ...rest,
      user_id: sub,
      picture: picture || null,
      last_login: now,
      updated_at: now
    };

    console.log('Syncing user:', userDoc);

    const result = await usersCollection.updateOne(
      { user_id: userDoc.user_id },
      { 
        $set: userDoc,
        $setOnInsert: { created_at: now }
      },
      { upsert: true }
    );

    console.log('Sync result:', { 
      matched: result.matchedCount, 
      modified: result.modifiedCount,
      upserted: result.upsertedCount 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    try {
      await client.close();
      console.log('MongoDB connection closed');
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError);
    }
  }
} 