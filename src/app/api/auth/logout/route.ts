import { handleLogout } from '@auth0/nextjs-auth0';

const getBaseUrl = () => {
  // For production (Heroku)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Default to the custom domain
  return 'https://vibeflows.app';
};

export const GET = handleLogout({
  returnTo: getBaseUrl()
}); 