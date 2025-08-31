import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";
import { teamSemesterStats } from "../../lib/stats.js";

export function teamStats({
  allStats,
  resLocals,
}: {
  allStats: teamSemesterStats[];
  resLocals: Record<string, any>;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Team Stats",
    preContent: html`<script src="/chart.js/chart.umd.js"></script>`,
    content: html`
      <div style="max-width: 800px; margin: 0 auto;">
        <h1>Team rankings ${resLocals.semester}</h1>
        ${allStats.length
          ? allStats.map(
              (stats) => html`
                <a
                  href="/semester/${resLocals.semester}/team/${stats.id}"
                  style="text-decoration: none;"
                >
                  <div
                    class="card"
                    style="
                  justify-content: center; 
                  margin-top: 1rem; 
                  padding-top: 1rem; 
                  padding-bottom: 1rem; 
                  flex-direction: row; 
                  gap: 2%;"
                  >
                    <div style="width: 60%">
                      <h4>${stats.name}</h4>
                      <div>Points: ${stats.points}</div>
                      <div>
                        Games Played:
                        ${stats.placements.reduce((acc, val) => acc + val, 0)}
                      </div>
                      <div>
                        Average Placement:
                        ${Math.round(stats.average_placement * 100) / 100}
                      </div>
                      <div>
                        Placement Percentages:
                        ${[1, 2, 3, 4]
                          .map(
                            (i) =>
                              `${i}: ${
                                Math.round(
                                  (1000 * stats.placements[i - 1]) /
                                    stats.placements.reduce(
                                      (acc, val) => acc + val,
                                      0
                                    )
                                ) / 10
                              }%`
                          )
                          .join(", ")}
                      </div>
                    </div>
                    <div style="width: 8%; margin-top: 3rem;"></div>
                    <div style="width: 20%;">
                      <canvas id="chartPlayer${stats.id}"></canvas>
                    </div>
                  </div>
                </a>
                ${chartScript(stats.placements, stats.id)}
              `
            )
          : html`<div>No games have been added for this semester</div>`}
      </div>
    `,
  });
  return htmlContent;
}

function chartScript(placements: number[], id: number) {
  return html`
    <script>
      document.addEventListener("DOMContentLoaded", function () {
        const ctx = document
          .getElementById("chartPlayer${id}")
          .getContext("2d");
        const myChart = new Chart(ctx, {
          type: "pie",
          data: {
            labels: [1, 2, 3, 4],
            datasets: [
              {
                backgroundColor: [
                  "rgb(0, 255, 0)",
                  "rgb(255, 255, 0)",
                  "rgb(255, 123, 0)",
                  "rgb(255, 0, 0)",
                ],
                data: [${placements.map((p) => `${p}`).join(",")}],
              },
            ],
          },
          options: {
            plugins: {
              legend: { display: false },
            },
          },
        });
      });
    </script>
  `;
}
