// cron/job.js
import { CronJob } from 'cron';
import { play } from '../audio/audioPlayer.js';
import { getTimeInfo } from '../utils/timeUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const { MATCH_DINGS_WITH_HOUR } = process.env;

export function startCronJob(guild) {
    const job = new CronJob('0 * * * *', async () => { // Runs every hour on the hour
        try {
            const { hour } = getTimeInfo();
            const chimeCount = MATCH_DINGS_WITH_HOUR ? hour : 1;
            
            // Play chimes based on the current hour or as configured
            await play(guild, chimeCount, "bigben.mp3", 1);
            console.log(`Chimes played for ${hour}:00`);
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    }, null, true, "Europe/Helsinki");

    job.start();
    console.log('Cron job started.');
}
