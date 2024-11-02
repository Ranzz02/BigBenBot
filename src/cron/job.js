// cron/job.js
import { CronJob } from 'cron';
import { play } from '../audio/audioPlayer.js';
import { getTimeInfo } from '../utils/timeUtils.js';
import Discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const { MATCH_DINGS_WITH_HOUR, TEXT_CHANNEL_ID } = process.env;

export function startCronJob(client, guild) {
    const job = new CronJob('0 * * * *', async () => { // Runs every hour on the hour
        try {
            
            const { hour, amPm, timezoneOffsetString } = getTimeInfo();
            const chimeCount = MATCH_DINGS_WITH_HOUR ? hour : 1;
            
            // Fetch the text channel to send a message
            const textChannel = await client.channels.fetch(TEXT_CHANNEL_ID);

            // Send a message if the text channel is available
            if (textChannel) {
                const messageEmbed = new Discord.EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);
                
                textChannel.send({ embeds: [messageEmbed] });
            }

            // Play chimes based on the current hour or as configured
            await play(guild, chimeCount, "bigben.mp3");
            console.log(`Chimes played for ${hour}:00`);
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    }, null, true, "Europe/Helsinki");

    job.start();
    console.log('Cron job started.');
}
