import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

export async function POST(request: Request) {
  console.log('=== BASIC TEST: POST request received ===');
  console.log('Time:', new Date().toISOString());
  console.log('🚀 /api/ai/stream endpoint hit!');
  
  try {
    console.log('🔍 About to parse request body...');
    const { user_query, chat_id, user_id } = await request.json();
    console.log('✅ Request body parsed successfully');
    
    console.log('📝 Request payload:', { 
      user_query, 
      chat_id, 
      user_id,
      timestamp: new Date().toISOString()
    });
    
    if (!user_query) {
      console.error('❌ Missing user_query in request');
      return NextResponse.json({ error: 'user_query is required' }, { status: 400 });
    }

    // Save user message to database if chat_id is provided
    if (chat_id) {
      console.log('💾 Saving user message to database...');
      const db = await getDb();
      await db.collection('messages').insertOne({
        chat_id: chat_id,
        user_id: user_id,
        text: user_query,
        role: 'user',
        type: 'text',
        created_at: new Date()
      });
      console.log('✅ User message saved to database');
    } else {
      console.log('⚠️ No chat_id provided, skipping database save');
    }

    // Forward request to local AI API on port 8000
    console.log('🔄 Attempting to connect to AI service on localhost:8000...');
    console.log('📤 Sending payload to AI service:', { user_query, chat_id, user_id });
    
    const aiResponse = await fetch('http://localhost:8000/api/ai/stream', {
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

    console.log('📊 AI service response status:', aiResponse.status);
    console.log('📋 AI service response headers:', Object.fromEntries(aiResponse.headers.entries()));
    
    if (!aiResponse.ok) {
      console.error(`❌ AI API responded with status: ${aiResponse.status}`);
      const errorText = await aiResponse.text();
      console.error('💥 AI API error response:', errorText);
      throw new Error(`AI API responded with status: ${aiResponse.status} - ${errorText}`);
    }

    console.log('✅ AI service connection successful, starting stream...');

    // Create a transform stream to handle the AI response and save to database
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullAIResponse = '';
    let chunkCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        console.log('🌊 Stream started');
        const reader = aiResponse.body?.getReader();
        
        if (!reader) {
          console.error('❌ No response stream available from AI service');
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
              console.log('🏁 Stream finished');
              console.log('📝 Full AI response length:', fullAIResponse.length);
              
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
                      console.warn(`⚠️ Could not parse final buffer line: ${line}`, e.message);
                    }
                  }
                }
              }
              
              // Save complete AI response to database if chat_id is provided
              if (chat_id && fullAIResponse) {
                console.log('💾 Saving AI response to database...');
                const db = await getDb();
                await db.collection('messages').insertOne({
                  chat_id: chat_id,
                  user_id: user_id,
                  text: fullAIResponse,
                  role: 'assistant',
                  type: 'text',
                  created_at: new Date()
                });
                console.log('✅ AI response saved to database');
              }
              
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              break;
            }

            chunkCount++;
            console.log(`📦 Processing chunk ${chunkCount}`);
            
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
                    
                    // Forward all valid message types (not just thought_stream)
                    if (data.type && typeof data.message === 'string') {
                      // Forward the properly formatted line
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                      
                      // Only accumulate thought_stream for database storage
                      if (data.type === 'thought_stream') {
                        fullAIResponse += data.message;
                      }
                    }
                  } else if (jsonStr === '[DONE]') {
                    // Forward the done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  }
                } catch (e: any) {
                  console.warn(`⚠️ Could not parse chunk line: ${line}`, e.message);
                  // Don't forward malformed data
                }
              }
            }
          }
        } catch (error) {
          console.error('💥 Error reading AI stream:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "thought_stream", 
            message: "Stream error occurred", 
            final: true 
          })}\n\n`));
          controller.close();
        }
      }
    });

    console.log('📡 Returning stream response to client');
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
    console.error('💥 Error in /api/ai/stream:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
} 