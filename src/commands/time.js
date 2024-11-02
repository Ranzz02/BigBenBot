import { play } from '../audio/audioPlayer.js';
import { getTimeInfo } from '../utils/timeUtils.js';
import Discord from 'discord.js';

export default {
    name: 'time',
    description: 'Displays the current time and plays a single Big Ben chime.',
    async execute(interaction) {
        const guild = interaction.guild;
        await interaction.deferReply();
        try {
            const { hour, amPm, timezoneOffsetString } = getTimeInfo();
            play(guild, 1, "bigben.mp3", 0.33);

            const messageEmbed = new Discord.EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`The time is now ${hour}:00 ${amPm} GMT${timezoneOffsetString}`);

            await interaction.editReply({ embeds: [messageEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while trying to play the sound.');
        }
    },
};
