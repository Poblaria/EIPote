import { AutocompleteInteraction, type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type Data from "@/EIPote/Data";
import type Jobs from "@/EIPote/Jobs";
import Command from "@commands/Command";

export default class Unregister extends Command {
    data = new SlashCommandBuilder()
        .setName("unregister")
        .setDescription("Unregister a channel")
        .addStringOption((option) => option.setName("time_zone")
            .setDescription("A time zone to unregister")
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addStringOption((option) => option.setName("channel_name")
            .setDescription("A channel name to unregister")
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addChannelOption((option) => option.setName("channel")
            .setDescription("A channel to unregister")
            .setRequired(false)
        );

    async execute(interaction: ChatInputCommandInteraction, data: Data, jobs: Jobs) {
        if (!interaction.guild) {
            await interaction.reply({ content: "Please run this command in a guild", flags: MessageFlags.Ephemeral });
            return;
        }

        const timeZone = interaction.options.getString("time_zone");
        const channelName = interaction.options.getString("channel_name");
        const channel = interaction.options.getChannel("channel");

        const providedOptions = [timeZone, channelName, channel].filter(Boolean);

        if (!providedOptions.length) {
            await interaction.reply({ content: "You must provide exactly one option (`time_zone`, `channel_name`, or `channel`)!", flags: MessageFlags.Ephemeral });
            return;
        }

        if (providedOptions.length > 1) {
            await interaction.reply({ content: "Please provide only **one** option (`time_zone`, `channel_name`, or `channel`)!", flags: MessageFlags.Ephemeral });
            return;
        }

        const toDelete = data.channels[interaction.guild.id] ? Object.entries(data.channels[interaction.guild.id]).find(([id, channelInfo]) => {
            if (timeZone)
                return channelInfo.timeZone === timeZone;
            else if (channelName)
                return channelInfo.name === channelName;
            else if (channel)
                return id === channel.id;
            return false;
        }) : undefined;

        const channelToDelete = toDelete ? interaction.guild.channels.cache.find((guildChannel) => guildChannel.id === toDelete[0]) : undefined;

        if (!toDelete || !channelToDelete) {
            await interaction.reply({ content: "The channel is non-existent or is not managed by me", flags: MessageFlags.Ephemeral });
            return;
        }

        await channelToDelete.delete();
        await interaction.reply({ content: `${toDelete[1].name} channel with time zone ${toDelete[1].timeZone} (*${channelToDelete.name}*) successfully deleted`, flags: MessageFlags.Ephemeral });

        await data.deleteChannel(interaction.guild.id, channelToDelete.id);
        jobs.remove(channelToDelete.id);
    }

    async autocomplete(interaction: AutocompleteInteraction, data: Data) {
        if (!interaction.guild) {
            await interaction.respond([]);
            return;
        }

        const optionName = interaction.options.getFocused(true).name;

        switch (optionName) {
        case "time_zone":
            if (!data.channels[interaction.guild.id]) {
                await interaction.respond([]);
                return;
            }
            await interaction.respond(
                Object.values(data.channels[interaction.guild.id])
                    .filter((channelInfo) => channelInfo.timeZone
                        .toLocaleLowerCase()
                        .includes(
                            interaction.options
                                .getFocused()
                                .toLocaleLowerCase()
                        )
                    )
                    .map((channelInfo) => channelInfo.timeZone)
                    .slice(0, 25)
                    .map((timeZone) => ({
                        name: timeZone,
                        value: timeZone
                    }))
            );
            break;
        case "channel_name":
            if (!data.channels[interaction.guild.id]) {
                await interaction.respond([]);
                return;
            }
            await interaction.respond(
                Object.values(data.channels[interaction.guild.id])
                    .filter((channelInfo) => channelInfo.name
                        .toLocaleLowerCase()
                        .includes(
                            interaction.options
                                .getFocused()
                                .toLocaleLowerCase()
                        )
                    )
                    .map((channelInfo) => channelInfo.name)
                    .slice(0, 25)
                    .map((name) => ({
                        name: name,
                        value: name
                    }))
            );
            break;
        default:
            console.error(`Cannot autocomplete ${optionName} interaction option`);
            await interaction.respond([]);
        }
    }
}
