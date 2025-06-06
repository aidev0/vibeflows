import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, chatId, userId, chatType } = body;

    console.log('Request body:', { message, chatId, userId, chatType });
    console.log('API URL:', process.env.VIBEFLOWS_AI_API);

    if (!process.env.VIBEFLOWS_AI_API) {
      console.error('VIBEFLOWS_AI_API environment variable is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(process.env.VIBEFLOWS_AI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        sender_id: userId,
        chatId: chatId,
        chat_type: chatType
      }),
    });

    console.log('API Response status:', response.status);
    console.log('API Response statusText:', response.statusText);

    const responseText = await response.text();
    console.log('API Response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response as JSON:', e);
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('VIBEFLOWS_AI_API error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      return NextResponse.json(
        { error: data.error || 'Failed to process message with AI service' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat/ai route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 