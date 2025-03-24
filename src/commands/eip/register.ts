import { AutocompleteInteraction, ChannelType, type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import getChannelName from "@utilities/getChannelName";
import setupCron from "@utilities/setupCron";
import type Data from "@/EIPote/Data";
import type Jobs from "@/EIPote/Jobs";
import Command from "@commands/Command";

export default class Register extends Command {
    data = new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register a time zone to create a channel for")
        .addStringOption((option) => option.setName("time_zone")
            .setDescription("The time zone")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) => option.setName("channel_name")
            .setDescription("The name of the channel")
            .setRequired(false)
        );

    private static timeZones = Intl.supportedValuesOf("timeZone");

    async execute(interaction: ChatInputCommandInteraction, data: Data, jobs: Jobs) {
        if (!interaction.guild) {
            await interaction.reply({ content: "Please run this command in a guild", flags: MessageFlags.Ephemeral });
            return;
        }

        const timeZone = interaction.options.getString("time_zone");

        if (!timeZone || !Register.timeZones.includes(timeZone)) {
            await interaction.reply({ content: "Please provide a valid time zone", flags: MessageFlags.Ephemeral });
            return;
        }

        const channelName = interaction.options.getString("channel_name") || timeZone;

        if (data.channels[interaction.guild.id] && Object.entries(data.channels[interaction.guild.id]).find(async ([id, channelInfo]) => {
            if (interaction.guild && !interaction.guild.channels.cache.find((channel) => channel.id === id)) {
                data.deleteChannel(interaction.guild.id, id);
                return false;
            }
            if (channelInfo.timeZone === timeZone) {
                await interaction.reply({ content: `A channel with this time zone already exists: ${channelInfo.name} (<#${id}>)`, flags: MessageFlags.Ephemeral });
                return true;
            }
            if (channelInfo.name === channelName) {
                await interaction.reply({ content: `A channel with this name already exists: ${channelInfo.name} (<#${id}>)`, flags: MessageFlags.Ephemeral });
                return true;
            }
            return false;
        })) return;

        const channelInfo = { name: channelName, timeZone };
        const channel = await interaction.guild?.channels.create({
            type: ChannelType.GuildVoice,
            name: getChannelName(channelInfo)
        });

        if (!channel) {
            await interaction.reply({ content: "Unable to create channel", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({ content: `${channelName} channel created with time zone ${timeZone} (<#${channel.id}>)`, flags: MessageFlags.Ephemeral });

        if (!data.channels[interaction.guild.id])
            data.channels[interaction.guild.id] = {};
        data.channels[interaction.guild.id][channel.id] = channelInfo;
        data.save();
        jobs.add(channel.id, setupCron(channel, channelInfo, data));
    }

    static async autocomplete(interaction: AutocompleteInteraction) {
        await interaction.respond(
            Register.timeZones
                .filter((timeZone) => timeZone
                    .toLocaleLowerCase()
                    .includes(
                        interaction.options
                            .getFocused()
                            .toLocaleLowerCase()
                    )
                )
                .slice(0, 25)
                .map((timeZone) => ({
                    name: timeZone,
                    value: timeZone
                }))
        );
    }
}
