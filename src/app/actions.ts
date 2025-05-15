'use server';

import { getSession } from '@auth0/nextjs-auth0';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const client = new MongoClient(uri);

export async function syncUser() {
  try {
    const session = await getSession();
    if (!session?.user) return;

    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ user_id: session.user.sub });
    
    if (!existingUser) {
      await usersCollection.insertOne({
        created_at: new Date().toISOString(),
        email: session.user.email,
        email_verified: session.user.email_verified || false,
        family_name: session.user.family_name,
        given_name: session.user.given_name,
        identities: session.user.identities || [],
        name: session.user.name,
        nickname: session.user.nickname,
        picture: session.user.picture,
        updated_at: new Date().toISOString(),
        user_id: session.user.sub,
        last_ip: session.user.last_ip || '',
        last_login: new Date().toISOString(),
        logins_count: 1,
        blocked_for: [],
        guardian_authenticators: [],
        passkeys: []
      });
    } else {
      await usersCollection.updateOne(
        { user_id: session.user.sub },
        {
          $set: {
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          $inc: { logins_count: 1 }
        }
      );
    }
  } catch (error) {
    console.error('Error syncing user:', error);
  } finally {
    await client.close();
  }
} 