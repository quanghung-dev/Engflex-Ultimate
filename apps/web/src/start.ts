import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { localeMiddleware } from "./lib/locale-middleware";

const csrfMiddleware = createCsrfMiddleware({
	filter: (context) => context.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
	requestMiddleware: [localeMiddleware, csrfMiddleware, clerkMiddleware()],
}));
