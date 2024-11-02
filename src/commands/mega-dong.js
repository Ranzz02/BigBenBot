import { play } from '../audio/audioPlayer.js';

export default {
    name: 'mega-dong',
    description: 'Plays one MEGA Big Ben chime.',
    async execute(interaction) {
        const guild = interaction.guild;
        await interaction.deferReply();
        try {
            play(guild, 1, "bigben.mp3", 5);
            await interaction.editReply(`MEGA DONG!!!`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while trying to play the sound.');
        }
    },
};
