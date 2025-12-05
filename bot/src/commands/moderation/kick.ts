import {
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import type { Command } from 'types/BotCommand';
import Config from '../../config';
import { db } from '../../db/db';
import logger from '../../utils/logger';

const command: Command = {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  run: async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const caller = interaction.member as GuildMember;

    const targetOption = interaction.options.getMember('user');
    const target = targetOption as GuildMember | null;

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

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
        await interaction.editReply({
          content: 'You do not have permission to kick members.',
        });
        return;
      }

      if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
        await interaction.editReply({
          content: 'I do not have permission to kick members.',
        });
        return;
      }

      if (target.roles.highest.position >= caller.roles.highest.position) {
        await interaction.editReply({
          content: 'You cannot kick someone with equal or higher role than you.',
        });
        return;
      }

      if (target.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        await interaction.editReply({
          content: 'I cannot kick this user (role hierarchy).',
        });
        return;
      }

      await target.kick(reason);

      const embed = new EmbedBuilder()
        .setColor('#ea580c')
        .setTitle('Member Kicked')
        .setDescription(`<@${target.id}> was **kicked** by <@${interaction.user.id}>.`)
        .addFields({ name: 'Reason', value: reason })
        .setAuthor({ name: target.user.username || 'Unknown', iconURL: target.displayAvatarURL() })
        .setTimestamp(new Date())
        .setFooter({ text: `Member ID: ${target.id}` })
        .setThumbnail(target.displayAvatarURL());

      const logChannel = interaction.guild.channels.cache.get(Config.ACTION_LOG_CHANNEL) as TextChannel;
      if (logChannel) await logChannel.send({ embeds: [embed] });

      await db.execute(
        'INSERT INTO moderation_logs (target_id, target_tag, moderator_id, moderator_tag, action, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [target.id, target.user.tag, interaction.user.id, interaction.user.tag, 'kick', reason]
      );

      await interaction.editReply({
        content: `<@${target.id}> has been kicked successfully.`,
      });
    } catch (error) {
      logger.error(error, 'Failed to kick member.');
      interaction.editReply({ content: 'Failed to kick member.' });
    }
  },
};

export default command;
