import { PlayerType } from "../../lib/db-types.js";
import { PageLayout } from "../../lib/pageLayout.html.js";

export function gamesGeneral({
  players,
  resLocals,
}: {
  players?: PlayerType[];
  resLocals: Record<string, any>;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add User",
    content: ``,
  });
  return htmlContent;
}
