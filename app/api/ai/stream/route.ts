import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

export async function POST(request: Request) {
  
  try {
    const { user_query, chat_id, user_id } = await request.json();
    
    if (!user_query) {
      return NextResponse.json({ error: 'user_query is required' }, { status: 400 });
    }

    // Save user message to database if chat_id is provided
    if (chat_id) {
      const db = await getDb();
      await db.collection('messages').insertOne({
        chat_id: chat_id,
        user_id: user_id,
        text: user_query,
        role: 'user',
        type: 'text',
        created_at: new Date()
      });
    }

    // Forward request to local AI API on port 8000
    const VIBEFLOWS_AI_API_URL = process.env.VIBEFLOWS_AI_API_URL;
    const AI_API_URL = `${VIBEFLOWS_AI_API_URL}/api/ai/stream`
    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        user_query,
        chat_id,
        user_id
      }),
    });

    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API responded with status: ${aiResponse.status} - ${errorText}`);
    }

    // Create a transform stream to handle the AI response and save to database
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullAIResponse = '';
    let chunkCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "thought_stream", 
            message: "No response stream available", 
            final: true 
          })}\n\n`));
          controller.close();
          return;
        }

        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              
              // Process any remaining buffer content
              if (buffer.trim()) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (line.trim() && line.startsWith('data: ')) {
                    try {
                      const jsonStr = line.slice(6).trim();
                      if (jsonStr && jsonStr !== '[DONE]') {
                        const data = JSON.parse(jsonStr);
                        if (data.type === 'thought_stream' && data.message) {
                          fullAIResponse += data.message;
                        }
                      }
                    } catch (e: any) {
                    }
                  }
                }
              }
              
              // Save complete AI response to database if chat_id is provided
              if (chat_id && fullAIResponse) {
                const db = await getDb();
                await db.collection('messages').insertOne({
                  chat_id: chat_id,
                  user_id: user_id,
                  text: fullAIResponse,
                  role: 'assistant',
                  type: 'text',
                  created_at: new Date()
                });
              }
              
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              break;
            }

            chunkCount++;
            
            // Decode the chunk from AI API and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  
                  // Validate and forward the line
                  if (jsonStr && jsonStr !== '[DONE]') {
                    // Validate JSON before forwarding
                    const data = JSON.parse(jsonStr);
                    
                    // Ensure all messages have a type field
                    if (data.type && typeof data.message === 'string') {
                      // Forward the properly formatted line
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                      
                      // Only accumulate thought_stream for database storage
                      if (data.type === 'thought_stream') {
                        fullAIResponse += data.message;
                      }
                    } else if (data.message && !data.type) {
                      // Add default type for messages without type
                      const messageWithType = { ...data, type: 'thought_stream' };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(messageWithType)}\n\n`));
                      
                      // Accumulate message content
                      if (typeof data.message === 'string') {
                        fullAIResponse += data.message;
                      }
                    } else {
                      // Don't forward malformed data
                    }
                  } else if (jsonStr === '[DONE]') {
                    // Forward the done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  }
                } catch (e: any) {
                  // Don't forward malformed data
                }
              }
            }
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "thought_stream", 
            message: "Stream error occurred", 
            final: true 
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    
    // Return error response to client
    return new Response(
      `data: ${JSON.stringify({ 
        type: "error", 
        message: `AI service error: ${error.message}`, 
        final: true 
      })}\n\n`,
      {
        status: 200, // Keep as 200 for streaming
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
} 