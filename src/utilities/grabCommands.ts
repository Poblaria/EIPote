import { join } from "path";
import { readdir, stat } from "node:fs/promises";
import Command from "@commands/Command";

export default async function grabCommands(dir: string, storeCommand: (command: Command) => unknown) {
    const foldersPath = join(dir, "commands");
    const commandFolders = await readdir(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = join(foldersPath, folder);

        if (!(await stat(commandsPath)).isDirectory())
            continue;

        const commandFiles = await readdir(commandsPath);

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = (await import(filePath)).default;

            if (typeof command === "function" && command.prototype instanceof Command)
                storeCommand(new command());
            else
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
