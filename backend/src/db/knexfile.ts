import type { Knex } from 'knex';
import path from 'path';
import { config } from '../config';

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: config.DATABASE_URL,
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    client: 'pg',
    connection: config.DATABASE_URL,
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default knexConfig;
