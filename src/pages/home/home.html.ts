import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";

export function home({ resLocals }: { resLocals: Record<string, any> }) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Home",
    preContent: html``,
    content: html`<h1>Welcome to UIUC Riichi Mahjong Club</h1> `,
  });
  return htmlContent;
}
