import { PlayerType } from "../../lib/db-types.js";
import { PageLayout } from "../../components/pageLayout.html.js";

export function gamesGeneral({
  players,
  resLocals,
}: {
  players: PlayerType[];
  resLocals: Record<string, any>;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add User",
    content: `Here will be all the games for ${resLocals.semester}`,
  });
  return htmlContent;
}
