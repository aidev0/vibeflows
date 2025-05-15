import { google } from 'googleapis';
import { getValidAccessToken } from './oauth';

// Initialize Google Sheets API client
const sheets = google.sheets('v4');

// Read data from a Google Sheet
export async function readSheet(userId: string, spreadsheetId: string, range: string) {
  try {
    const tokens = await getValidAccessToken(userId, 'sheets');
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error reading Google Sheet:', error);
    throw error;
  }
}

// Append a row to a Google Sheet
export async function appendRow(userId: string, spreadsheetId: string, range: string, values: any[]) {
  try {
    const tokens = await getValidAccessToken(userId, 'sheets');
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    const response = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    throw error;
  }
}

// Update a range of cells in a Google Sheet
export async function updateRange(
  userId: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  try {
    const tokens = await getValidAccessToken(userId, 'sheets');
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    const response = await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    throw error;
  }
} 