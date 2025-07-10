import { getDb } from '@/app/lib/mongodb';

export interface UserProfile {
  _id?: any;
  user_id: string;
  email?: string;
  email_verified?: boolean;
  family_name?: string;
  given_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  sid?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

/**
 * Ensures user exists in database, creating if not found
 * @param auth0User - Auth0 user object
 * @returns Promise<UserProfile> - The user document from database
 */
export async function ensureUserExists(auth0User: any): Promise<UserProfile> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ user_id: auth0User.sub });
    
    if (existingUser) {
      // Update last_login and any changed profile data
      const updateData = {
        user_id: auth0User.sub,
        last_login: new Date().toISOString(),
        email: auth0User.email,
        email_verified: auth0User.email_verified,
        family_name: auth0User.family_name,
        given_name: auth0User.given_name,
        name: auth0User.name,
        nickname: auth0User.nickname,
        picture: auth0User.picture,
        sid: auth0User.sid,
        updated_at: new Date().toISOString()
      };
      
      await usersCollection.updateOne(
        { user_id: auth0User.sub },
        { $set: updateData }
      );
      
      return { ...existingUser, ...updateData };
    } else {
      // Create new user
      const newUser: UserProfile = {
        user_id: auth0User.sub,
        email: auth0User.email,
        email_verified: auth0User.email_verified,
        family_name: auth0User.family_name,
        given_name: auth0User.given_name,
        name: auth0User.name,
        nickname: auth0User.nickname,
        picture: auth0User.picture,
        sid: auth0User.sid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      
      const result = await usersCollection.insertOne(newUser);
      
      return { ...newUser, _id: result.insertedId };
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get user by user_id
 * @param userId - Auth0 user ID (sub)
 * @returns Promise<UserProfile | null>
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ user_id: userId });
    return user as UserProfile | null;
  } catch (error) {
    return null;
  }
}

/**
 * Update user profile
 * @param userId - Auth0 user ID (sub)
 * @param updateData - Data to update
 * @returns Promise<boolean> - Success status
 */
export async function updateUser(userId: string, updateData: Partial<UserProfile>): Promise<boolean> {
  try {
    const db = await getDb();
    const result = await db.collection('users').updateOne(
      { user_id: userId },
      { 
        $set: {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Update only the last_login timestamp for a user
 * @param userId - Auth0 user ID (sub)
 * @returns Promise<boolean> - Success status
 */
export async function updateLastLogin(userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const result = await db.collection('users').updateOne(
      { user_id: userId },
      { 
        $set: {
          last_login: now,
          updated_at: now
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    return false;
  }
}