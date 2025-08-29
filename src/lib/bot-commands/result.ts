import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { processGameResults } from "../gameResults.js";

export const data = new SlashCommandBuilder()
  .setName("result")
  .setDescription("Report the result of a ranked game.")
  .addUserOption((opt) =>
    opt.setName("player1").setDescription("First player").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score1").setDescription("Score for player 1").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player2").setDescription("Second player").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score2").setDescription("Score for player 2").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player3").setDescription("Third player").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score3").setDescription("Score for player 3").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player4").setDescription("Fourth player").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt.setName("score4").setDescription("Score for player 4").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const p1 = interaction.options.getUser("player1", true);
  const p2 = interaction.options.getUser("player2", true);
  const p3 = interaction.options.getUser("player3", true);
  const p4 = interaction.options.getUser("player4", true);

  const s1 = interaction.options.getInteger("score1", true);
  const s2 = interaction.options.getInteger("score2", true);
  const s3 = interaction.options.getInteger("score3", true);
  const s4 = interaction.options.getInteger("score4", true);

  try {
    const results = await processGameResults(
      {
        player1ID: p1.id,
        player2ID: p2.id,
        player3ID: p3.id,
        player4ID: p4.id,
        player1Score: `${s1 / 100}`,
        player2Score: `${s2 / 100}`,
        player3Score: `${s3 / 100}`,
        player4Score: `${s4 / 100}`,
        player1Wind: null,
        player2Wind: null,
        player3Wind: null,
        player4Wind: null,
        teamGame: false,
        semester: "fa25", // TODO: replace with environment var
      },
      "discord"
    );
    return interaction.reply(
      "Game result:\n" +
        results
          .map((result) => `Point change: ${result.point_change}`)
          .join("\n")
    );
  } catch (err) {
    // TODO: only show to sender when error
    if (typeof err === "string") {
      return interaction.reply(err.toUpperCase());
    } else if (err instanceof Error) {
      return interaction.reply(err.message);
    } else {
      return interaction.reply("Unknow error");
    }
  }
}
