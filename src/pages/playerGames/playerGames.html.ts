import { html } from "../../../packages/html/dist/index.js";
import {
  PageLayout,
  SemesterPageLocals,
} from "../../components/pageLayout.html.js";
import { playerLink } from "../../components/playerLink.html.js";
import { PlayerProfile } from "../../lib/playerProfile.js";
import { rankNames } from "../../lib/rankRules.js";
import {
  getPlayerPointChange,
  getPlayerRateChange,
} from "../../lib/gamesTable.js";

const decimal = (n: number | null | undefined, places = 2) =>
  n == null ? "—" : n.toFixed(places);
const score = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 1 });
const signedRate = (n: number | null) =>
  n === null
    ? "—"
    : `${n >= 0.005 ? "+" : ""}${Math.abs(n) < 0.005 ? "0.00" : n.toFixed(2)}`;
const signedIndex = (n: number) => {
  const rounded = Math.round(Math.abs(n));
  return rounded ? `${n > 0 ? "+" : "−"}${rounded}` : "0";
};

export function playerGames({
  profile: p,
  resLocals,
}: {
  profile: PlayerProfile;
  resLocals: SemesterPageLocals;
}) {
  const semester = resLocals.semester;
  const id = String(p.player.id);
  const s = p.stats;
  const r = p.promotion;
  const rank = Number(p.player.rank_index);
  const metrics = [
    ["Campus rank", s ? `#${s.campus_rank}` : "Unranked"],
    ["Games played", String(s?.games ?? 0)],
    ["Total PT", decimal(s?.points ?? 0, 1)],
    ["Avg. placement", decimal(s?.average_placement)],
    ["Highest score", score(s?.highest_score)],
    ["Avg. score", score(s?.average_score)],
  ];
  const recentGroups = Array.from(
    { length: Math.ceil(r.recent.length / 5) },
    (_, i) => r.recent.slice(i * 5, i * 5 + 5).join(""),
  );
  return PageLayout({
    resLocals,
    pageTitle: `${p.player.player_name} · ${semester}`,
    headContent: html`<link rel="stylesheet" href="/assets/profile.css" />
      <script defer src="/assets/profile.js"></script>`,
    content: html`<div class="player-profile">
      <a class="profile-back" href="/semester/${semester}/players"
        >← Player rankings</a
      >
      <header class="profile-header">
        <div>
          <p class="eyebrow">PLAYER PROFILE · ${semester}</p>
          <h1>${p.player.player_name}</h1>
          <p class="profile-rate">
            All-time Rate
            <strong>${p.rating ? Math.round(p.rating.rate) : "—"}</strong
            ><span> · ${p.rating?.games ?? 0} recorded games</span>
          </p>
        </div>
        <div class="rank-badge">
          <span>Current rank</span
          ><strong>${rankNames[rank] ?? "Unknown"}</strong>
        </div>
      </header>
      <div class="profile-metrics">
        ${metrics.map(
          ([label, value]) =>
            html` <section class="metric">
              <h2>${label}</h2>
              <strong>${value}</strong>
            </section>`,
        )}
      </div>
      <section
        class="profile-panel promotion-panel"
        aria-labelledby="promotion-heading"
      >
        <p class="eyebrow">NEXT MILESTONE</p>
        <h2 id="promotion-heading">
          ${r.requirement ? `Progress to ${rankNames[rank + 1]}` : "Highest rank reached"}
        </h2>
        <p class="compact-note">
          ${r.requirement ? `Based on your latest ${r.windowSize} games.` : "You have reached 十段."}
        </p>
        <div class="recent-results" aria-labelledby="recent-heading">
          <div class="section-title">
            <h3 id="recent-heading">Recent placements</h3>
            <span class="compact-note"
              >Oldest → newest · ${r.recent.length}/${r.windowSize}</span
            >
          </div>
          <div
            class="placement-sequence"
            aria-label="Recent placements, oldest to newest"
          >
            ${recentGroups.map((group) => html`<span>${group}</span>`)}
          </div>
          ${r.recent.length ? "" : html`<p class="compact-note">No games yet.</p>`}
        </div>
        ${
          r.requirement
            ? html`
                <div class="promotion-grid">
                  <div>
                    <h3>Games required</h3>
                    <strong
                      >${s?.games ?? 0}<small> / ${r.windowSize}</small></strong
                    >
                    <p>${r.missing ? `${r.missing} more needed` : "Met"}</p>
                  </div>
                  <div>
                    <h3>Window average</h3>
                    <strong
                      >${decimal(r.average)}<small>
                        / ≤${decimal(r.requirement.avg_placement)}</small
                      ></strong
                    >
                    <p>
                      ${r.missing ? "Incomplete window" : r.qualified ? "Met" : "Not yet met"}
                    </p>
                  </div>
                  <div>
                    <h3>Placement sum</h3>
                    <strong
                      >${r.sum}<small> / ≤${r.integerLimit}</small></strong
                    >
                    <p>
                      ${r.missing ? `${r.recent.length} results` : r.sumGap ? `${r.sumGap} above target` : "Met"}
                    </p>
                  </div>
                </div>
                <div class="promotion-outlook">
                  ${r.qualified ? html`<p class="compact-note">Conditions met; rank is checked on the next recorded game.</p>` : ""}
                  ${r.earliest ? html`<p class="earliest-result"><span>Earliest possible</span><strong>${r.earliest.games} ${r.earliest.games === 1 ? "game" : "games"} / sum ≤ ${Math.min(r.earliest.budget, 4 * r.earliest.games)}</strong>${r.earliest.guaranteed ? html`<span class="any-finish">Any finish</span>` : ""}</p>` : ""}
                  <details class="future-results">
                    <summary>Explore future results</summary>
                    <p class="compact-note">
                      More games / maximum new placement sum
                    </p>
                    <div
                      class="scenario-grid"
                      role="list"
                      aria-label="Promotion scenarios"
                      tabindex="0"
                    >
                      ${r.scenarios.map(
                        (x) =>
                          html` <div
                            role="listitem"
                            class="scenario ${x.possible ? "" : "not-possible"}"
                            title="${x.possible ? `${x.games} more games, placement sum at most ${Math.min(x.budget, 4 * x.games)}${x.guaranteed ? "; any finishes qualify" : ""}` : "Not possible yet"}"
                          >
                            <b>${x.games}</b><span>/</span
                            ><span
                              >${x.possible ? `≤ ${Math.min(x.budget, 4 * x.games)}` : "—"}</span
                            >
                          </div>`,
                      )}
                    </div>
                    <p class="compact-note">
                      — = not possible. Oldest results drop out first. Targets
                      apply to the next rank.
                    </p>
                  </details>
                </div>
              `
            : ""
        }
      </section>
      <section class="profile-panel" aria-labelledby="opponents-heading">
        <h2 id="opponents-heading">Head-to-head</h2>
        <p class="compact-note">
          All recorded semesters · sorted by rivalry index
        </p>
        <details class="stat-definitions">
          <summary>How to read these stats</summary>
          <dl>
            <dt>Rivalry index</dt>
            <dd>
              Shared games across all recorded semesters. Each game's PT gap is
              softened, then the average is steadied by ten neutral games.
              Positive: this opponent tends to lead you; negative: you tend to
              lead them.
            </dd>
            <dt>PT difference</dt>
            <dd>
              The raw sum of your opponent's PT minus your PT in shared games,
              including placement bonuses.
            </dd>
            <dt>Your win rate</dt>
            <dd>
              The percentage of games you played together where your placement
              was better than your opponent's.
            </dd>
            <dt>Avg. placement · shared games</dt>
            <dd>
              Your and your opponent's average placements, using only games you
              played together.
            </dd>
          </dl>
        </details>
        ${
          p.opponents.length
            ? html`<div class="table-responsive opponent-table-wrap">
                  <table class="table table-hover opponent-table">
                    <colgroup>
                      <col class="opponent-name-col" />
                      <col class="opponent-index-col" />
                      <col class="opponent-pt-col" />
                      <col class="opponent-games-col" />
                      <col class="opponent-win-col" />
                      <col class="opponent-average-col" />
                      <col class="opponent-average-col" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col" rowspan="2">Opponent</th>
                        <th scope="col" rowspan="2">Rivalry index</th>
                        <th scope="col" rowspan="2">PT difference</th>
                        <th scope="col" rowspan="2">Shared games</th>
                        <th scope="col" rowspan="2">Your win rate</th>
                        <th scope="colgroup" colspan="2">
                          Avg. placement · shared games
                        </th>
                      </tr>
                      <tr>
                        <th scope="col">You</th>
                        <th scope="col">Opponent</th>
                      </tr>
                    </thead>
                    <tbody id="opponent-rows">
                      ${p.opponents.map(
                        (o) =>
                          html`<tr>
                            <th scope="row" title="${o.name}">
                              ${playerLink(o.id, o.name, semester)}
                            </th>
                            <td
                              class="rivalry-value"
                              title="${o.rivalry_index > 0 ? "They lead you" : o.rivalry_index < 0 ? "You lead them" : "Even"}"
                            >
                              ${signedIndex(o.rivalry_index)}
                            </td>
                            <td>
                              ${o.rivalry_pt > 0 ? "+" : ""}${decimal(o.rivalry_pt, 1)}
                            </td>
                            <td>${o.meetings}</td>
                            <td
                              title="${o.wins} wins, ${o.ties} ties in ${o.meetings} shared games"
                            >
                              ${decimal((100 * o.wins) / o.meetings, 1)}%
                            </td>
                            <td>${decimal(o.my_average)}</td>
                            <td>${decimal(o.opponent_average)}</td>
                          </tr>`,
                      )}
                    </tbody>
                  </table>
                </div>
                <nav
                  class="module-pagination h2h-pagination"
                  id="h2h-pagination"
                  aria-label="Head-to-head pages"
                  data-page="1"
                  data-pages="${Math.ceil(p.opponents.length / 10)}"
                  hidden
                >
                  <span class="pagination-count"
                    >${p.opponents.length} opponents</span
                  >
                  <div class="pagination-controls"></div>
                </nav>`
            : html`<p>No shared individual games in the recorded history.</p>`
        }
      </section>
      <section class="profile-panel" aria-labelledby="history-heading">
        <div class="section-title">
          <h2 id="history-heading" tabindex="-1">Match history</h2>
        </div>
        <p class="compact-note">
          Newest first · tap a name to view their profile
        </p>
        <p
          class="history-load-status"
          id="history-load-status"
          role="status"
          aria-live="polite"
        ></p>
        ${playerHistoryContent({ games: p.games, page: p.page, pages: p.pages, count: s?.games ?? 0, id, semester })}
      </section>
    </div>`,
  });
}

export function playerHistoryContent({
  games,
  page,
  pages,
  count,
  id,
  semester,
}: {
  games: PlayerProfile["games"];
  page: number;
  pages: number;
  count: number;
  id: string;
  semester: string;
}) {
  return html`<div id="match-history-content">
    ${
      games.length
        ? html`<div class="table-responsive match-table-wrap">
              <table
                class="table table-hover match-table"
                aria-label="Match history"
              >
                <colgroup>
                  <col class="match-date-col" />
                  <col class="match-players-col" />
                  <col class="match-pt-col" />
                  <col class="match-rate-col" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Players & final scores</th>
                    <th scope="col">Your PT</th>
                    <th scope="col">Your Rate</th>
                  </tr>
                </thead>
                <tbody>
                  ${games.map(
                    (game) =>
                      html`<tr>
                        <td>${game.game_date}</td>
                        <td>
                          <div class="match-players">
                            ${[
                              game.player_1,
                              game.player_2,
                              game.player_3,
                              game.player_4,
                            ]
                              .filter((x) => x !== null)
                              .map(
                                (x) =>
                                  html` <div
                                    class="match-player ${String(x.player_id) === id ? "is-you" : ""}"
                                  >
                                    <span class="placement-label"
                                      >#${x.placement}</span
                                    >
                                    <span title="${x.player_name}"
                                      >${playerLink(String(x.player_id), x.player_name, semester)}<small
                                        class="d-block"
                                        >${score(Number(x.score))}</small
                                      ></span
                                    >
                                  </div>`,
                              )}
                          </div>
                        </td>
                        <td class="pt-value">
                          ${getPlayerPointChange(game, id) > 0 ? "+" : ""}${decimal(getPlayerPointChange(game, id), 1)}
                        </td>
                        <td class="pt-value">
                          ${signedRate(getPlayerRateChange(game, id))}
                        </td>
                      </tr>`,
                  )}
                  ${Array.from(
                    { length: Math.max(0, 10 - games.length) },
                    (_, index) =>
                      html`<tr class="match-empty-row" aria-hidden="true">
                        <td colspan="4">
                          ${index === 0 ? "End of records" : ""}
                        </td>
                      </tr>`,
                  )}
                </tbody>
              </table>
            </div>
            <nav
              class="module-pagination history-pagination"
              aria-label="Match history pages"
              data-page="${page}"
              data-pages="${pages}"
            >
              <span class="pagination-count">${count} games</span>
              <div class="pagination-controls">
                ${page > 1 ? html`<a href="?page=${page - 1}#history-heading">← Previous</a>` : html`<span></span>`}
                <span>Page ${page} of ${pages}</span>
                ${page < pages ? html`<a href="?page=${page + 1}#history-heading">Next →</a>` : html`<span></span>`}
              </div>
            </nav>`
        : html`<p>No matches yet.</p>`
    }
  </div>`;
}
