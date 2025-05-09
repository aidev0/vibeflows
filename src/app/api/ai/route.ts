// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai';
import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
// import { cookies } from 'next/headers'; // Not used in this version

const MODEL_NAME = "gemini-1.5-flash-latest";

// Define the expected structure for the AI's response
interface AiResponse {
  type: "workflow_plan" | "clarification_question" | "error" | "simple_text";
  text: string;
  nodes?: Array<{
    id: string;
    type: string;
    data: { 
      label: string;
      description?: string;
      tools?: string[];
      notes?: string;
      [key: string]: any;
    };
    position: { x: number; y: number };
  }>;
  options?: string[];
  requiresUserInput: boolean;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const client = new MongoClient(uri);

export async function POST(req: NextRequest) {
  try {
    console.log('Starting AI request processing...');
    
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const auth0UserId = session.user.sub;

    const { prompt, chatId, userId, messages, fullPrompt } = await req.json();
    console.log('Request data:', { prompt, chatId, userId: auth0UserId, messagesLength: messages?.length });

    if (!prompt || !chatId || !auth0UserId) {
      console.log('Missing required fields (prompt, chatId, or authenticated userId)');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey) {
      console.error('GOOGLE_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'API key not configured',
        details: 'Please check server configuration'
      }, { status: 500 });
    }

    try {
      console.log('Initializing Google AI...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      console.log('Model initialized successfully');

      const generationConfig = {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1024,
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      // Format conversation history for Gemini
      console.log('Formatting conversation history...');
      const conversationHistory: Array<{ role: "user" | "model"; parts: Part[] }> = [];

      // Find the system message if it exists
      const systemMessage = messages.find((msg: any) => msg.systemMessage);
      if (systemMessage) {
        conversationHistory.push({
          role: "model",
          parts: [{ text: systemMessage.systemMessage }]
        });
      }

      // Add the rest of the conversation history
      messages.forEach((msg: any) => {
        conversationHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      // Add the current message
      conversationHistory.push({
        role: "user",
        parts: [{ text: fullPrompt }]
      });

      console.log('Sending request to Gemini with history:', conversationHistory.length, 'items');
      
      const result = await model.generateContent({
        contents: conversationHistory,
        generationConfig,
        safetySettings,
      });

      console.log('Received response from Gemini');
      const response = result.response;
      const responseText = response.text();
      console.log('Raw response text from Gemini:', responseText);

      // Parse the AI response
      let parsedResponse: AiResponse;
      try {
        // Handle markdown-formatted JSON
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          const rawResponse = JSON.parse(jsonMatch[1].trim());
          
          // Transform workflow plan if needed
          if (rawResponse.type === 'workflow_plan') {
            parsedResponse = {
              type: 'workflow_plan',
              text: rawResponse.description || rawResponse.text || rawResponse.title || 'Workflow Plan',
              nodes: rawResponse.nodes?.map((node: any, index: number) => ({
                id: String(node.id || index + 1),
                type: 'action',
                data: {
                  label: node.name || node.label || `Step ${index + 1}`,
                  description: node.description,
                  tools: node.tools,
                  notes: node.notes
                },
                position: {
                  x: index * 200,
                  y: 0
                }
              })),
              requiresUserInput: false
            };
          } else {
            parsedResponse = rawResponse;
          }
        } else {
          // Try parsing as regular JSON if no markdown formatting
          try {
            const rawResponse = JSON.parse(responseText);
            
            // Transform workflow plan if needed
            if (rawResponse.type === 'workflow_plan') {
              parsedResponse = {
                type: 'workflow_plan',
                text: rawResponse.description || rawResponse.text || rawResponse.title || 'Workflow Plan',
                nodes: rawResponse.nodes?.map((node: any, index: number) => ({
                  id: String(node.id || index + 1),
                  type: 'action',
                  data: {
                    label: node.name || node.label || `Step ${index + 1}`,
                    description: node.description,
                    tools: node.tools,
                    notes: node.notes
                  },
                  position: {
                    x: index * 200,
                    y: 0
                  }
                })),
                requiresUserInput: false
              };
            } else {
              parsedResponse = rawResponse;
            }
          } catch (jsonError) {
            // If not JSON, wrap in a simple_text response
            parsedResponse = {
              type: 'simple_text',
              text: responseText,
              requiresUserInput: false
            };
          }
        }
        console.log('Parsed response:', parsedResponse);
      } catch (error) {
        const parseError = error as Error;
        console.error('Error parsing AI response:', parseError);
        console.error('Raw response that caused parsing error:', responseText);
        
        // If parsing fails, wrap the raw response in a simple_text response
        parsedResponse = {
          type: 'simple_text',
          text: responseText,
          requiresUserInput: false
        };
      }

      // Validate response structure
      if (!parsedResponse.text || typeof parsedResponse.text !== 'string') {
        console.error('Invalid response structure:', parsedResponse);
        return NextResponse.json(
          { error: 'Invalid response structure from AI' },
          { status: 500 }
        );
      }

      return NextResponse.json(parsedResponse);

    } catch (aiError: any) {
      console.error('Error in Google AI communication:', aiError);
      const errorResponse: AiResponse = {
        type: "error",
        text: "Sorry, I'm having trouble connecting to my brain right now. Please try again in a bit.",
        requiresUserInput: false,
      };
      return NextResponse.json(errorResponse, { status: 502 }); // Bad Gateway - issue with upstream AI service
    }
  } catch (error: any) {
    console.error('Generic error in API route:', error);
    const errorResponse: AiResponse = {
      type: "error",
      text: "An unexpected error occurred on our end. Please try again.",
      requiresUserInput: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  } finally {
    await client.close();
  }
}
