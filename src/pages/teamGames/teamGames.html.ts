import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";
import { GameInfo, getTeamPointChange } from "../../lib/gamesTable.js";

export function teamGames({
  info,
  team_name,
  team_players,
  resLocals,
}: {
  info: GameInfo[];
  team_name: string;
  team_players: string[];
  resLocals: Record<string, any>;
}) {
  const semester = resLocals.semester;
  const team_id = parseInt(resLocals.team_id);
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Team Games",
    preContent: html``,
    content: html`
      <a
        href="/semester/${resLocals.semester}/teams"
        class="btn btn-sm btn-primary"
      >
        Back to teams
      </a>
      <div style="margin: 0 auto;">
        <h1>Team ${team_name}'s games ${semester}</h1>
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

                      ${game.player_1 &&
                      team_players.includes(game.player_1.player_id)
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_1?.player_name}
                          </td>`
                        : html`<td>${game.player_1?.player_name}</td>`}
                      <td>${game.player_1?.score}</td>

                      ${game.player_2 &&
                      team_players.includes(game.player_2.player_id)
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_2?.player_name}
                          </td>`
                        : html`<td>${game.player_2?.player_name}</td>`}
                      <td>${game.player_2?.score}</td>

                      ${game.player_3 &&
                      team_players.includes(game.player_3.player_id)
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_3?.player_name}
                          </td>`
                        : html`<td>${game.player_3?.player_name}</td>`}
                      <td>${game.player_3?.score}</td>

                      ${game.player_4 &&
                      team_players.includes(game.player_4.player_id)
                        ? html`<td style="color: blue; font-weight: bold;">
                            ${game.player_4?.player_name}
                          </td>`
                        : html`<td>${game.player_4?.player_name}</td>`}
                      <td>${game.player_4?.score}</td>

                      ${getTeamPointChange(game, team_players) < 0
                        ? html`<td style="color: green; font-weight: bold;">
                            ${getTeamPointChange(game, team_players)}
                          </td>`
                        : html`<td style="color: red; font-weight: bold;">
                            +${getTeamPointChange(game, team_players)}
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
