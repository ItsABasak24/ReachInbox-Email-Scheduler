import type { Knex } from 'knex';
import path from 'path';
import { config } from '../config';

const isSslNeeded =
  process.env.NODE_ENV === 'production' ||
  config.DATABASE_URL.includes('render.com') ||
  config.DATABASE_URL.includes('ssl=true') ||
  config.DATABASE_URL.includes('neon.tech') ||
  config.DATABASE_URL.includes('supabase.co');

const connectionConfig =
  isSslNeeded && !config.DATABASE_URL.includes('localhost')
    ? {
        connectionString: config.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : config.DATABASE_URL;

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: connectionConfig,
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      loadExtensions: ['.js', '.ts'],
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    client: 'pg',
    connection: connectionConfig,
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      loadExtensions: ['.js', '.ts'],
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default knexConfig;
