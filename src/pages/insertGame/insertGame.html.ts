import { Request, Response } from "express";
import { PageLayout } from "../../lib/pageLayout.html.js";
import { PlayerType } from "../../lib/db-types";
import { Modal } from "../../lib/modal.html.js";

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
    <form id="addGameForm" method="POST">
      <div id="player1Stats" style="line-height: 30px; margin-bottom: 15px;">
        <label for="player1ID">Player1 Name:</label>
        <select name="player1ID" id="player1ID" style="width: 180px; overflow: hidden;">
          ${players
            .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
            .join("")}
        </select>
        <br>
        <label for="player1Score">Player1 Score:</label>
        <input type="number" id="player1Score" name="player1Score" style="width: 80px;" required>
        <label for="player1Score"> 00</label>
      </div>

      <div id="player2Stats" style="line-height: 30px; margin-bottom: 15px;">
        <label for="player2ID">Player2 Name:</label>
        <select name="player2ID" id="player2ID" style="width: 180px; overflow: hidden;">
          ${players
            .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
            .join("")}
        </select>
        <br>
        <label for="player2Score">Player2 Score:</label>
        <input type="number" id="player2Score" name="player2Score" style="width: 80px;" required>
        <label for="player2Score"> 00</label>
      </div>

      <div id="player3Stats" style="line-height: 30px; margin-bottom: 15px;">
        <label for="player3ID">Player3 Name:</label>
        <select name="player3ID" id="player3ID" style="width: 180px; overflow: hidden;">
          ${players
            .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
            .join("")}
        </select>
        <br>
        <label for="player3Score">Player3 Score:</label>
        <input type="number" id="player3Score" name="player3Score" style="width: 80px;" required>
        <label for="player3Score"> 00</label>
      </div>

      <div id="player4Stats" style="line-height: 30px; margin-bottom: 15px;">
        <label for="player4ID">Player4 Name:</label>
        <select name="player4ID" id="player4ID" style="width: 180px; overflow: hidden;">
          ${players
            .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
            .join("")}
        </select>
        <br>
        <label for="player4Score">Player4 Score:</label>
        <input type="number" id="player4Score" name="player4Score" style="width: 80px;" required>
        <label for="player4Score"> 00</label>
      </div>
      <button 
        class="btn btn-primary"
        name="gamePreprocess" 
        type="submit" 
        data-toggle="modal" 
        data-target="#gameResultModal"
      >Add game history</button>
      ${Modal({
        body: "Calculating",
        footer: `
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-success" id="submit-button" name="__action" value="add">Add</button>
        `,
        id: "gameResultModal",
        title: "Game results",
      })}
    </form>

    

    <script type="module">
      document.getElementById("addGameForm").addEventListener("submit", async (e) => {
        if(e.submitter.name !== "gamePreprocess"){return;}
        e.preventDefault(); // Don't let the form do a full page refresh

        const form = e.target;
        const formData = new FormData(form);
        const body = new URLSearchParams(formData);

        const response = await fetch("/admin/games/calculate-game-results", {
          method: "POST",
          body: body,
        });
        const data = await response.json();
        
        if (!data.ok) {
          document.getElementById("submit-button").disabled = true;
        }
        else {
          document.getElementById("submit-button").disabled = false;
        }

        document.getElementById("modal-body").innerHTML = data.text;

        // Show the modal (using Bootstrap)
        const modal = new bootstrap.Modal(document.getElementById("gameResultModal"));
        modal.show();
      });
    </script>
  `,
  });
  return htmlContent;
}
