import { google } from 'googleapis';
import { getValidAccessToken } from './oauth';

// Initialize Gmail API client
const gmail = google.gmail('v1');

// Get recent messages from Gmail
export async function getRecentMessages(userId: string, maxResults: number = 10) {
  try {
    const tokens = await getValidAccessToken(userId, 'gmail');
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    const response = await gmail.users.messages.list({
      auth,
      userId: 'me',
      maxResults,
      q: 'in:inbox'
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (message) => {
        const details = await gmail.users.messages.get({
          auth,
          userId: 'me',
          id: message.id!
        });
        return details.data;
      })
    );

    return messageDetails;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

// Send email using Gmail API
export async function sendEmail(userId: string, to: string, subject: string, body: string) {
  try {
    const tokens = await getValidAccessToken(userId, 'gmail');
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    // Create email message
    const message = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      `To: ${to}\n`,
      `Subject: ${subject}\n\n`,
      body
    ].join('');

    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      auth,
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
} 