import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Command } from '../types/BotCommand.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const commands = new Map<string, Command>();

async function loadCommands(directory: string, isRoot = true): Promise<number> {
  const commandFiles = fs.readdirSync(directory);
  let commandCount = 0;

  for (const file of commandFiles) {
    const fullPath = path.join(directory, file);

    if (!fs.statSync(fullPath).isDirectory()) {
      logger.error(`[COMMAND] ${file} needs to be apart of a subfolder (category)`);
      continue;
    }

    const categoryName = file;
    const categoryPath = fullPath;
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

    for (const commandFile of files) {
      if (commandFile === 'index.ts' || commandFile === 'index.js') continue;

      const commandPath = path.join(categoryPath, commandFile);
      const commandModule = await import(pathToFileURL(commandPath).href);

      console.log(commandFile, commandModule);
      const command: Command = commandModule.default?.default ?? commandModule.default;

      if (!command.data || typeof command.run !== 'function') {
        logger.error(`[SKIP] ${commandFile}: invalid command export`);
        continue;
      }

      commands.set(command.data.name, {
        ...command,
        category: command.category ?? categoryName,
      });

      logger.debug(`Loading command: ${command.data.name} (${command.category})`);
      commandCount++;
    }
  }

  if (isRoot) {
    logger.info(`${commandCount} command(s) loaded`);
    logger.debug(
      `Loaded commands: ${Array.from(commands.entries())
        .map(([name, cmd]) => `${name} (${cmd.category})`)
        .join(', ')}`
    );
  }
  return commandCount;
}

loadCommands(path.join(__dirname, '../commands'));
