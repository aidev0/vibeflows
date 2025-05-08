import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('MongoDB client obtained successfully');
    
    const db = client.db();
    console.log('Database instance created');
    
    // Test the connection by listing all collections
    console.log('Attempting to list collections...');
    const collections = await db.listCollections().toArray();
    console.log('Collections retrieved successfully:', collections.map(c => c.name));
    
    // Test write access by creating a test document
    console.log('Testing write access...');
    const testCollection = db.collection('connection_test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('Write test successful');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('Test cleanup successful');
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection and operations successful',
      collections: collections.map(c => c.name),
      connectionDetails: {
        database: db.databaseName,
        serverInfo: await db.admin().serverInfo()
      }
    });
  } catch (error) {
    console.error('MongoDB test error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: (error as any)?.code,
      codeName: (error as any)?.codeName,
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    });
    
    return NextResponse.json({
      status: 'error',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: (error as any)?.code,
        codeName: (error as any)?.codeName
      },
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    }, { status: 500 });
  }
} 