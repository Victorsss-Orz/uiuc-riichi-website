import { PageLayout } from "../../../components/pageLayout.html.js";
import { Modal } from "../../../components/modal.html.js";
import { html } from "../../../../packages/html/dist/index.js";
import { TeamPlayerInformation } from "./teams.js";
import { Player } from "../../../lib/db-types.js";

export function teams({
  resLocals,
  semester,
  teamInfo,
  unassigned_players,
}: {
  resLocals: Record<string, any>;
  semester?: string;
  teamInfo: TeamPlayerInformation[];
  unassigned_players: Player[];
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Manage teams",
    preContent: html`<script src="/sortablejs/Sortable.js"></script>
      <style>
        .player {
          max-width: 10rem;
          font-size: 20px;
          border: solid 1px;
          margin: 3px;
          cursor: pointer;
          padding: 2px;
        }
        .player-selected {
          background-color: #f9c7c8;
          border: solid red 1px !important;
        }
        .team {
          height: 15rem;
          width: 13rem;
          border: 2px solid rgba(39, 41, 43, 0.1);
          margin: auto 1.5% 5px;
          padding: 8px;
        }
        .unassigned {
          height: 70%;
          width: 100%;
          min-width: 15rem;
          overflow: auto;
        }
        .right-banner {
          width: 25%;
          height: 100vh;
          flex-direction: column;
        }
      </style>`,
    content: html`
      <div style="width: 70%;">
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
                  html`<option
                    value=${row}
                    ${semester == row ? "selected" : ""}
                  >
                    ${row}
                  </option>`
              )}
            </select>
          </div>
        </form>
        ${semester
          ? html`
              <nav
                class="navbar bg-light position-fixed top-0 end-0 d-flex flex-column p-3"
                style="height: 100vh; width: 25%; z-index: 1000;"
              >
                <div
                  class="card team unassigned"
                  id="team-unassigned"
                  data-team-id="-1"
                >
                  <h3>Unassigned</h3>
                  ${unassigned_players.map(
                    (player) =>
                      html`<div class="player" data-player-id="${player.id}">
                        ${player.player_name}
                      </div>`
                  )}
                </div>
                <button
                  type="button"
                  class="btn btn-primary btn-lg"
                  onclick="submitTeamAssignment()"
                  title="Save current team assignment"
                >
                  Save
                </button>
              </nav>

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
                  <div class="row">
                    ${teamInfo.map(
                      (team) =>
                        html`<div
                          class="team"
                          id="team-${team.id}"
                          data-team-id="${team.id}"
                        >
                          <div
                            style="display: flex; flex-direction: row; align-items: center;"
                          >
                            <h5 class="me-3">${team.team_name}</h5>
                            <form name="removeTeam${team.id}Form" method="POST">
                              <button
                                type="submit"
                                class="btn btn-danger"
                                name="__action"
                                value="remove"
                                data-toggle="tooltip"
                                data-placement="right"
                                title="Remove this team"
                              >
                                Remove
                              </button>
                              <input
                                type="hidden"
                                name="teamToRemove"
                                value=${team.id}
                              />
                            </form>
                          </div>
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
              </div>
            `
          : ""}
      </div>
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
