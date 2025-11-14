import { Client, EmbedBuilder, REST, Routes, TextChannel } from 'discord.js';
import logger from 'node:console';
import Config from '../config';
import { organizeCommandsByCategory } from '../utils/organizeCommands';
import { commands } from './commandRegistry';

export const deployCommands = async (client: Client) => {
  const rest = new REST({ version: '10' }).setToken(Config.DISCORD_TOKEN);
  const commandsData = Array.from(commands.values()).map((c) => c.data.toJSON());

  try {
    logger.info('Clearing existing commands...');

    if (Config.NODE_ENV === 'development') {
      await rest.put(Routes.applicationGuildCommands(Config.CLIENT_ID, Config.GUILD_ID), { body: [] });
      logger.debug('Cleared guild commands');

      await rest.put(Routes.applicationCommands(Config.CLIENT_ID), { body: [] });
      logger.debug('Cleared global commands');

      logger.debug('Development mode: Registering guild commands...');
      await rest.put(Routes.applicationGuildCommands(Config.CLIENT_ID, Config.GUILD_ID), { body: commandsData });
      logger.debug(`Successfully registered ${commandsData.length} guild commands`);
    } else {
      await rest.put(Routes.applicationGuildCommands(Config.CLIENT_ID, Config.GUILD_ID), { body: [] });
      logger.info('Cleared guild commands');

      logger.info('Production mode: Registering global commands...');
      await rest.put(Routes.applicationCommands(Config.CLIENT_ID), { body: commandsData });
      logger.info(`Successfully registered ${commandsData.length} global commands`);
    }

    const logChannel = client.channels.cache.get(Config.ACTION_LOG_CHANNEL) as TextChannel;
    const commandCount = commandsData.length;

    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Started')
      .setDescription(`Successfully started and registered **${commandCount}** commands in ${Config.NODE_ENV} mode.`)
      .addFields(organizeCommandsByCategory(commands))
      .setColor('#16a34a')
      .setTimestamp()
      .setFooter({
        text: `${Config.NODE_ENV.charAt(0).toUpperCase() + Config.NODE_ENV.slice(1)} Mode • Bot Initialization`,
        iconURL: client.user?.displayAvatarURL({ extension: 'webp', size: 32 }) || undefined,
      });

    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    logger.info(`Registered ${commands.size} commands.`);
  } catch (error) {
    logger.error('Failed to register commands:', error);
  }
};
