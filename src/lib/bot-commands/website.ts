import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("website")
  .setDescription("Get club website link");

export async function execute(interaction: ChatInputCommandInteraction) {
  return interaction.reply({
    content: "Website is live at https://uiucriichi.web.illinois.edu",
    flags: MessageFlags.Ephemeral,
  });
}
