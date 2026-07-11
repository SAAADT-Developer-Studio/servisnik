import { createRequestHandler, RouterContextProvider } from "react-router";

import { appContext, createAppContext } from "../app/context.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(appContext, createAppContext(env, ctx));
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
