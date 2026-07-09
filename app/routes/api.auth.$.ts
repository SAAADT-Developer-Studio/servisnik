import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { createAuth } from "../auth/auth.server";

function handleAuthRequest({ context, request }: LoaderFunctionArgs | ActionFunctionArgs) {
	const auth = createAuth(context.cloudflare.env);

	return auth.handler(request);
}

export const loader = handleAuthRequest;
export const action = handleAuthRequest;
