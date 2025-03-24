import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction, type SlashCommandOptionsOnlyBuilder, type SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import type Data from "@/EIPote/Data";
import type Jobs from "@/EIPote/Jobs";

export default abstract class Command {
    abstract data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;

    abstract execute(interaction: ChatInputCommandInteraction, data: Data, jobs: Jobs): Promise<unknown>;

    autocomplete?(interaction: AutocompleteInteraction, data: Data): Promise<unknown>;
}
