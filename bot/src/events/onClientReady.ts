import { ActivityType } from 'discord.js';
import type { BotEvent } from 'types/BotEvent';
import { deployCommands } from '../handlers/deployCommands';

const event: BotEvent<'clientReady'> = {
  name: 'clientReady',
  run: async (client) => {
    await deployCommands(client);
    console.log(`Logged in as ${client.user?.tag}`);

    client.user?.setPresence({
      activities: [
        {
          name: 'Under Development',
          type: ActivityType.Playing,
          state: 'Something good is cooking...',
        },
      ],
      status: 'online',
    });
  },
};

export default event;
