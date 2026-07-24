import {
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import Config from '../../config.js';
import { db } from '../../db/db.js';
import type { Command } from '../../types/BotCommand.js';
import logger from '../../utils/logger.js';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption((opt) => opt.setName('user').setDescription('User to timeout').setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Duration of the timeout in minutes (defaults to 10 minutes)')
        .setRequired(false)
    )
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the timeout').setRequired(false)),

  run: async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const caller = interaction.member as GuildMember;

    const targetOption = interaction.options.getMember('user');
    const target = targetOption as GuildMember | null;

    const durationOption = interaction.options.getInteger('duration');
    const duration = durationOption || 10;

    const reasonOption = interaction.options.getString('reason');
    const reason = reasonOption || 'No reason provided.';

    try {
      if (!caller) {
        await interaction.editReply({
          content: 'Cannot determine your member object.',
        });
        return;
      }

      if (!target) {
        await interaction.editReply({
          content: 'User not found or not in this server.',
        });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.editReply({
          content: 'You do not have permission to timeout members.',
        });
        return;
      }

      if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.editReply({
          content: 'I do not have permission to timeout members.',
        });
        return;
      }

      if (target.roles.highest.position >= caller.roles.highest.position) {
        await interaction.editReply({
          content: 'You cannot timeout this user because they have a higher or equal role than you.',
        });
        return;
      }

      if (target.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        await interaction.editReply({
          content: 'I cannot timeout this user because they have a higher or equal role than me.',
        });
        return;
      }

      await target.timeout(duration * 60 * 1000, reason);

      const embed = new EmbedBuilder()
        .setColor('#ea580c')
        .setTitle('Member Timed Out')
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'User', value: target.toString(), inline: true },
          { name: 'Duration', value: `${duration} minute(s)`, inline: true },
          { name: 'By', value: interaction.user.toString(), inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({
          text: interaction.guild.members.me.displayName,
          iconURL: interaction.guild.members.me.displayAvatarURL(),
        })
        .setTimestamp(new Date());

      const logChannel = interaction.guild.channels.cache.get(Config.ACTION_LOG_CHANNEL) as TextChannel;
      if (logChannel) await logChannel.send({ embeds: [embed] });

      await db.query(
        'INSERT INTO public.moderation_logs (target_id, target_tag, moderator_id, moderator_tag, action, reason, created_at, metadata) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)',
        [
          target.id,
          target.user.tag,
          interaction.user.id,
          interaction.user.tag,
          'timeout',
          reason,
          JSON.stringify({ duration: duration }),
        ]
      );

      await interaction.editReply({
        content: `<@${target.id}> has been timed out successfully.`,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to timeout a member.');
      await interaction.editReply({ content: 'Failed to timeout a member.' });
    }
  },
};

export default command;
