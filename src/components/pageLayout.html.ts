import { html, HtmlValue } from "../../packages/html/dist/index.js";

export function PageLayout({
  resLocals,
  pageTitle,
  headContent,
  preContent,
  content,
  postContent,
}: {
  /** The locals object from the Express response. */
  resLocals: Record<string, any>;
  /** The title of the page in the browser. */
  pageTitle: string;
  /** The information used to configure the navbar. */
  /** Include scripts and other additional head content here. */
  headContent?: HtmlValue;
  /** The content of the page in the body before the main container. */
  preContent?: HtmlValue;
  /** The main content of the page within the main container. */
  content: HtmlValue;
  /** The content of the page in the body after the main container. */
  postContent?: HtmlValue;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        ${HeadContents(pageTitle)}
      </head>
      <body>
        ${preContent ?? ""} ${navBar({ resLocals })}
        <main id="content" class="container-fluid mb-4 flex-grow-1">
          ${content}
        </main>
        ${postContent ?? ""}
      </body>
    </html>
  `;
}

function navBar({ resLocals }: { resLocals: Record<string, any> }) {
  return html`
    <nav
      class="navbar navbar-dark bg-dark navbar-expand-md mb-4 sticky-top"
      aria-label="Global navigation"
    >
      <div class="container-fluid">
        <a class="navbar-brand" href="/">UIUC Riichi</a>
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Semesters
            </a>
            <ul class="dropdown-menu">
              ${resLocals.semesters.map(
                (semester: any) =>
                  html`<li>
                    <a
                      class="dropdown-item"
                      href="/semester/${semester}/individual"
                      >${semester}</a
                    >
                  </li>`
              )}

              <li><hr class="dropdown-divider" /></li>
            </ul>
          </li>
          ${resLocals.isAdmin
            ? html`
                <li class="nav-item">
                  <a class="nav-link" href="/admin/games">Games</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="/admin/players">Players</a>
                </li>
              `
            : html`
                <li class="nav-item">
                  <a class="nav-link" href="/login">Admin Login</a>
                </li>
              `}
        </ul>
      </div>
    </nav>
  `.toString();
}

export function HeadContents(title: string) {
  return html`
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>

    <script src="/bootstrap/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css" />
    <script src="/jquery/jquery.min.js"></script>
    <script src="/bootstrap-table/bootstrap-table.min.js"></script>
    <link rel="stylesheet" href="/bootstrap-table/bootstrap-table.min.css" />
    <script src="/bootstrap-table/extensions/filter-control/bootstrap-table-filter-control.min.js"></script>
  `.toString();
}
