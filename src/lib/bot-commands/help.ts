import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import { commands } from "./index.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show supported commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  const commandsMsg = Object.values(commands)
    .map((command) => {
      const data = command.data;
      return `/${data.name}: ${data.description}`;
    })
    .join("\n");
  return interaction.reply({
    content: commandsMsg,
    flags: MessageFlags.Ephemeral,
  });
}
