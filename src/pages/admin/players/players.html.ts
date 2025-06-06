import { PlayerRow } from "../../../lib/db-types.js";
import { PageLayout } from "../../../components/pageLayout.html.js";
import { html } from "../../../../packages/html/dist/index.js";

export function addPlayer({
  players,
  resLocals,
}: {
  players: PlayerRow[];
  resLocals: Record<string, any>;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Manage players",
    content: html` <div style="margin-top: 1rem; margin-bottom: 1rem;">
        <h1>Manage players</h1>
      </div>
      <form id="addPlayerForm" method="POST">
        <label for="playerName">Player Name:</label>
        <input type="text" id="playerName" name="playerName" required />
        <br />
        <button
          type="submit"
          name="__action"
          value="add"
          class="btn btn-primary"
        >
          Submit
        </button>
      </form>

      <div style="margin-top: 1rem; margin-bottom: 1rem;">
        <h1>Players</h1>
      </div>

      <div class="card" style="margin-top: 1rem;">
        <div class="table-responsive">
          <table
            class="table table-sm table-hover"
            aria-label="Created players"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${players.map(
                (row) => html`
                  <tr>
                    <td>${row.id}</td>
                    <td>${row.player_name}</td>
                    <td>
                      <form name="removeUser${row.id}Form" method="POST">
                        <button
                          type="submit"
                          class="btn btn-danger"
                          name="__action"
                          value="remove"
                          data-toggle="tooltip"
                          data-placement="right"
                          title="Remove this player"
                        >
                          Remove
                        </button>
                        <input
                          type="hidden"
                          name="playerToRemove"
                          value=${row.id}
                        />
                      </form>
                    </td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>
      </div>`,
  });
  return htmlContent;
}
