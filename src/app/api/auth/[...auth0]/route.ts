import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://vibeflows.app';
};

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/chat'
  }),
  logout: handleLogout({
    returnTo: getBaseUrl()
  })
});