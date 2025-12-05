import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import logger from 'node:console';
import Config from '../config';
import { commands } from '../handlers/commandRegistry';

const api = new REST({ version: '10' }).setToken(Config.DISCORD_TOKEN);

export async function redeployCommands(data: RESTPostAPIChatInputApplicationCommandsJSONBody[]) {
  logger.info('Clearing existing commands...');

  if (Config.NODE_ENV === 'development') {
    await api.put(Routes.applicationGuildCommands(Config.CLIENT_ID, Config.GUILD_ID), { body: [] });
    logger.debug('Cleared guild commands');

    await api.put(Routes.applicationCommands(Config.CLIENT_ID), { body: [] });
    logger.debug('Cleared global commands');

    logger.debug('Development mode: Registering guild commands...');
    await api.put(Routes.applicationGuildCommands(Config.CLIENT_ID, Config.GUILD_ID), { body: data });
    logger.debug(`Successfully registered ${data.length} guild commands`);
  } else {
    logger.info('Clearing existing commands...');
    await api.put(Routes.applicationGuildCommands(Config.CLIENT_ID, Config.GUILD_ID), { body: [] });
    logger.info('Cleared guild commands');

    logger.info('Production mode: Registering global commands...');
    await api.put(Routes.applicationCommands(Config.CLIENT_ID), { body: data });
    logger.info(`Successfully registered ${data.length} global commands`);
  }

  logger.info(`Registered ${commands.size} commands.`);
}
