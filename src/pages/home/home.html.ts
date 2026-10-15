import { html } from "../../../packages/html/dist/index.js";
import { PageLayout, PageLocals } from "../../components/pageLayout.html.js";

export function home({ resLocals }: { resLocals: PageLocals }) {
  const semesters = resLocals.semesters ?? [];
  return PageLayout({ resLocals, pageTitle: "UIUC Riichi Mahjong Club",
    headContent: html`<link rel="stylesheet" href="/assets/profile.css" />`,
    content: html`<div class="club-welcome"><p class="eyebrow">UIUC RIICHI MAHJONG CLUB</p>
      <h1>Welcome to UIUC Riichi.</h1>
      <p class="lead text-secondary">Choose a semester to explore player rankings and match results.</p>
      <nav class="semester-list" aria-label="Choose a semester">${semesters.map(semester => html`
        <a href="/semester/${semester}/players"><strong>${semester}</strong><span>${semester === resLocals.activeSemester ? "Current semester · " : ""}Player rankings →</span></a>`)}</nav>
      ${semesters.length ? "" : html`<p>No semesters have been added yet.</p>`}
    </div>` });
}
