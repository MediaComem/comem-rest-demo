import { fileURLToPath, URL } from 'url';

export const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export const env = process.env.NODE_ENV || 'development';

let defaultDatabaseUrl = 'mongodb://localhost/comem-rest-demo';
if (env === 'test') {
  defaultDatabaseUrl = `${defaultDatabaseUrl}-test`;
}

export const authToken = process.env.AUTH_TOKEN;

export const debug = !!process.env.DEBUG;

export const port = process.env.PORT || '3000';

export const databaseUrl =
  process.env.DATABASE_URL || process.env.MONGODB_URI || defaultDatabaseUrl;

export const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
