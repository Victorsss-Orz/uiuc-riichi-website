import { html } from "../../packages/html/dist/index.js";
import { RankingSort } from "../lib/playerRankings.js";
export function playerSearch(term: string, semester: string, sort: RankingSort = "pt") {
  return html`<form class="player-search" role="search" method="get" action="/semester/${semester}/players">
    <label class="visually-hidden" for="player-query">Player name</label>
    <input class="form-control" type="search" id="player-query" name="q" value="${term}" maxlength="100" placeholder="Find a player" />
    ${sort === "rate" ? html`<input type="hidden" name="sort" value="rate" />` : ""}
    <button class="btn btn-primary" type="submit">Search</button>
  </form>`;
}
