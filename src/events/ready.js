export default async (client) => {
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const textChannel = await guild.channels.fetch(process.env.TEXT_CHANNEL_ID);
        client.user.setPresence({ activities: [{ name: 'Biggest of Bens', type: 'WATCHING' }], status: 'online' });
        console.log('Big Ben Ready...');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
