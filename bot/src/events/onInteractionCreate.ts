import { MessageFlags } from 'discord.js';
import logger from 'node:console';
import type { BotEvent } from 'types/BotEvent';
import { commands } from '../handlers/commandRegistry';

const event: BotEvent<'interactionCreate'> = {
  name: 'interactionCreate',
  run: async (_client, interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command || typeof command.run !== 'function') return;

    try {
      await command.run(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: 'There was an error executing that command.',
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) => {
            logger.error('Error sending error response:', err);
          });
      } else if (interaction.deferred) {
        await interaction
          .editReply({
            content: 'There was an error executing that command.',
          })
          .catch((err) => {
            logger.error('Error editing error response:', err);
          });
      }
    }
  },
};

export default event;
