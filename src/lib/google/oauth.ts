import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

const client = new MongoClient(uri);

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

// Generate OAuth URL
export function getAuthUrl(scopes: string[], state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent' // Force to get refresh token
  });
}

// Exchange code for tokens
export async function getTokens(code: string): Promise<GoogleTokens> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as GoogleTokens;
}

// Get user's email from Google
export async function getUserEmail(tokens: GoogleTokens): Promise<string> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials(tokens);
  
  const people = google.people({ version: 'v1', auth });
  const response = await people.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses'
  });
  
  const email = response.data.emailAddresses?.[0]?.value;
  if (!email) {
    throw new Error('No email found');
  }
  
  return email;
}

// Store integration credentials in database
export async function storeTokens(userId: string, integration: 'gmail' | 'sheets', tokens: GoogleTokens) {
  await client.connect();
  const db = client.db('vibeflows');
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
    user_id: userId
  });

  await client.close();
}

// Get integration credentials from database
export async function getStoredTokens(userId: string, integration: 'gmail' | 'sheets'): Promise<GoogleTokens | null> {
  await client.connect();
  const db = client.db('vibeflows');
  const collection = db.collection('integrations');

  const tokens = await collection.findOne({ 
    user_id: userId,
    provider: 'google',
    service: integration 
  });
  
  await client.close();
  return tokens as GoogleTokens | null;
}

// Refresh access token if expired
export async function refreshAccessToken(userId: string, integration: 'gmail' | 'sheets'): Promise<GoogleTokens> {
  const tokens = await getStoredTokens(userId, integration);
  if (!tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // Update stored tokens
  await storeTokens(userId, integration, credentials as GoogleTokens);
  
  return credentials as GoogleTokens;
}

// Get valid access token (refreshes if needed)
export async function getValidAccessToken(userId: string, integration: 'gmail' | 'sheets'): Promise<GoogleTokens> {
  const tokens = await getStoredTokens(userId, integration);
  if (!tokens) {
    throw new Error('No tokens found');
  }

  // Check if token is expired (with 5 minute buffer)
  if (tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
    return refreshAccessToken(userId, integration);
  }

  return tokens;
} 