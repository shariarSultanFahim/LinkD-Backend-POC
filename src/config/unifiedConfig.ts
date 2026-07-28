import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  MONGO_URI: z.string().default('mongodb://localhost:27017/room_sync'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

export const config = {
  port: parsedEnv.data.PORT,
  mongoUri: parsedEnv.data.MONGO_URI,
  auth: {
    jwtSecret: parsedEnv.data.JWT_SECRET,
    jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  },
  env: parsedEnv.data.NODE_ENV,
};
