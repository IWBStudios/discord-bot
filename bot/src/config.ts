import dotenv from 'dotenv';
dotenv.config();

const envVars = {
  CLIENT_ID: process.env.CLIENT_ID,
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DB_URI: process.env.DB_URI,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

const missingVars = Object.entries(envVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
}

interface Env {
  CLIENT_ID: string;
  DISCORD_TOKEN: string;
  DB_URI: string;
  NODE_ENV: string;
}

const Config: Env = {
  CLIENT_ID: envVars.CLIENT_ID!,
  DISCORD_TOKEN: envVars.DISCORD_TOKEN!,
  DB_URI: envVars.DB_URI!,
  NODE_ENV: envVars.NODE_ENV,
};

export default Config;
