import { PlayerMergePreview, MergeCandidate } from "../../../lib/playerMerge.js";
import { rankNames } from "../../../lib/rankRules.js";
import { PageLayout, PageLocals } from "../../../components/pageLayout.html.js";
import { html, HtmlSafeString } from "../../../../packages/html/dist/index.js";

/** Search includes all semesters and zero-game accounts; IDs remain strings. */
function mergeForm(token: string, preview?: PlayerMergePreview): HtmlSafeString {
  return html`<section class="card p-3 my-3" aria-labelledby="merge-heading">
    <h2 id="merge-heading">Select accounts</h2>
    <p>Choose an existing main account, or enter its full Discord ID below to create or restore it.</p>
    <form action="/admin/players/merge-preview" method="post" data-player-merge>
      <input type="hidden" name="csrf" value="${token}" />
      <div class="row g-3">${["source", "target"].map(kind => {
        const player = kind === "source" ? preview?.source : preview?.target;
        return html`<div class="col-md-6" data-account-picker>
          <label class="form-label fw-semibold" for="merge-${kind}-search">${kind === "source" ? "Source account" : "Main account"}</label>
          <div class="merge-search">
            <input class="form-control" type="search" id="merge-${kind}-search" value="${player?.player_name ?? ""}"
              placeholder="Name or full Discord ID" autocomplete="off" maxlength="100" data-account-search
              aria-controls="merge-${kind}-results" />
            <div class="list-group merge-search-results" id="merge-${kind}-results" data-account-results aria-live="polite" hidden></div>
          </div>
          <label class="form-label small mt-2" for="merge-${kind}-id">${kind === "source" ? "Selected Discord ID" : "Main Discord ID (select or enter)"}</label>
          <input class="form-control" id="merge-${kind}-id" name="${kind}_id" type="text" inputmode="numeric"
            pattern="[1-9][0-9]*" maxlength="20" value="${player?.id ?? ""}" required data-account-id />
          <p class="small text-secondary mt-1 mb-0">${kind === "source" ? "Its results move to the main account before removal." : "Keeps all combined results."}</p>
        </div>`;
      })}</div>
      <fieldset class="mt-3">
        <legend class="fs-6 fw-semibold">Rank after merge</legend>
        <div class="form-check mb-2">
          <input class="form-check-input" type="radio" name="rank_mode" id="merge-rank-reset" value="reset" required
            ${!preview || preview.rankMode === "reset" ? "checked" : ""} />
          <label class="form-check-label" for="merge-rank-reset">Reset and recalculate
            <small class="d-block text-secondary">For alternate-account penalties. Start each semester at 5级 and check the latest games required for promotion.</small>
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="rank_mode" id="merge-rank-highest" value="highest"
            ${preview?.rankMode === "highest" ? "checked" : ""} />
          <label class="form-check-label" for="merge-rank-highest">Keep highest rank
            <small class="d-block text-secondary">For account recovery. Keep the higher existing rank in each semester.</small>
          </label>
        </div>
      </fieldset>
      <button class="btn btn-primary mt-3" type="submit">Preview merge</button>
    </form>
  </section>`;
}

export function mergeSearchResults(players: MergeCandidate[]): HtmlSafeString {
  return html`${players.slice(0, 20).map(p => html`<button class="list-group-item list-group-item-action" type="button"
    data-player-id="${p.id}" data-player-name="${p.player_name}"><strong>${p.player_name}</strong>
    <span class="d-block small">${p.id} · ${p.rate_games} games · Rate ${p.rate.toFixed(0)}</span></button>`)}
    ${players.length ? "" : html`<p class="small p-2 mb-0">No matching accounts.</p>`}
    ${players.length > 20 ? html`<p class="small p-2 mb-0">Refine your search to see more accounts.</p>` : ""}`;
}

function mergeSummary(p: PlayerMergePreview, token: string): HtmlSafeString {
  return html`<section class="card p-3 my-3" aria-labelledby="merge-preview-heading">
    <h2 id="merge-preview-heading">Preview merge</h2>
    <div class="merge-accounts">
      ${[p.source, p.target].map((player, index) => html`<div class="merge-account">
        <span class="small text-secondary">${index === 0 ? "Remove source account" : p.createTarget ? "Create main account" : "Keep main account"}</span>
        <strong>${player.player_name}</strong><span class="merge-account-id">${player.id}</span>
      </div>`)}
    </div>
    <p class="my-3">${p.moveGames} results will move into the main account.</p>
    ${p.createTarget ? html`<p class="alert alert-info">Account ${p.target.id} will be created using the name ${p.target.player_name}. No account is created until you confirm.</p>` : ""}
    ${p.previousTarget ? html`<div class="alert alert-warning">
      <p class="mb-1">Account ${p.target.id} currently redirects to ${p.previousTarget}. This redirect will be removed so the main account can receive results directly.</p>
      ${p.previousTarget === p.source.id ? "" : html`<p class="mb-0">Results already stored under ${p.previousTarget} will stay there.</p>`}
    </div>` : ""}
    <table class="table table-sm merge-comparison" aria-label="Merge results preview">
      <colgroup><col class="merge-metric" /><col /><col /><col /></colgroup>
      <thead><tr><th scope="col">Metric</th><th scope="col">Source</th><th scope="col">Main</th><th scope="col">After merge</th></tr></thead>
      <tbody>
        <tr class="merge-semester"><th colspan="4" scope="rowgroup">All time <small>Including team games</small></th></tr>
        <tr><th scope="row">Rate</th><td>${p.source.rate.toFixed(2)}</td><td>${p.target.rate.toFixed(2)}</td><td>${p.rate.toFixed(2)}</td></tr>
        <tr><th scope="row">Games</th><td>${p.source.rate_games}</td><td>${p.target.rate_games}</td><td>${p.games}</td></tr>
      </tbody>
      ${p.semesters.map(s => html`<tbody>
        <tr class="merge-semester"><th colspan="4" scope="rowgroup">${s.semester} <small>Individual games</small></th></tr>
        <tr><th scope="row">Games</th>${[s.source, s.target, s.merged].map(stats => html`<td>${stats.games}</td>`)}</tr>
        <tr><th scope="row">PT</th>${[s.source, s.target, s.merged].map(stats => html`<td>${stats.points.toFixed(1)}</td>`)}</tr>
        <tr><th scope="row">Rank</th>${[s.source, s.target, s.merged].map(stats => html`<td>${rankNames[stats.ranking] ?? "Unknown"}</td>`)}</tr>
      </tbody>`)}
    </table>
    <p class="small text-secondary">${p.rankMode === "reset"
      ? "Ranks are recalculated from 5级 in each semester using the latest games required for promotion."
      : "Each semester keeps the higher existing rank."} Team totals stay unchanged.</p>
    ${p.conflicts.length ? html`<div class="alert alert-danger"><strong>Merge blocked</strong><ul class="mb-0">${p.conflicts.map(c => html`<li>${c}</li>`)}</ul></div>` : html`
      <form action="/admin/players/merge" method="post">
        <input type="hidden" name="csrf" value="${token}" />
        <input type="hidden" name="source_id" value="${p.source.id}" />
        <input type="hidden" name="target_id" value="${p.target.id}" />
        <input type="hidden" name="expected_preview" value="${p.fingerprint}" />
        <input type="hidden" name="rank_mode" value="${p.rankMode}" />
        <label class="merge-confirm mb-3"><input type="checkbox" name="confirm" value="yes" required />
          <span>I confirm the Discord IDs above. Delete the source account and keep all combined results under the main account. There is no undo button.</span></label>
        <button class="btn btn-danger" type="submit">Confirm merge</button>
      </form>`}
  </section>`;
}

export function mergePreviewPage({ resLocals, token, preview, error }: {
  resLocals: PageLocals; token: string; preview?: PlayerMergePreview; error?: string;
}): string {
  return PageLayout({ resLocals, pageTitle: "Merge accounts",
    headContent: html`<link rel="stylesheet" href="/assets/player-merge.css" />`,
    postContent: html`<script src="/assets/player-merge.js" defer></script>`,
    content: html`<div class="merge-page"><a href="/admin/players">← Manage players</a>
      <h1 class="mt-3">Merge accounts</h1>
      ${error ? html`<p class="alert alert-danger mt-3" role="alert">${error}</p>` : ""}
      ${preview ? html`<details class="merge-change mt-3"><summary>Change accounts</summary>${mergeForm(token, preview)}</details>${mergeSummary(preview, token)}` : mergeForm(token)}
    </div>` });
}
