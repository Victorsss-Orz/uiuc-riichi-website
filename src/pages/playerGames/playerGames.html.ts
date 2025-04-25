import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";
import { GameInfo, getPlayerPointChange } from "../../lib/playerGames.js";
import { PlayerSemesterStats } from "../../lib/playerStats.js";

export function playerGames({
  info,
  player_name,
  resLocals,
}: {
  info: GameInfo[];
  player_name: string;
  resLocals: Record<string, any>;
}) {
  const semester = resLocals.semester;
  const player_id = parseInt(resLocals.player_id);
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add User",
    preContent: html``,
    content: html`
      <a
        href="/semester/${resLocals.semester}/individual"
        class="btn btn-sm btn-primary"
      >
        Back to players
      </a>
      <div style="margin: 0 auto;">
        <h1>${player_name}'s games ${semester}</h1>
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
                  <th>Point Change</th>
                </tr>
              </thead>
              <tbody>
                ${info.map(
                  (game) =>
                    html`<tr>
                      <td>${game.game_date}</td>

                      ${game.player_1?.player_id == player_id
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_1?.player_name}
                          </td>`
                        : html`<td>${game.player_1?.player_name}</td>`}
                      <td>${game.player_1?.score}</td>

                      ${game.player_2?.player_id == player_id
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_2?.player_name}
                          </td>`
                        : html`<td>${game.player_2?.player_name}</td>`}
                      <td>${game.player_2?.score}</td>

                      ${game.player_3?.player_id == player_id
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_3?.player_name}
                          </td>`
                        : html`<td>${game.player_3?.player_name}</td>`}
                      <td>${game.player_3?.score}</td>

                      ${game.player_4?.player_id == player_id
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_4?.player_name}
                          </td>`
                        : html`<td>${game.player_4?.player_name}</td>`}
                      <td>${game.player_4?.score}</td>

                      ${getPlayerPointChange(game, player_id) < 0
                        ? html`<td style="color: green; font-weight: bold;">
                            ${getPlayerPointChange(game, player_id)}
                          </td>`
                        : html`<td style="color: red; font-weight: bold;">
                            +${getPlayerPointChange(game, player_id)}
                          </td>`}
                    </tr>`
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    postContent: html`<script>
      $(document).ready(function () {
        $("#games").bootstrapTable();
      });
    </script>`,
  });
  return htmlContent;
}
