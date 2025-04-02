import { Request, Response } from "express";
import { PageLayout } from "../../lib/pageLayout.html.js";
import { PlayerType } from "../../lib/db-types";

export function insertGame({
  resLocals,
  players,
}: {
  resLocals: Record<string, any>;
  players: PlayerType[];
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add Game",
    content: `
    <form id="addPlayerForm" method="POST">
      <label for="player1Name">Player1 Name:</label>
      <select name="player1Name" id="player1Name" style="width: 180px; overflow: hidden;">
				${players.map((row) => `<option value=${row.id}>${row.player_name}</option>`).join("")}
			</select>
      <br>
      <label for="player1Score">Player1 Score:</label>
      <input type="number" id="player1Score" name="player1Score" required>
      <label for="player1Score">00</label>
      <button type="submit" name="__action" value="add">Submit</button>
    </form>`,
  });
  return htmlContent;
}
