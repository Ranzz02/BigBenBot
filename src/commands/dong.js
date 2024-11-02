import { play } from '../audio/audioPlayer.js';

export default {
    name: 'dong',
    description: 'Plays a single Big Ben chime.',
    async execute(interaction) {
        const guild = interaction.guild;
        await interaction.deferReply();
        try {
            play(guild, 1, "bigben.mp3");
            await interaction.editReply(`DONG!`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while trying to play the sound.');
        }
    },
};