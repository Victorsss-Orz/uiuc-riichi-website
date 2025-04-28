import { PageLayout } from "../../../components/pageLayout.html.js";
import { Modal } from "../../../components/modal.html.js";
import { html } from "../../../../packages/html/dist/index.js";
import { TeamPlayerInformation } from "./teams.js";
import { PlayerRow } from "../../../lib/db-types.js";

export function teams({
  resLocals,
  semester,
  teamInfo,
  unassigned_players,
}: {
  resLocals: Record<string, any>;
  semester?: string;
  teamInfo: TeamPlayerInformation[];
  unassigned_players: PlayerRow[];
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Teams",
    preContent: html`<script src="/sortablejs/Sortable.js"></script>
      <style>
        .player {
          max-width: 100px;
          border: solid 1px;
          margin: 3px;
          cursor: pointer;
        }
        .player-selected {
          background-color: #f9c7c8;
          border: solid red 1px !important;
        }
        .col {
          height: 15rem;
          border: 2px solid rgba(39, 41, 43, 0.1);
          margin: auto 1.5% 5px;
        }
        .right-banner {
          width: 25%;
          height: 100vh;
          flex-direction: column;
        }
      </style>`,
    content: html`
      <div style="margin-top: 1rem; margin-bottom: 1rem;">
        <h1>Manage teams</h1>
      </div>
      <form id="selectSemesterForm" method="GET">
        <div style="line-height: 2rem; margin-bottom: 1rem;">
          <label for="semester">Select semester:</label>
          <select
            name="semester"
            id="semester"
            style="width: 80px; overflow: hidden;"
            onchange="this.form.submit()"
          >
            ${!semester ? html`<option selected></option>` : ""}
            ${resLocals.semesters.map(
              (row: string) =>
                html`<option value=${row} ${semester == row ? "selected" : ""}>
                  ${row}
                </option>`
            )}
          </select>
        </div>
      </form>
      ${semester
        ? html`
            <div class="card" style="padding: 1rem;">
              <form id="addTeamForm" method="POST">
                <label for="teamName">Team Name:</label>
                <input type="text" id="teamName" name="teamName" required />
                <button
                  type="submit"
                  name="__action"
                  value="add"
                  class="btn btn-primary"
                >
                  Add
                </button>
              </form>
              <div class="container" style="margin-top: 1rem;">
                <div class="row row-cols-6">
                  ${teamInfo.map(
                    (team) =>
                      html`<div
                        class="col team"
                        id="team-${team.id}"
                        data-team-id="${team.id}"
                      >
                        <h2>${team.team_name}</h2>
                        ${team.players.map(
                          (player) =>
                            html`<div
                              class="player"
                              data-player-id="${player.id}"
                            >
                              ${player.player_name}
                            </div>`
                        )}
                      </div>`
                  )}
                </div>
              </div>

              <div class="card team" id="team-unassigned" data-team-id="-1">
                <h2>Unassigned Players</h2>
                ${unassigned_players.map(
                  (player) =>
                    html`<div class="player" data-player-id="${player.id}">
                      ${player.player_name}
                    </div>`
                )}
              </div>
              <div onclick="submitTeamAssignment()">Save</div>
            </div>
          `
        : ""}
    `,
    postContent: html`
      ${teamInfo.map(
        (team) => html`<script>
          $(document).ready(function () {
            new Sortable(document.getElementById("team-${team.id}"), {
              group: "team",
              animation: 150,
              draggable: ".player",
              multiDrag: true,
              selectedClass: "player-selected",
            });
          });
        </script>`
      )}
      <script>
        $(document).ready(function () {
          new Sortable(document.getElementById("team-unassigned"), {
            group: "team",
            animation: 150,
            draggable: ".player",
            multiDrag: true,
            selectedClass: "player-selected",
          });
        });
        async function submitTeamAssignment() {
          const teams = {};
          const teamElements = $(".team").each(function () {
            const teamId = $(this).data("team-id");
            const players = [];
            $(this)
              .children(".player")
              .each(function () {
                players.push($(this).data("player-id"));
              });
            console.log(teamId, players);
            teams[teamId] = players;
          });
          await fetch(document.URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...teams, __action: "save_team" }),
          });
        }
      </script>
    `,
  });
  return htmlContent;
}
