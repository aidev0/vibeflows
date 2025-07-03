import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { device_info, flow_id, chat_id, user_profile } = await request.json();
    
    // Get user's timezone from request headers or use UTC as fallback
    const timezone = request.headers.get('timezone') || 'UTC';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: timezone });

    const sessionData = {
      user_id: session.user.sub,
      device_info: {
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        ...device_info
      },
      flow_id: flow_id || null,
      chat_id: chat_id || null,
      user_profile: user_profile || {
        name: session.user.name,
        email: session.user.email,
        nickname: session.user.nickname,
        picture: session.user.picture
      },
      timestamp,
      timezone,
      created_at: new Date(),
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active'
    };

    // Here you would typically save to your database
    // For now, let's log it and return success
    console.log('User session created:', sessionData);

    // TODO: Save to MongoDB user_sessions collection
    // Example MongoDB save:
    // const db = await connectToDatabase();
    // await db.collection('user_sessions').insertOne(sessionData);

    return NextResponse.json({ 
      success: true, 
      session_id: sessionData.session_id,
      message: 'Session created successfully' 
    });

  } catch (error) {
    console.error('Error creating user session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch user sessions from database
    // Example:
    // const db = await connectToDatabase();
    // const userSessions = await db.collection('user_sessions')
    //   .find({ user_id: session.user.sub })
    //   .sort({ created_at: -1 })
    //   .toArray();

    const userSessions: any[] = []; // Placeholder

    return NextResponse.json({ sessions: userSessions });

  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, flow_id, chat_id, status } = await request.json();
    
    const updateData: any = {
      updated_at: new Date()
    };

    if (flow_id !== undefined) updateData.flow_id = flow_id;
    if (chat_id !== undefined) updateData.chat_id = chat_id;
    if (status !== undefined) updateData.status = status;

    // TODO: Update session in database
    // Example:
    // const db = await connectToDatabase();
    // await db.collection('user_sessions').updateOne(
    //   { session_id, user_id: session.user.sub },
    //   { $set: updateData }
    // );

    console.log('Session updated:', { session_id, updateData });

    return NextResponse.json({ 
      success: true,
      message: 'Session updated successfully'
    });

  } catch (error) {
    console.error('Error updating user session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}