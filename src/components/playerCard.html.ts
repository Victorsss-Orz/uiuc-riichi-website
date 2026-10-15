import { html } from "../../packages/html/dist/index.js";
import { SeasonStats } from "../lib/playerProfile.js";

/** Shared by player rankings and search; an entire card opens the profile. */
export function playerCard(stats: SeasonStats, semester: string, position?: number) {
  const placements = stats.placements;
  const games = stats.games;
  let preceding = 0;
  const slices = placements.map((count, i) => {
    const start = preceding / games * Math.PI * 2 - Math.PI / 2;
    preceding += count;
    const end = preceding / games * Math.PI * 2 - Math.PI / 2;
    if (!count || !games) return "";
    if (count === games) return html`<circle class="slice-${i + 1}" cx="48" cy="48" r="45" />`;
    const point = (angle: number) => `${48 + 45 * Math.cos(angle)} ${48 + 45 * Math.sin(angle)}`;
    return html`<path class="slice-${i + 1}" d="M 48 48 L ${point(start)} A 45 45 0 ${count > games / 2 ? 1 : 0} 1 ${point(end)} Z" />`;
  });
  return html`<a class="player-card" href="/semester/${semester}/player/${stats.id}">
    <div class="player-card-heading"><h3><span class="campus-position">${position == null ? "—" : `#${position}`}</span>${stats.name}</h3>
      <span class="card-rank-rate"><span class="card-rank">${stats.ranking}</span><small>Rate ${Math.round(stats.rate)}</small></span></div>
    <div class="player-card-body">
    <div class="player-card-details"><dl class="player-card-stats"><div><dt>Total PT</dt><dd>${stats.points.toFixed(1)}</dd></div>
      <div><dt>Games played</dt><dd>${games}</dd></div>
      <div><dt>Avg. placement</dt><dd>${stats.average_placement.toFixed(2)}</dd></div></dl>
    ${games ? html`<div class="placement-breakdown">${placements.map((count, i) => html`<div class="placement-share" title="${count} ${count === 1 ? "game" : "games"}"><span><i class="slice-${i + 1}" aria-hidden="true"></i>${["1st", "2nd", "3rd", "4th"][i]}</span><strong>${(100 * count / games).toFixed(1)}%</strong></div>`)}</div>` : ""}
    </div>
    ${games ? html`<svg class="placement-pie" viewBox="0 0 96 96" aria-hidden="true" focusable="false">${slices}</svg>` : ""}
    </div>
  </a>`;
}
