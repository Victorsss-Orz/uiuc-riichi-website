import { html } from "../../../packages/html/dist/index.js";
import {
  PageLayout,
  SemesterPageLocals,
} from "../../components/pageLayout.html.js";
import { SeasonStats } from "../../lib/playerProfile.js";
import { playerSearch } from "../../components/playerSearch.html.js";
import { playerCard } from "../../components/playerCard.html.js";
import { RankingSort } from "../../lib/playerRankings.js";

export function playerStats({
  allStats,
  term,
  sort,
  positions,
  hasMore,
  resLocals,
}: {
  allStats: SeasonStats[];
  term: string;
  sort: RankingSort;
  positions: Map<string, number>;
  hasMore: boolean;
  resLocals: SemesterPageLocals;
}) {
  const basePath = `/semester/${resLocals.semester}/players`;
  const searchQuery = term ? `q=${encodeURIComponent(term)}` : "";
  const ptHref = `${basePath}${searchQuery ? `?${searchQuery}` : ""}`;
  const rateHref = `${basePath}?sort=rate${searchQuery ? `&${searchQuery}` : ""}`;
  const clearHref = sort === "rate" ? `${basePath}?sort=rate` : basePath;
  return PageLayout({
    resLocals,
    pageTitle: "Player rankings",
    headContent: html`<link rel="stylesheet" href="/assets/profile.css" />
      <script src="/assets/player-search.js" defer></script>`,
    content: html`<div class="player-directory">
      <p class="eyebrow">UIUC RIICHI · ${resLocals.semester}</p>
      <h1>Player rankings</h1>
      ${playerSearch(term, resLocals.semester, sort)}
      ${term ? html`<div class="search-summary"><span>Results for “${term}”</span><a href="${clearHref}">Clear search</a></div>` : ""}
      <div class="rankings-sort">
        <span>Rank by</span>
        <nav class="rankings-sort-switch" aria-label="Ranking order">
          <a
            class="${sort === "pt" ? "is-active" : ""}"
            aria-current="${sort === "pt" ? "page" : "false"}"
            href="${ptHref}"
            >Season PT</a
          >
          <a
            class="${sort === "rate" ? "is-active" : ""}"
            aria-current="${sort === "rate" ? "page" : "false"}"
            href="${rateHref}"
            >All-time Rate</a
          >
        </nav>
      </div>
      <div class="player-cards">
        ${allStats.map((stats) => playerCard(stats, resLocals.semester, positions.get(stats.id)))}
      </div>
      ${allStats.length ? "" : html`<p>${term ? "No matching players in this semester." : "No games have been added for this semester."}</p>`}
      ${hasMore ? html`<p>Showing the first 50 matches. Refine your search to find more.</p>` : ""}
    </div>`,
  });
}
