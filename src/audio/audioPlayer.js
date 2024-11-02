import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function play(guild, times, source, volume = 1) {
    const audioPath = path.resolve(__dirname + "/sources", source);
    console.log(audioPath)

    const connection = joinVoiceChannel({
        channelId: process.env.VOICE_CHANNEL_ID,
        guildId: process.env.GUILD_ID,
        adapterCreator: guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    player.on(AudioPlayerStatus.Playing, () => {
        console.log('Audio is playing!');
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio finished playing.');
    });

    player.on('error', (error) => {
        console.error('Error in audio player:', error);
    });

    // Subscribe the connection to the audio player
    connection.subscribe(player);

    // Loop to play the audio the specified number of times
    for (let i = 0; i < times; i++) {
        try {
            const resource = createAudioResource(audioPath, { inlineVolume: true });
            resource.volume.setVolume(volume);

            player.play(resource);

            await new Promise((resolve, reject) => {
                player.once(AudioPlayerStatus.Idle, resolve);
                player.once('error', reject);
            });

            console.log(`Played sound ${i + 1} of ${times}`);
        } catch (error) {
            console.error(`Error while playing sound ${i + 1}:`, error);
            break;
        }
    }
    connection.disconnect();
}
