const fs = require('fs');
const { execSync } = require('child_process');

// Read .env.local file
const envFile = fs.readFileSync('.env.local', 'utf8');

// Parse environment variables
const envVars = envFile
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

// Set Heroku config vars
Object.entries(envVars).forEach(([key, value]) => {
  try {
    console.log(`Setting ${key}...`);
    execSync(`heroku config:set ${key}="${value}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error setting ${key}:`, error.message);
  }
});

console.log('Environment variables set successfully!'); 