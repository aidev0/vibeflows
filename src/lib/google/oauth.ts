import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const client = new MongoClient(uri);
const dbName = process.env.MONGODB_DATABASE || 'vibeflows';

// Get base URL for redirect URI
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return 'https://vibeflows.app';
};

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${getBaseUrl()}/api/integrations/google/callback`
);

// Scopes for different integrations
export const SCOPES = {
  GMAIL: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  SHEETS: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  CALENDAR: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};

// Token types
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  expires_at?: number;
  token_type: string;
  scope: string;
}

// Generate OAuth URL with proper parameters
export function getAuthUrl(scopes: string[], state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent', // Force to get refresh token
    include_granted_scopes: true
  });
}

// Exchange code for tokens
export async function getTokens(code: string): Promise<GoogleTokens> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || ''
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to exchange code for tokens');
  }
}

// Get user's email from Google
export async function getUserEmail(tokens: GoogleTokens): Promise<string> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);
    
    const people = google.people({ version: 'v1', auth });
    const response = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names'
    });
    
    // Get primary email
    const primaryEmail = response.data.emailAddresses?.find(email => email.metadata?.primary)?.value;
    if (!primaryEmail) {
      throw new Error('No primary email found');
    }
    
    return primaryEmail;
  } catch (error) {
    console.error('Error getting user email:', error);
    throw new Error('Failed to get user email');
  }
}

// Store integration credentials in database
export async function storeTokens(userId: string, integration: 'gmail' | 'sheets', tokens: GoogleTokens, email: string) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('integrations');

    // First, delete any existing integration for this user and service
    await collection.deleteOne({ 
      user_id: userId,
      provider: 'google',
      service: integration
    });

    // Then insert the new integration
    await collection.insertOne({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date,
      updated_at: new Date(),
      provider: 'google',
      service: integration,
      user_id: userId,
      email: email
    });
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw new Error('Failed to store tokens');
  } finally {
    await client.close();
  }
}

// Get integration credentials from database
export async function getStoredTokens(userId: string, integration: 'gmail' | 'sheets'): Promise<GoogleTokens | null> {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('integrations');

    const tokens = await collection.findOne({ 
      user_id: userId,
      provider: 'google',
      service: integration 
    });
    
    if (!tokens) return null;

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expires_at,
      token_type: 'Bearer',
      scope: ''
    };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    throw new Error('Failed to get stored tokens');
  } finally {
    await client.close();
  }
}

// Refresh access token if expired
export async function refreshAccessToken(userId: string, integration: 'gmail' | 'sheets'): Promise<GoogleTokens> {
  try {
    const tokens = await getStoredTokens(userId, integration);
    if (!tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Get user's email with new tokens
    const email = await getUserEmail(credentials as GoogleTokens);
    
    // Update stored tokens
    await storeTokens(userId, integration, credentials as GoogleTokens, email);
    
    return credentials as GoogleTokens;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

// Get valid access token (refreshes if needed)
export async function getValidAccessToken(userId: string, integration: 'gmail' | 'sheets'): Promise<GoogleTokens> {
  try {
    const tokens = await getStoredTokens(userId, integration);
    if (!tokens) {
      throw new Error('No tokens found');
    }

    // Check if token is expired (with 5 minute buffer)
    if (tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
      return refreshAccessToken(userId, integration);
    }

    return tokens;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw new Error('Failed to get valid access token');
  }
} 