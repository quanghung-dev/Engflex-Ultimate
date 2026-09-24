import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { paraglideRequestMiddleware } from "./lib/paraglide-middleware";

const csrfMiddleware = createCsrfMiddleware({
	filter: (context) => context.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
	requestMiddleware: [
		paraglideRequestMiddleware,
		csrfMiddleware,
		clerkMiddleware(),
	],
}));
