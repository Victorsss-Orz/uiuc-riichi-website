import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import { queryRows, withGameTransaction } from "../sqlDatabase.js";
import { loadSqlEquiv } from "../sqlLoader.js";
import { Semester } from "../db-types.js";
import { insertGameResults, processGameResults, GameValidationError, validateGameEntries } from "../gameResults.js";
import { addPlayer, playerExists } from "../addPlayer.js";
import { getPlayerRedirects } from "../playerMerge.js";

const sql = loadSqlEquiv(import.meta.url);

export const data = new SlashCommandBuilder()
  .setName("result")
  .setDescription("Report the result of a ranked game")
  .addUserOption((opt) =>
    opt.setName("player1").setDescription("Player 1").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score1").setDescription("Score for player 1").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player2").setDescription("Player 2").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score2").setDescription("Score for player 2").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player3").setDescription("Player 3").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score3").setDescription("Score for player 3").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player4").setDescription("Player 4").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score4").setDescription("Score for player 4").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // Keep entries in an array: a map keyed by ID silently overwrites duplicates.
  const entries = [1, 2, 3, 4].map((idx) => ({
    player: interaction.options.getUser(`player${idx}`, true),
    score: interaction.options.getInteger(`score${idx}`, true),
  }));
  try {
    validateGameEntries(entries.map(({ player, score }) => ({ player_id: player.id, score })));
  } catch (error) {
    return interaction.reply({
      content: error instanceof Error ? error.message : "Invalid game results.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Acknowledge before database work, which may exceed Discord's response deadline.
  await interaction.deferReply();
  let saved;
  try {
    saved = await withGameTransaction(async () => {
      const redirects = await getPlayerRedirects(entries.map(({ player }) => player.id));
      const ids = entries.map(({ player }) => redirects.find(m => m.source_id === player.id)?.target_id ?? player.id);
      // Different Discord IDs can resolve to the same player after a merge.
      validateGameEntries(entries.map(({ score }, i) => ({ player_id: ids[i], score })));
      const activeSemesters = await queryRows<Semester>(sql.select_active_semesters);
      if (activeSemesters.length !== 1) {
        throw new GameValidationError("Exactly one semester must be active. Please contact a club officer.");
      }
      const semester = activeSemesters[0].semester;
      for (const [i, { player }] of entries.entries()) {
        if (!(await playerExists(ids[i]))) {
          await addPlayer(ids[i], player.displayName);
        }
      }
      const results = await processGameResults({
        player1ID: ids[0],
        player2ID: ids[1],
        player3ID: ids[2],
        player4ID: ids[3],
        player1Score: `${entries[0].score / 100}`,
        player2Score: `${entries[1].score / 100}`,
        player3Score: `${entries[2].score / 100}`,
        player4Score: `${entries[3].score / 100}`,
        player1Wind: null,
        player2Wind: null,
        player3Wind: null,
        player4Wind: null,
        teamGame: false,
        semester,
      });
      await insertGameResults(results, semester, false);
      return { results, semester, redirects };
    });
  } catch (error) {
    if (!(error instanceof GameValidationError)) console.error(error);
    return interaction.editReply(error instanceof GameValidationError
      ? error.message
      : "Unable to save the game. Please ask an officer to check the game history before resubmitting.");
  }
  // Reply only after the transaction commits. A Discord delivery failure must
  // not be reported as a database rollback.
  await interaction.editReply(
    "Game result:\n" + saved.results.map((result) =>
      `<@${result.player_id}> Score: ${result.score} Point change: ${result.point_change.toFixed(1)}`,
    ).join("\n") +
    `\nUpdated ranking can be found at https://uiucriichi.web.illinois.edu/semester/${saved.semester}/players`,
  );
  if (saved.redirects.length) {
    try {
      await interaction.followUp({
        content: saved.redirects.map(m =>
          `Account <@${m.source_id}> has been merged into <@${m.target_id}>.\n` +
          `This result is recorded under <@${m.target_id}>.`,
        ).join("\n\n"),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      // The result is already saved and public; a failed notice must not imply a failed save.
      console.error("Game saved, but merged-account notice could not be delivered.", error);
    }
  }
}
