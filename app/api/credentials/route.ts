import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getDb } from '@/app/lib/mongodb';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const credentials = await db.collection('credentials')
      .find({ user_id: session.user.sub })
      .sort({ created_at: -1 })
      .toArray();
    
    // Map the database fields to the expected format
    const userKeys = credentials.map((key: any) => ({
      _id: key._id,
      key_name: key.name,
      key_value: key.value,
      description: key.description,
      key_type: key.type,
      is_active: true,
      created_at: key.created_at,
      updated_at: key.updated_at || key.created_at
    }));

    return NextResponse.json({ keys: userKeys });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_name, key_value, description, key_type } = await request.json();

    if (!key_name || !key_value) {
      return NextResponse.json({ error: 'Key name and value are required' }, { status: 400 });
    }

    const keyData = {
      user_id: session.user.sub,
      name: key_name.trim(),
      value: key_value.trim(),
      description: description?.trim() || '',
      type: key_type || 'api_key',
      created_at: new Date()
    };

    const db = await getDb();
    const result = await db.collection('credentials').insertOne(keyData);
    

    return NextResponse.json({ 
      success: true, 
      message: 'Key saved successfully',
      key_id: result.insertedId
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_id, key_name, key_value, description, key_type } = await request.json();

    if (!key_id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (key_name !== undefined) updateData.name = key_name.trim();
    if (key_value !== undefined) updateData.value = key_value.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (key_type !== undefined) updateData.type = key_type;

    const db = await getDb();
    const { ObjectId } = require('mongodb');
    
    await db.collection('credentials').updateOne(
      { _id: new ObjectId(key_id), user_id: session.user.sub },
      { $set: updateData }
    );


    return NextResponse.json({ 
      success: true,
      message: 'Key updated successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key_id = searchParams.get('key_id');

    if (!key_id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const { ObjectId } = require('mongodb');
    
    await db.collection('credentials').deleteOne({
      _id: new ObjectId(key_id),
      user_id: session.user.sub
    });


    return NextResponse.json({ 
      success: true,
      message: 'Key deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}