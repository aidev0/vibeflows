import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { client } = await connectToDatabase();
    const db = client.db('vibeflows');
    
    console.log('=== DATABASE DEBUG ===');
    const users = await db.collection('users').find({}).project({
      _id: 1,
      user_id: 1,
      name: 1,
      email: 1,
      picture: 1,
      last_login: 1
    }).toArray();
    console.log('Number of users found:', users.length);
    console.log('Users:', users.map(u => ({ 
      user_id: u.user_id, 
      email: u.email,
      name: u.name,
      picture: u.picture,
      last_login: u.last_login 
    })));
    console.log('=== END DEBUG ===');
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 