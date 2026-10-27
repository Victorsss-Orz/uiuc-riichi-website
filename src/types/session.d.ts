import "express-session";

declare module "express-session" {
  interface SessionData {
    playerMergeToken?: string;
    playerMergeNotice?: { targetId: string; games: number };
    isAdmin: false | true;
  }
}
