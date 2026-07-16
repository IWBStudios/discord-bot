import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import Config from '../config';
import logger from '../utils/logger';
import { organizeCommandsByCategory } from '../utils/organizeCommands';
import { redeployCommands } from '../utils/redeployCommands';
import { commands } from './commandRegistry';

export async function deployCommands(client: Client) {
  const commandsData = Array.from(commands.values()).map((c) => c.data.toJSON());

  try {
    await redeployCommands(commandsData);
    await sendEmbed(client, commandsData.length);
  } catch (error) {
    logger.error(error, 'Failed to register commands:');
  }
}

async function findAndDeletePreviousEmbed(channel: TextChannel) {
  const messages = await channel.messages.fetch({ limit: 20 });

  const target = messages.find((m) => {
    if (!m.author.bot) return false;
    if (!m.embeds.length) return false;

    const emb = m.embeds[0];
    return emb.title === '🤖 Bot Started';
  });

  if (target) {
    await target.delete().catch(() => null);
  }
}

async function sendEmbed(client: Client, commandsLenght: number) {
  const logChannel = client.channels.cache.get(Config.ACTION_LOG_CHANNEL) as TextChannel;
  if (!logChannel) {
    logger.debug('Log channel not found');
    return;
  }

  await findAndDeletePreviousEmbed(logChannel);

  const embed = new EmbedBuilder()
    .setTitle('🤖 Bot Started')
    .setDescription(`Successfully started and registered **${commandsLenght}** commands in ${Config.NODE_ENV} mode.`)
    .addFields(organizeCommandsByCategory(commands))
    .setColor('#16a34a')
    .setTimestamp()
    .setFooter({
      text: `${Config.NODE_ENV.charAt(0).toUpperCase() + Config.NODE_ENV.slice(1)} Mode • Bot Initialization`,
      iconURL: client.user?.displayAvatarURL({ extension: 'webp', size: 32 }) || undefined,
    });

  await logChannel.send({ embeds: [embed] });
}
