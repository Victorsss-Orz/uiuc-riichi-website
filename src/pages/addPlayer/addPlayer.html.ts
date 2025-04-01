import { PlayerType } from "../../lib/db-types";

export function addPlayer(players: PlayerType[]) {
  const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Add User</title>
      </head>
      <body>
        <form id="userForm" action="/add_player" method="POST">
          <label for="playerName">Player Name:</label>
          <input type="text" id="playerName" name="playerName" required>
          <br>
          <button type="submit">Submit</button>
        </form>
        <div class="card">
          <div class="table-responsive">
            <table class="table table-sm table-hover" aria-label="Created players">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                ${players.map(
                  (row) => `
                  <tr>
                    <td>${row.id}</td>
                    <td>${row.player_name}</td>
                  </tr>
                  `,
                ).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
  `;
  return htmlContent;
}
