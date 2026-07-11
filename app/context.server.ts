import { createContext, type RouterContextProvider } from "react-router";

import { createAuth, type Auth } from "./auth/auth.server";
import { createDb, type Db } from "./db/db.server";

export type AppContext = {
  env: Env;
  ctx: ExecutionContext;
  db: Db;
  auth: Auth;
};

export const appContext = createContext<AppContext>();

export function createAppContext(env: Env, ctx: ExecutionContext): AppContext {
  const db = createDb(env.DATABASE_URL);
  const auth = createAuth(env, db);

  return { env, ctx, db, auth };
}

export function getAppContext(context: Readonly<RouterContextProvider>) {
  return context.get(appContext);
}
