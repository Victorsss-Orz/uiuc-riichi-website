import { Request, Response } from "express";

import { PageLayout } from "../../components/pageLayout.html.js";
import { PlayerType } from "../../lib/db-types";
import { Modal } from "../../components/modal.html.js";
import { GameResultType } from "../../lib/gameStats.js";

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

      <div style="line-height: 2rem; margin-bottom: 1rem;">
        <label for="semester">Select semester:</label>
        <select name="semester" id="semester" style="width: 80px; overflow: hidden;">
          ${resLocals.semesters
            .map((row: string) => `<option value=${row}>${row}</option>`)
            .join("")}
        </select>
      </div>

      <div class="form-check form-switch d-flex" style="padding-left: 1rem; margin-bottom: 1rem;">
        Individual Game
        <input class="form-check-input mx-2" type="checkbox" id="teamGame" name="teamGame">
        Team Game
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-sm table-hover" aria-label="Created players">
            <thead>
              <tr>
                <td>Player</td>
                <td>Score</td>
                <td>Wind</td>
              </tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4]
                .map(
                  (i) => `
                <tr>
                  <td>
                    <select name="player${i}ID" id="player${i}ID" style="width: 180px; overflow: hidden;">
                      ${players
                        .map(
                          (row) =>
                            `<option value=${row.id}>${row.player_name}</option>`
                        )
                        .join("")}
                    </select>
                  </td>
                  <td>
                    <input type="number" id="player${i}Score" name="player${i}Score" style="width: 80px;" value="250" required>
                    <label for="player${i}Score"> 00</label>
                  </td>
                  <td>
                    <select name="player${i}Wind" id="player${i}Wind" style="width: 180px; overflow: hidden;">
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                    </select>
                  </td>
                </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
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

        document.getElementById("modal-body").innerHTML = data.html;

        // Show the modal (using Bootstrap)
        const modal = new bootstrap.Modal(document.getElementById("gameResultModal"));
        modal.show();
      });
    </script>
  `,
  });
  return htmlContent;
}

export function gameResultConfirmation(
  results: GameResultType[],
  semester: string
): string {
  const htmlContent = `
    <div style="margin-bottom: 1rem;">
      Confirm adding game to the ${semester} semester.
    </div>
    <div class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover" aria-label="Created players">
          <thead>
            <tr>
              <th>Name</th>
              <th>Score</th>
              <th>Placement</th>
              <th>Wind</th>
              <th>Point Change</th>
            </tr>
          </thead>
          <tbody>
            ${results
              .map(
                (result) => `
              <tr>
                <td>${result.player_name}</td>
                <td>${result.score}</td>
                <td>${result.placement}</td>
                <td>${result.starting_wind ?? ""}</td>
                <td>${
                  result.point_change < 0
                    ? result.point_change
                    : `+${result.point_change}`
                }</td>
              </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  return htmlContent;
}

// <div style="line-height: 2rem; margin-bottom: 1rem;">
// <label for="player1ID">Player1 Name:</label>
// <select name="player1ID" id="player1ID" style="width: 180px; overflow: hidden;">
//   ${players
//     .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
//     .join("")}
// </select>
// <br>
// <label for="player1Score">Player1 Score:</label>
// <input type="number" id="player1Score" name="player1Score" style="width: 80px;" value="250" required>
// <label for="player1Score"> 00</label>
// </div>

// <div style="line-height: 2rem; margin-bottom: 1rem;">
// <label for="player2ID">Player2 Name:</label>
// <select name="player2ID" id="player2ID" style="width: 180px; overflow: hidden;">
//   ${players
//     .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
//     .join("")}
// </select>
// <br>
// <label for="player2Score">Player2 Score:</label>
// <input type="number" id="player2Score" name="player2Score" style="width: 80px;" value="250" required>
// <label for="player2Score"> 00</label>
// </div>

// <div style="line-height: 2rem; margin-bottom: 1rem;">
// <label for="player3ID">Player3 Name:</label>
// <select name="player3ID" id="player3ID" style="width: 180px; overflow: hidden;">
//   ${players
//     .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
//     .join("")}
// </select>
// <br>
// <label for="player3Score">Player3 Score:</label>
// <input type="number" id="player3Score" name="player3Score" style="width: 80px;" value="250" required>
// <label for="player3Score"> 00</label>
// </div>

// <div style="line-height: 2rem; margin-bottom: 1rem;">
// <label for="player4ID">Player4 Name:</label>
// <select name="player4ID" id="player4ID" style="width: 180px; overflow: hidden;">
//   ${players
//     .map((row) => `<option value=${row.id}>${row.player_name}</option>`)
//     .join("")}
// </select>
// <br>
// <label for="player4Score">Player4 Score:</label>
// <input type="number" id="player4Score" name="player4Score" style="width: 80px;" value="250" required>
// <label for="player4Score"> 00</label>
// </div>
