import { html } from "../../packages/html/dist/index.js";
export function playerLink(id: string, name: string, semester: string) {
  return html`<a class="player-link" href="/semester/${semester}/player/${id}">${name}</a>`;
}
