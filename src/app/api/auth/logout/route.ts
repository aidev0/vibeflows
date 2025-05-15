import { handleLogout } from '@auth0/nextjs-auth0';

const getBaseUrl = () => {
  // For production
  if (process.env.AUTH0_BASE_URL) {
    return process.env.AUTH0_BASE_URL;
  }

  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Default to vibeflows.app
  return 'https://vibeflows.app';
};

export const GET = handleLogout({
  returnTo: getBaseUrl()
}); 