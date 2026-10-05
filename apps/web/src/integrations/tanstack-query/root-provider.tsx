import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	// App-wide fetch policy: queries never retry. A failed request is final
	// for its render — each screen surfaces the failure itself (toast,
	// error modal, empty state) instead of hammering a broken endpoint
	// with backoff retries. Mutations already default to no retry.
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return {
		queryClient,
	};
}
export default function TanstackQueryProvider() {}
