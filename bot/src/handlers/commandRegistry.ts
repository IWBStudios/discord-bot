import fs from 'fs';
import logger from 'node:console';
import path from 'path';
import type { Command } from 'types/BotCommand';

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
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

    for (const commandFile of files) {
      if (commandFile === 'index.ts' || commandFile === 'index.js') continue;

      const commandPath = path.join(categoryPath, commandFile);
      const commandModule = await import(commandPath);
      const command: Command = commandModule.default;

      if (!command.category) {
        command.category = categoryName;
      }

      commands.set(command.data.name, command);
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
