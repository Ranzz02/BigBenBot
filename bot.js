import Discord, { REST, Routes, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from '@discordjs/voice';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const rest = new REST().setToken(process.env.TOKEN);
export const slashRegister = async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID), {
            body: [
                {
                    name: "test",
                    description: "Test out the big man"
                }
            ]
        });
    } catch (error) {
        console.log(error);
    }
};

slashRegister();

const { TOKEN, GUILD_ID, VOICE_CHANNEL_ID, TEXT_CHANNEL_ID, MATCH_DINGS_WITH_HOUR } = process.env;

const Client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageTyping
    ]
});

let guild, textChannel;

// When the bot comes online, check the guild and voice channel are valid
Client.on('ready', async () => {
    try {
        guild = await Client.guilds.fetch(GUILD_ID);
        textChannel = await guild.channels.fetch(TEXT_CHANNEL_ID);
        Client.user.setPresence({ activity: { name: 'the hour', type: 'WATCHING' }, status: 'idle' });
        console.log('Big Ben Ready...');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
});

// Listen for messages in the text channel
Client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return; // Check if it's a command interaction

    const { commandName } = interaction;

    if (commandName === 'test') {
        await interaction.deferReply(); // Acknowledge the command

        // Get current hour and other time info
        let { hour } = getTimeInfo();

        try {
            // Set bot presence to indicate testing
            Client.user.setPresence({ activity: { name: 'the big bell (test)', type: 'PLAYING' }, status: 'available' });

			// Immediately invoked function that loops to play the bell sound
			play(player, connection);

            await interaction.editReply(`Playing the bell sound ${hour} times.`); // Optional response to the user
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while trying to play the sound.'); // Notify user of error
        }
    } else if (commandName === 'help') {
        const commands = [
            { name: 'test', description: 'Test out the big man' },
            // Add other commands here
        ];

        const helpEmbed = new Discord.EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('Available Commands')
            .setDescription('Here are the commands you can use:');

        commands.forEach(cmd => {
            helpEmbed.addFields({ name: `/${cmd.name}`, value: cmd.description });
        });

        await interaction.reply({ embeds: [helpEmbed] }); // Use reply with embeds
    }
});

// Use node-cron to create a job to run every hour
const task = cron.schedule('0 * * * *', async () => { // Adjusted to run at the top of every hour
    let { hour, amPm, timezoneOffsetString } = getTimeInfo();

    // If text channel was defined, send message in chat
    if (textChannel) {
        const messageEmbed = new Discord.EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);

        textChannel.send({ embeds: [messageEmbed] }); // Send embed message
    }

    try {
        Client.user.setPresence({ activity: { name: 'the big bell', type: 'PLAYING' }, status: 'available' });
        

        // Immediately invoked function that loops to play the bell sound
        play();

    } catch (error) {
        console.log(error);
    }
});

// Function to get current time and return an object containing hour and AM/PM
const getTimeInfo = () => {
    // Create a date in the desired time zone (here is UTC+2 or UTC+3)
    const time = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Helsinki" }));
    let hour = time.getHours() >= 12 ? time.getHours() - 12 : time.getHours();
    hour = hour === 0 ? 12 : hour;
    let amPm = time.getHours() >= 12 ? 'PM' : 'AM';
    let gmtOffset = time.getTimezoneOffset() / 60;
    let timezoneOffsetString = `${gmtOffset > 0 ? '-' : '+'} ${Math.abs(gmtOffset)}`;

    return {
        hour,
        amPm,
        timezoneOffsetString
    };
};

// Start the cron job
task.start();

Client.login(TOKEN);

async function play() {
    let { hour } = getTimeInfo();

    // Connect to the voice channel
    const connection = joinVoiceChannel({
        channelId: VOICE_CHANNEL_ID,
        guildId: GUILD_ID,
        adapterCreator: guild.voiceAdapterCreator,
    });

    // Create audio player
    const player = createAudioPlayer();

    for (let i = 0; i < hour; i++) {
        const resource = createAudioResource('bigben.mp3', {
            inlineVolume: true // Allows volume manipulation, useful for error handling
        });
        resource.volume.setVolume(2);

        player.play(resource); // Play the resource
        connection.subscribe(player); // Subscribe the connection to the audio player
        
        // Log when a sound starts playing
        console.log(`Playing sound ${i + 1} of ${hour}`);

        // Wait for the audio to finish before playing the next one
        await new Promise((resolve, reject) => {
            player.once('idle', () => {
                console.log(`Sound ${i + 1} finished playing`);
                resolve();
            });

            player.once('error', (error) => {
                console.error(`Error while playing sound ${i + 1}:`, error);
                reject(error); // Reject the promise if an error occurs
            });
        });
    }

    // Disconnect after playing all chimes
    connection.disconnect();
    Client.user.setPresence({ activity: { name: 'the hour', type: 'WATCHING' }, status: 'idle' });
}