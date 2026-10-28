import { CommandInteraction } from "../discord-interaction.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";

import { withGameTransaction } from "../sqlDatabase.js";
import { addPlayer, playerExists, updatePlayerName } from "../addPlayer.js";
import { getPlayerRedirects } from "../playerMerge.js";

export const data = new SlashCommandBuilder()
  .setName("updatename")
  .setDescription("Update your name in the system")
  .addStringOption((opt) =>
    opt.setName("name").setDescription("New name").setRequired(true),
  );

export async function execute(interaction: CommandInteraction) {
  const id = interaction.user.id;
  const name = interaction.options.getString("name", true);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const redirectedTo = await withGameTransaction(async () => {
    const [redirect] = await getPlayerRedirects([id]);
    if (redirect) return redirect.target_id;
    if (!(await playerExists(id))) {
      await addPlayer(id, name);
    } else {
      await updatePlayerName(id, name);
    }
    return null;
  });
  return interaction.editReply({
    content: redirectedTo
      ? `This account was merged into <@${redirectedTo}>. Use the main account to update its name.`
      : "Your name has been updated!",
  });
}
