import { Request, Response } from "express";
import { PageLayout } from "../../lib/pageLayout.html";
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
      <input type="text" id="player1Name" name="playerName" required>
      <br>
      <label for="player1Score">Player1 Score:</label>
      <input type="number" id="player1Score" name="playerName required>
      <label for="player1Score">00</label>
      <button type="submit" name="__action" value="add">Submit</button>
    </form>`,
  });
  return htmlContent;
}
