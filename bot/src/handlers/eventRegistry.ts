import { Client } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { BotEvent } from '../types/BotEvent.js';
import logger from '../utils/logger.js';

export const registerEvents = async (client: Client) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const eventsDir = path.join(__dirname, '../events');

  const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

  for (const file of files) {
    const filePath = path.join(eventsDir, file);
    const rawEvent = await import(pathToFileURL(filePath).href);
    const event: BotEvent | undefined = rawEvent.default?.default ?? rawEvent.default;

    if (!event) {
      logger.error(`[SKIP] ${file}: missing default export`);
      continue;
    }

    const { name, once, run } = event;

    if (typeof run !== 'function') {
      logger.error(`[SKIP] ${file}: missing valid run() handler`);
      continue;
    }

    if (once) {
      client.once(name, (...args) => run(client, ...args));
    } else {
      client.on(name, (...args) => run(client, ...args));
    }

    logger.info(`[EVENT] Registered ${file} → ${name}`);
  }
};
