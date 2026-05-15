import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import winston from 'winston';

const LOG_DIR = path.join(os.homedir(), '.gausszhou', 'code-assist', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'agent.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
      return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }),
  ),
  transports: [
    new winston.transports.File({
      filename: LOG_FILE,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
      tailable: true,
    }),
  ],
});
