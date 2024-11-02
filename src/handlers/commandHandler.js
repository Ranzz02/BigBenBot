import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = await import(`../commands/${file}`);
        if (command.default && command.default.name) {
            // Set the command in the client's commands Collection
            client.commands.set(command.default.name, command.default);
        } else {
            console.log(`Command file ${file} is missing a name or export.`);
        }
    }
}