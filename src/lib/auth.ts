import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

const secret = import.meta.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
if (!secret || secret === 'your-secret-key-change-in-production') {
  throw new Error('BETTER_AUTH_SECRET environment variable is missing or uses the default placeholder value.');
}

export const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'client',
        input: true,
      },
    },
  },
});
