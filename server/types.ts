import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    username: string;
  };
  session: {
    userId?: string;
    username?: string;
  } & Express.Session;
}