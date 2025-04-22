import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";
import { PlayerSemesterStats } from "../../lib/playerStats.js";

export function playerGames({
  games,
  resLocals,
}: {
  games: any[];
  resLocals: Record<string, any>;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add User",
    preContent: html``,
    content: html``,
  });
  return htmlContent;
}
