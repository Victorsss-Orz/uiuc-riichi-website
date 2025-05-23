import { PageLayout } from "../../../components/pageLayout.html.js";
import { PlayerRow } from "../../../lib/db-types.js";
import { Modal } from "../../../components/modal.html.js";
import { GameResult } from "../../../lib/gameResults.js";
import { html } from "../../../../packages/html/dist/index.js";
import { GameInfo } from "../../../lib/gamesTable.js";

export function games({
  resLocals,
  players,
  info,
}: {
  resLocals: Record<string, any>;
  players: PlayerRow[];
  info: GameInfo[];
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Manage games",
    content: html`
      <div style="margin-top: 1rem; margin-bottom: 1rem;">
        <h1>Manage games</h1>
      </div>
      <form id="addGameForm" method="POST">
        <div style="line-height: 2rem; margin-bottom: 1rem;">
          <label for="semester">Select semester:</label>
          <select
            name="semester"
            id="semester"
            style="width: 80px; overflow: hidden;"
          >
            ${resLocals.semesters.map(
              (row: string) => html`<option value=${row}>${row}</option>`
            )}
          </select>
        </div>

        <div
          class="form-check form-switch d-flex"
          style="padding-left: 1rem; margin-bottom: 1rem;"
        >
          Individual Game
          <input
            class="form-check-input mx-2"
            type="checkbox"
            id="teamGame"
            name="teamGame"
          />
          Team Game
        </div>

        <div class="card" style="max-width: 600px; margin-bottom: 1rem;">
          <div class="table-responsive">
            <table
              class="table table-sm table-hover"
              aria-label="Created players"
            >
              <thead>
                <tr>
                  <td>Player</td>
                  <td>Score</td>
                  <td>Wind</td>
                </tr>
              </thead>
              <tbody>
                ${[1, 2, 3, 4].map(
                  (i) => html`
                    <tr>
                      <td>
                        <select
                          name="player${i}ID"
                          id="player${i}ID"
                          style="width: 150px; overflow: hidden;"
                        >
                          <option selected></option>
                          ${players.map(
                            (row) =>
                              html`<option value=${row.id}>
                                ${row.player_name}
                              </option>`
                          )}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          id="player${i}Score"
                          name="player${i}Score"
                          style="width: 80px;"
                          value="250"
                          required
                        />
                        <label for="player${i}Score"> 00</label>
                      </td>
                      <td>
                        <select
                          name="player${i}Wind"
                          id="player${i}Wind"
                          style="width: 60px; overflow: hidden;"
                        >
                          <option selected></option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                          <option value="South">South</option>
                          <option value="North">North</option>
                        </select>
                      </td>
                    </tr>
                  `
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button
          class="btn btn-primary"
          name="gamePreprocess"
          type="submit"
          data-bs-toggle="modal"
          data-bs-target="#gameResultModal"
        >
          Add game history
        </button>
        ${Modal({
          body: "Calculating",
          footer: html`
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-success"
              id="submit-button"
              name="__action"
              value="add"
            >
              Add
            </button>
          `,
          id: "gameResultModal",
          title: "Game results",
        })}
      </form>

      <div style="margin-top: 1rem; margin-bottom: 1rem;">
        <h1>Past games</h1>
      </div>

      <div class="card" style="max-width: 1500px;">
        <div class="table-responsive">
          <table
            class="table table-sm table-hover"
            aria-label="Games"
            id="games"
            data-toggle="table"
            data-pagination="true"
            data-page-size="10"
          >
            <thead>
              <tr>
                <th>Date</th>
                <th>Player 1 Name</th>
                <th>Player 1 Score</th>
                <th>Player 2 Name</th>
                <th>Player 2 Score</th>
                <th>Player 3 Name</th>
                <th>Player 3 Score</th>
                <th>Player 4 Name</th>
                <th>Player 4 Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${info.map(
                (game) =>
                  html`<tr>
                    <td>${game.game_date}</td>

                    <td>${html`${game.player_1?.player_name}`}</td>
                    <td>${game.player_1?.score}</td>

                    <td>${html`${game.player_2?.player_name}`}</td>
                    <td>${game.player_2?.score}</td>

                    <td>${html`${game.player_3?.player_name}`}</td>
                    <td>${game.player_3?.score}</td>

                    <td>${html`${game.player_4?.player_name}`}</td>
                    <td>${game.player_4?.score}</td>
                    <td>
                      <form name="removeGame${game.game_id}Form" method="POST">
                        <button
                          type="submit"
                          class="btn btn-danger"
                          name="__action"
                          value="remove"
                          data-toggle="tooltip"
                          data-placement="right"
                          title="Remove this game"
                        >
                          Remove
                        </button>
                        <input
                          type="hidden"
                          name="gameToRemove"
                          value=${game.game_id}
                        />
                      </form>
                    </td>
                  </tr>`
              )}
            </tbody>
          </table>
        </div>
      </div>
    `,
    postContent: html`<script>
        $(document).ready(function () {
          $("#games").bootstrapTable();
        });
      </script>

      <script type="module">
        document
          .getElementById("addGameForm")
          .addEventListener("submit", async (e) => {
            if (e.submitter.name !== "gamePreprocess") {
              return;
            }
            e.preventDefault(); // Don't let the form do a full page refresh

            const form = e.target;
            const formData = new FormData(form);
            const body = new URLSearchParams(formData);

            const response = await fetch(
              "/admin/games/calculate-game-results",
              {
                method: "POST",
                body: body,
              }
            );
            const data = await response.json();

            if (!data.ok) {
              document.getElementById("submit-button").disabled = true;
            } else {
              document.getElementById("submit-button").disabled = false;
            }

            document.getElementById("modal-body").innerHTML = data.html;

            // Show the modal (using Bootstrap)
            const modalElement = document.getElementById("gameResultModal");
            // const modal = new bootstrap.Modal(modalElement);

            modalElement.show();
          });
      </script>`,
  });
  return htmlContent;
}

export function gameResultConfirmation(
  results: GameResult[],
  semester: string
) {
  const htmlContent = html`
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
            ${results.map(
              (result) => html`
                <tr>
                  <td>${result.player_name}</td>
                  <td>${result.score}</td>
                  <td>${result.placement}</td>
                  <td>${result.starting_wind ?? ""}</td>
                  <td>
                    ${result.point_change < 0
                      ? result.point_change
                      : `+${result.point_change}`}
                  </td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    </div>
  `;
  return htmlContent;
}
