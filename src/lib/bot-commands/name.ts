import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import { addPlayer, playerExists, updatePlayerName } from "../addPlayer.js";

export const data = new SlashCommandBuilder()
  .setName("updatename")
  .setDescription("Update your name in the system")
  .addStringOption((opt) =>
    opt.setName("name").setDescription("New name").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const id = interaction.user.id;
  const name = interaction.options.getString("name", true);
  if (!(await playerExists(id))) {
    await addPlayer(id, name);
  } else {
    await updatePlayerName(id, name);
  }
  return interaction.reply({
    content: "Your name has been updated!",
    flags: MessageFlags.Ephemeral,
  });
}
