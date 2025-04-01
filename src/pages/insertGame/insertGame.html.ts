import { Request, Response } from "express";

export function insertGame(req: Request, res: Response) {
  const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Page 1</title>
      </head>
      <body>
          <h1>Welcome to Page 1</h1>
          <a href="/p2">Go to Page 2</a>
      </body>
      </html>
  `;
  return htmlContent;
}
