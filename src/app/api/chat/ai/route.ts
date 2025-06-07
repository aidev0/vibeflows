import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();
    const { message, chatId, userId, chatType } = body;

    console.log('1. Received request:', { message, chatId, userId, chatType });

    // First save to MongoDB
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('vibeflows');

    // Save message to MongoDB with exact format
    const savedMessage = await db.collection('messages').insertOne({
      id: `user-${Date.now()}`,
      chatId,
      text: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'simple_text',
      json: null
    });

    console.log('2. Saved to MongoDB:', savedMessage);

    // Get the saved message document
    const messageDoc = await db.collection('messages').findOne({ _id: savedMessage.insertedId });
    console.log('3. Got message doc:', messageDoc);

    if (!messageDoc) {
      throw new Error('Failed to retrieve saved message');
    }

    if (!process.env.VIBEFLOWS_AI_API) {
      console.error('VIBEFLOWS_AI_API environment variable is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Format the message document to match expected structure
    const formattedMessage = {
      chatId: messageDoc.chatId,
      text: messageDoc.text,
    };

    console.log('4. Calling AI API:', process.env.VIBEFLOWS_AI_API);
    console.log('5. With body:', formattedMessage);

    // Send the MongoDB document to AI
    const response = await fetch(process.env.VIBEFLOWS_AI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedMessage),
    });

    console.log('6. AI API response status:', response.status);
    console.log('7. AI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        response: errorText
      });
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Return the response as a stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat/ai route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
} 