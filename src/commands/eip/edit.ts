import { AutocompleteInteraction, ChannelType, type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import getChannelName from "@/utilities/getChannelName";
import setupCron from "@/utilities/setupCron";
import type Data from "@/EIPote/Data";
import type Jobs from "@/EIPote/Jobs";
import Command from "@commands/Command";
import Register from "./register";

export default class Edit extends Command {
    data = new SlashCommandBuilder()
        .setName("edit")
        .setDescription("Edit a channel")
        .addStringOption((option) => option.setName("time_zone")
            .setDescription("A time zone to edit")
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addStringOption((option) => option.setName("channel_name")
            .setDescription("A channel name to edit")
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addChannelOption((option) => option.setName("channel")
            .setDescription("A channel to edit")
            .setRequired(false)
        )
        .addStringOption((option) => option.setName("new_time_zone")
            .setDescription("A new time zone")
            .setRequired(false)
            .setAutocomplete(true)
        )
        .addStringOption((option) => option.setName("new_channel_name")
            .setDescription("A new channel name")
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
        const newTimeZone = interaction.options.getString("new_time_zone");
        const newChannelName = interaction.options.getString("new_channel_name");

        const providedOptions = [timeZone, channelName, channel].filter(Boolean);
        const newProvidedOptions = [newTimeZone, newChannelName].filter(Boolean);

        if (!providedOptions.length) {
            await interaction.reply({ content: "You must provide exactly one option from the first three (`time_zone`, `channel_name`, or `channel`)!", flags: MessageFlags.Ephemeral });
            return;
        }

        if (providedOptions.length > 1) {
            await interaction.reply({ content: "Please provide only **one** option from the first three (`time_zone`, `channel_name`, or `channel`)!", flags: MessageFlags.Ephemeral });
            return;
        }

        const toEdit = Object.entries(data.channels[interaction.guild.id]).find(([id, channelInfo]) => {
            if (timeZone)
                return channelInfo.timeZone === timeZone;
            else if (channelName)
                return channelInfo.name === channelName;
            else if (channel)
                return id === channel.id;
            return false;
        });

        const channelToEdit = toEdit ? interaction.guild.channels.cache.find((guildChannel) => guildChannel.id === toEdit[0]) : undefined;

        if (!toEdit || !channelToEdit || channelToEdit.type !== ChannelType.GuildVoice) {
            await interaction.reply({ content: "The channel is non-existent or is not managed by me", flags: MessageFlags.Ephemeral });
            return;
        }

        if (!newProvidedOptions.length) {
            await interaction.reply({ content: "You must provide at least one option from the last two (`new_time_zone` or `new_channel_name`)!", flags: MessageFlags.Ephemeral });
            return;
        }

        const channelInfo = { name: newChannelName || toEdit[1].name, timeZone: newTimeZone || toEdit[1].timeZone };

        await channelToEdit.edit({ name: getChannelName(channelInfo) });
        await interaction.reply({ content: `${toEdit[1].name} channel with time zone ${toEdit[1].timeZone} successfully edited with new name ${channelInfo.name} and new time zone ${channelInfo.timeZone} (<#${channelToEdit.id}>)`, flags: MessageFlags.Ephemeral });

        await data.editChannel(interaction.guild.id, channelToEdit.id, channelInfo);
        jobs.edit(channelToEdit.id, setupCron(channelToEdit, channelInfo, data));
    }

    async autocomplete(interaction: AutocompleteInteraction, data: Data) {
        if (!interaction.guild) {
            await interaction.respond([]);
            return;
        }

        const optionName = interaction.options.getFocused(true).name;

        switch (optionName) {
        case "time_zone":
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
        case "new_time_zone":
            await Register.autocomplete(interaction);
            break;
        default:
            console.error(`Cannot autocomplete ${optionName} interaction option`);
            await interaction.respond([]);
        }
    }
}
