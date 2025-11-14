import { SlashCommandBuilder } from 'discord.js';
import type { Command } from 'types/BotCommand';

const command: Command = {
  data: new SlashCommandBuilder().setName('kick').setDescription('Kick someone'),
  category: 'Moderation',
  run: async (interaction) => {
    await interaction.reply('Emulated kick!');
  },
};

export default command;
