import { Client } from 'discord.js';
import fs from 'fs';
import logger from 'node:console';
import path from 'path';
import type { BotEvent } from 'types/BotEvent';

export const registerEvents = async (client: Client) => {
  const eventsDir = path.join(__dirname, '../events');
  const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(eventsDir, file);
    const rawEvent = await import(filePath);
    const event: BotEvent = rawEvent.default;

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
