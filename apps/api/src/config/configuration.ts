import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  name: process.env.APP_NAME || 'questforge',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '25', 10),
  ssl: process.env.DATABASE_SSL !== 'false',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'questforge-jwt-secret-change-in-production',
  audience: process.env.JWT_AUDIENCE || 'questforge-api',
  issuer: process.env.JWT_ISSUER || 'questforge',
  accessTokenTtl: parseInt(process.env.JWT_ACCESS_TTL || '604800', 10),
  refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TTL || '2592000', 10),
}));

export const corsConfig = registerAs('cors', () => ({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
