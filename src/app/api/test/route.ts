import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Test connection
    const client = await clientPromise;
    console.log('MongoDB client obtained');
    
    const db = client.db();
    console.log('Database instance created:', db.databaseName);
    
    // Test write operation
    const testCollection = db.collection('test');
    const testDoc = { test: true, timestamp: new Date() };
    const result = await testCollection.insertOne(testDoc);
    console.log('Write test successful:', result.insertedId);
    
    // Test read operation
    const readResult = await testCollection.findOne({ _id: result.insertedId });
    console.log('Read test successful:', readResult);
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('Cleanup successful');
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection and operations successful',
      details: {
        database: db.databaseName,
        writeTest: result.insertedId,
        readTest: readResult
      }
    });
  } catch (error) {
    console.error('MongoDB test error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      status: 'error',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 });
  }
} 