import Discord, { REST, Routes, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from '@discordjs/voice';
import { CronJob } from 'cron';
import commands from "./commands.json" assert { type: "json" };
import dotenv from 'dotenv';
dotenv.config();

const rest = new REST().setToken(process.env.TOKEN);
(async function slashRegister() {
    try {
        await rest.put(Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID), {
            body: commands
        });
    } catch (error) {
        console.log(error);
    }
})();

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
        Client.user.setPresence({ activity: { name: 'Biggest of Bens', type: 'WATCHING' }, status: 'available' });
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

    if (commandName === 'dong') {
        await interaction.deferReply();
        try {
			// Immediately invoked function that loops to play the bell sound
			play(1);
            await interaction.editReply(`DONG!`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while trying to play the sound.'); // Notify user of error
        }
    }
    
    if (commandName === 'time') {
        await interaction.deferReply();
        try {
            let { hour, amPm, timezoneOffsetString } = getTimeInfo();
            // If text channel is defined, send a message indicating the time
            if (!textChannel) {
                play(1);
                
                await interaction.editReply(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);
                return
            } else {
                play(1);

                const messageEmbed = new Discord.EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);

                // Immediately invoked function that loops to play the bell sound
                await interaction.editReply({ embeds: [messageEmbed] });
                return
            }
            await interaction.editReply(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while trying to play the sound.'); // Notify user of error
        }
    }

    if (commandName === "help") {
        await interaction.deferReply();
        try {
            const commandList = commands.map(cmd => `- **/${cmd.name}**: ${cmd.description}`).join('\n');
            await interaction.editReply(`Here are the available commands:\n${commandList}`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while fetching help information.');
        }
    }
});

// Use node-cron to create a job to run every hour
const job = new CronJob('0 * * * *', async () => { // Runs at the top and bottom of the hour
    let { hour, amPm, timezoneOffsetString } = getTimeInfo();

    // If text channel is defined, send a message indicating the time
    if (textChannel) {
        const messageEmbed = new Discord.EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);
        
        textChannel.send({ embeds: [messageEmbed] });
    }

    try {
        hour = MATCH_DINGS_WITH_HOUR ? hour : 1;
        play(hour);
    } catch (error) {
        console.log(error);
    }
}, null, true, "Europe/Helsinki");
job.start();

Client.login(TOKEN);

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

// Play sound function
async function play(hour) {
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
}