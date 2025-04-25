import { html } from "../../../packages/html/dist/index.js";
import { PageLayout } from "../../components/pageLayout.html.js";

export function error({ resLocals }: { resLocals: Record<string, any> }) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Add User",
    preContent: html``,
    content: html`<h1>404 - Page Not Found</h1>
      <a href="/">Go back to Home</a>`,
  });
  return htmlContent;
}
