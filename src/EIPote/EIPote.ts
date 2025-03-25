import { ChannelType, Client, Collection, Events, GatewayIntentBits, MessageFlags, REST, Routes, type Interaction } from "discord.js";
import grabCommands from "@utilities/grabCommands";
import setupCron from "@utilities/setupCron";
import Data from "./Data";
import Jobs from "./Jobs";
import type Command from "@commands/Command";

export default class EIPote {
    private client: Client;

    private commands = new Collection<string, Command>();

    private readonly data: Data;

    private jobs: Jobs = new Jobs;

    constructor(token: string | undefined, data: Data) {
        if (!token)
            throw new Error("Token must be a non-empty string");

        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
        this.client.token = token;

        this.data = data;
    }

    static async create(token: string | undefined, dir: string) {

        const eiPote = new this(token, await Data.create());

        await grabCommands(dir, (command) => eiPote.commands.set(command.data.name, command));

        return eiPote;
    }

    async start() {
        this.client.once(Events.ClientReady, this.ready.bind(this));
        this.client.on(Events.InteractionCreate, this.interactionCreate.bind(this));
        await this.client.login();
    }

    private async registerCommands(client: Client<true>) {
        const rest = new REST().setToken(client.token);

        try {
            console.log(`Started refreshing ${this.commands.size} application (/) commands.`);

            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: this.commands.map((command) => command.data.toJSON()) }
            );

            console.log(`Successfully reloaded ${Array.isArray(data) ? data.length : "??"} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    }

    private async ready(client: Client<true>) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        await this.registerCommands(client);

        Object.entries(this.data.channels).forEach(([guildId, guild]) => Object.entries(guild).forEach(([id, channelInfo]) => {
            client.channels.fetch(id)
                .then(async (channel) => {
                    if (!channel || channel.type !== ChannelType.GuildVoice) {
                        await this.data.deleteChannel(guildId, id);
                        return;
                    }

                    this.jobs.add(id, setupCron(channel, channelInfo, this.data, true));
                })
                .catch((error) => {
                    if (error.code === 10003) this.data.deleteChannel(guildId, id);
                    else console.error(error);
                });
        }));
    }

    private async interactionCreate(interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            const command = this.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching \`${interaction.commandName}\` was found.`);
                return;
            }

            try {
                await command.execute(interaction, this.data, this.jobs);
            } catch (error) {
                console.error(error);

                if (interaction.replied || interaction.deferred)
                    await interaction.followUp({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral });
                else
                    await interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral });
            }
        } else if (interaction.isAutocomplete()) {
            const command = this.commands.get(interaction.commandName);

            if (!command || !command.autocomplete) {
                console.error(`No command or autocomplete method matching \`${interaction.commandName}\` was found.`);
                return;
            }

            try {
                await command.autocomplete(interaction, this.data);
            } catch (error) {
                console.error(error);
            }
        }
    }
}
