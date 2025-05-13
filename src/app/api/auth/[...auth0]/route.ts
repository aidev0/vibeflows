import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: process.env.AUTH0_BASE_URL
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL
  })
});