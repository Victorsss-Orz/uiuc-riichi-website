import { PageLayout } from "../../../components/pageLayout.html.js";
import { Modal } from "../../../components/modal.html.js";
import { html } from "../../../../packages/html/dist/index.js";

export function teams({
  resLocals,
  semester,
}: {
  resLocals: Record<string, any>;
  semester?: string;
}) {
  const htmlContent = PageLayout({
    resLocals,
    pageTitle: "Teams",
    content: html`
      <div style="margin-top: 1rem; margin-bottom: 1rem;">
        <h1>Manage teams</h1>
      </div>
      <form id="selectSemesterForm" method="GET">
        <div style="line-height: 2rem; margin-bottom: 1rem;">
          <label for="semester">Select semester:</label>
          <select
            name="semester"
            id="semester"
            style="width: 80px; overflow: hidden;"
            onchange="this.form.submit()"
          >
            ${!semester ? html`<option selected></option>` : ""}
            ${resLocals.semesters.map(
              (row: string) =>
                html`<option value=${row} ${semester == row ? "selected" : ""}>
                  ${row}
                </option>`
            )}
          </select>
        </div>
      </form>
      ${semester
        ? html`<div class="card" style="padding: 1rem;">
            <form id="addTeamForm" method="POST">
              <label for="teamName">Team Name:</label>
              <input type="text" id="teamName" name="teamName" required />
              <button
                type="submit"
                name="__action"
                value="add"
                class="btn btn-primary"
              >
                Add
              </button>
            </form>
          </div>`
        : ""}
    `,
  });
  return htmlContent;
}
