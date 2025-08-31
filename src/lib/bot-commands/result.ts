import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  User,
} from "discord.js";

import { queryRows } from "../sqlDatabase.js";
import { loadSqlEquiv } from "../sqlLoader.js";
import { Semester } from "../db-types.js";
import { insertGameResults, processGameResults } from "../gameResults.js";
import { addPlayer, playerExists } from "../addPlayer.js";

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
  const active_semesters = await queryRows<Semester>(
    sql.select_active_semesters
  );
  if (!active_semesters.length) {
    return interaction.reply({
      content:
        "There is no activates semester. Please contact a club officer for help.",
      flags: MessageFlags.Ephemeral,
    });
  }
  // There should be just one active semester in this case
  // Maybe implement queryOptionalRow later, but this works for now
  const semester = active_semesters[0].semester;

  const data: Record<string, { player: User; score: number }> = {};
  [1, 2, 3, 4].forEach((idx) => {
    const player = interaction.options.getUser(`player${idx}`, true);
    const score = interaction.options.getInteger(`score${idx}`, true);
    data[player.id] = { player, score };
  });
  const player_ids = Object.keys(data);

  for (const { player } of Object.values(data)) {
    if (!(await playerExists(player.id))) {
      await addPlayer(player.id, player.displayName);
    }
  }

  try {
    const results = await processGameResults(
      {
        player1ID: player_ids[0],
        player2ID: player_ids[1],
        player3ID: player_ids[2],
        player4ID: player_ids[3],
        player1Score: `${data[player_ids[0]].score / 100}`,
        player2Score: `${data[player_ids[1]].score / 100}`,
        player3Score: `${data[player_ids[2]].score / 100}`,
        player4Score: `${data[player_ids[3]].score / 100}`,
        player1Wind: null,
        player2Wind: null,
        player3Wind: null,
        player4Wind: null,
        teamGame: false,
        semester,
      },
      "discord"
    );
    await insertGameResults(results, semester, false);
    return interaction.reply(
      "Game result:\n" +
        results
          .map(
            (result) =>
              `<@${result.player_id}> Score: ${result.score} Point change: ${result.point_change}`
          )
          .join("\n") +
        `\nUpdated ranking can be found at https://uiucriichi.web.illinois.edu/semesters/${semester}/players`
    );
  } catch (err) {
    // TODO: maybe allow for faster editing when error instead of having to copy/paste from previous command
    if (typeof err === "string") {
      return interaction.reply({
        content: err.toUpperCase(),
        flags: MessageFlags.Ephemeral,
      });
    } else if (err instanceof Error) {
      return interaction.reply({
        content: err.message,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      return interaction.reply({
        content: "Unknow error",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
