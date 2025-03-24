import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "@commands/Command";

export default class Ping extends Command {
    data = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!");

    async execute(interaction: ChatInputCommandInteraction) {
        const reply = `Pong!\nWebsocket heartbeat: ${interaction.client.ws.ping}ms.\nRoundtrip latency: Pinging...`;
        const sent = await interaction.reply(reply);
        interaction.editReply(reply.replace("Pinging...", `${sent.createdTimestamp - interaction.createdTimestamp}ms`));
    }
}
