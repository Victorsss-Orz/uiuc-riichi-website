import { PageLayout } from "../../components/pageLayout.html.js";
import { PlayerSemesterStats } from "../../lib/playerStats.js";

export function gamesGeneral({
  allStats,
  resLocals,
}: {
  allStats: PlayerSemesterStats[];
  resLocals: Record<string, any>;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add User",
    content: `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2>Player rankings ${resLocals.semester}</h2>
        ${allStats
          .map(
            (stats) => `
            <a href="/semesters/${resLocals.semester}/player/${stats.id}" style="text-decoration: none;">
              <div class="card" style="justify-content: center; margin-top: 1rem; padding: 1rem; flex-direction: row;">
                <div style="width: 65%">
                  <h4>${stats.name}</h4>
                  <div>Points: ${stats.points}</div>
                  <div>Games Played: ${stats.placements.reduce(
                    (acc, val) => acc + val,
                    0
                  )}</div>
                  <div>Average Placement: ${
                    Math.round(stats.average_placement * 100) / 100
                  }</div>
                  <div>Placement Percentages: ${[1, 2, 3, 4]
                    .map(
                      (i) =>
                        `${i}: ${
                          Math.round(
                            (1000 * stats.placements[i - 1]) /
                              stats.placements.reduce((acc, val) => acc + val, 0)
                          ) / 10
                        }%`
                    )
                    .join(", ")}</div>
                </div>
                <div style="width: 5%; color: red;">
                  ${stats.ranking}
                </div>
                <div style="width: 25%">
                  Chart will be placed here
                </div>
              </div>
            </a>
          `
          )
          .join("")}
      </div>
    `,
  });
  return htmlContent;
}
