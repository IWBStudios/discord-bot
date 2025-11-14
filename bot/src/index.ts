import { Client, GatewayIntentBits } from 'discord.js';
import Config from './config';
import { registerEvents } from './handlers/eventRegistry';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

registerEvents(client);

client.login(Config.DISCORD_TOKEN);
