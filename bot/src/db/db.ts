import mysql from 'mysql2/promise';
import Config from '../config';

export const db = mysql.createPool({
  uri: Config.DB_URI,
  waitForConnections: true,
  connectionLimit: 10,
});
