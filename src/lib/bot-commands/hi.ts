import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("hi")
  .setDescription("Says hi!");

export async function execute(interaction: ChatInputCommandInteraction) {
  return interaction.reply("Hello there! 👋");
}
