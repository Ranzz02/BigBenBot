// index.js
import Discord, { Collection, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { loadEvents } from './handlers/eventHandler.js';
import { loadCommands } from './handlers/commandHandler.js';
import { startCronJob } from './cron/job.js';
dotenv.config();

const Client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageTyping
    ]
});

Client.commands = new Collection();

// Load event and command handlers
loadEvents(Client);
loadCommands(Client);

// Start the hourly cron job
Client.once('ready', async () => {
    const guild = await Client.guilds.fetch(process.env.GUILD_ID); // Fetch the guild by ID
    startCronJob(Client, guild); // Pass the client and guild to the cron job
    console.log('Bot is ready!');
});

Client.login(process.env.TOKEN);
