import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/chat'
  }),
  logout: handleLogout({
    returnTo: 'https://vibeflows-c28a3602302a.herokuapp.com'
  })
});