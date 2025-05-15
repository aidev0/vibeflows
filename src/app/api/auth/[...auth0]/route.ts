import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return 'https://vibeflows.app';
};

export const GET = handleAuth({
  login: handleLogin({
    returnTo: getBaseUrl(),
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
      audience: 'https://vibeflows.us.auth0.com/api/v2/'
    }
  }),
  logout: handleLogout({
    returnTo: getBaseUrl()
  })
});