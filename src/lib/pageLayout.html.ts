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
  headContent?: string;
  /** The content of the page in the body before the main container. */
  preContent?: string;
  /** The main content of the page within the main container. */
  content: string;
  /** The content of the page in the body after the main container. */
  postContent?: string;
}) {
  return `
  <!DOCTYPE html>
      <html lang="en">
      <head>
          ${HeadContents(pageTitle)}
      </head>
      <body>
        ${preContent ?? ""}
        <main
          id="content"
          class="container-fluid mb-4 flex-grow-1"
        >
          ${content}
        </main>
        ${postContent ?? ""}
      </body>
      </html>
  `;
}

function navBar({ isAdmin }: { isAdmin: boolean }) {
  return `
  <nav class="navbar navbar-dark bg-dark navbar-expand-md" aria-label="Global navigation">
    <div class="container-fluid">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="news.asp">News</a></li>
        <li><a href="contact.asp">Contact</a></li>
        <li><a href="about.asp">About</a></li>
      </ul>
    </div>
  </nav>
  `;
}

export function HeadContents(title: string) {
  return `
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>

    <script src="/bootstrap/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css">
    <script src="/jquery/jquery.min.js"></script>
  `;
}
// <link href="${'../../node_modules/bootstrap/dist/css/bootstrap.min.css'}" rel="stylesheet" />
//     <link
//       href="${'../../node_modules/bootstrap-icons/font/bootstrap-icons.css'}"
//       rel="stylesheet"
//     />
//     <script src="${('../../node_modules/jquery/dist/jquery.min.js')}"></script>
//     <script src="${('../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js')}"></script>
