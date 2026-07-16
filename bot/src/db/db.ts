import { Pool } from 'pg';
import Config from '../config.js';
import logger from '../utils/logger.js';

export const db = new Pool({
  host: Config.DB_HOST,
  port: Config.DB_PORT,
  user: Config.DB_USER,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  max: 10,
});

db.on('error', (err) => {
  logger.error(err, 'Unexpected PostgreSQL pool error');
});
