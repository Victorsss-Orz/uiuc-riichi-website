import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("hi")
  .setDescription("Says hi!");

export async function execute(interaction: CommandInteraction) {
  return interaction.reply("Hello! 👋");
}
