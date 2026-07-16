import { AuditLogEvent, EmbedBuilder, Guild, GuildAuditLogsEntry, PartialUser, TextChannel, User } from 'discord.js';
import Config from '../config.js';
import { db } from '../db/db.js';
import type { BotEvent } from '../types/BotEvent.js';
import logger from '../utils/logger.js';

const event: BotEvent<'guildMemberRemove'> = {
  name: 'guildMemberRemove',
  run: async (_client, member) => {
    try {
      const guild: Guild = member.guild;

      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberKick,
        limit: 1,
      });
      const entry: GuildAuditLogsEntry | undefined = auditLogs.entries.first();
      if (!entry) return;

      const { executor, target, reason, createdAt } = entry;

      const executorId = getUserId(executor);
      const targetId = getUserId(target);

      if (!executorId || !targetId || targetId !== member.id) {
        logger.info('Executor or target missing, or not matching member.');
        return;
      }

      if (executorId === Config.CLIENT_ID) return;

      const executorUser = await guild.client.users.fetch(executorId);
      const targetUser = await guild.client.users.fetch(targetId);

      const removeEmbed = new EmbedBuilder()
        .setColor('#ea580c')
        .setTitle('Member Kicked')
        .setDescription(`<@${targetUser.id}> was **kicked** by <@${executorUser.id}>.`)
        .addFields({ name: 'Reason', value: reason || 'No reason provided.' })
        .setAuthor({ name: targetUser.username || 'Unknown', iconURL: targetUser.displayAvatarURL() })
        .setTimestamp(createdAt)
        .setFooter({ text: `Member ID: ${targetUser.id}` })
        .setThumbnail(targetUser.displayAvatarURL());

      const channel = guild.channels.cache.get(Config.ACTION_LOG_CHANNEL) as TextChannel;
      if (channel) await channel.send({ embeds: [removeEmbed] });

      await db.query(
        'INSERT INTO public.moderation_logs (target_id, target_tag, moderator_id, moderator_tag, action, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [targetUser.id, targetUser.tag, executorUser.id, executorUser.tag, 'kick', reason]
      );
    } catch (error) {
      logger.error(error, 'Failed to process member kick audit log.');
    }
  },
};

function getUserId(user: unknown): string | null {
  if (!user) return null;
  if (typeof user === 'string') return user;

  // if object and property id exists
  if (typeof user === 'object' && 'id' in user && typeof (user as any).id === 'string') {
    // additionaly make sure it is User or PartialUser
    if ((user as User | PartialUser).username !== undefined || (user as User | PartialUser).tag !== undefined) {
      return (user as User | PartialUser).id;
    }
  }

  // all other cases (Guild, Webhook, Invite...) are ignored
  return null;
}

export default event;
