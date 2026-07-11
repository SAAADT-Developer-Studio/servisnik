import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { getAppContext } from "../context.server";

function handleAuthRequest({
	context,
	request,
}: LoaderFunctionArgs | ActionFunctionArgs) {
	const { auth } = getAppContext(context);

	return auth.handler(request);
}

export const loader = handleAuthRequest;
export const action = handleAuthRequest;
