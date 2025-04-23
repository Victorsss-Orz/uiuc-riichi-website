import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";
import { GameInfo } from "../../lib/playerGames.js";
import { PlayerSemesterStats } from "../../lib/playerStats.js";

export function playerGames({
  info,
  resLocals,
}: {
  info: GameInfo[];
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
