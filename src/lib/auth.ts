import { getSession } from '@auth0/nextjs-auth0';
import { cookies, headers } from 'next/headers';

export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const headerStore = headers();
    const session = await getSession(cookieStore, headerStore);
    
    if (!session?.user?.sub) {
      console.log('No user session found');
      return null;
    }
    
    // Auth0 user ID is in the format: 'auth0|123456789'
    // We'll use the entire sub as the user ID
    return session.user.sub;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

export async function requireAuth() {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
} 