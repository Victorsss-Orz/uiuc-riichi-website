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
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${pageTitle}</title>
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
