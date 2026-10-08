import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { ApiError } from "./api";

/**
 * Preload a query in a route `loader` with correct 404/error routing.
 * `throw notFound()` is only honored in loaders (and beforeLoad) — thrown
 * during render it escapes down the error-boundary path instead of rendering
 * the route's notFoundComponent, which is how an API outage once masqueraded
 * as a crash page. So: fetch here, render from the warm cache in components.
 *
 * A 404 from the API becomes notFound(); anything else rethrows to the
 * route's errorComponent (retryable). Pair with the same query options
 * object the component's useQuery uses so loader and component share one
 * cache key.
 *
 * No retries here: React Query's default retry (3 + exponential backoff)
 * would hang every navigation for seconds on an outage before any boundary
 * renders. Preloads fail fast to the retryable error page instead.
 */
export async function loadOr404<T, TKey extends readonly unknown[]>(
	queryClient: QueryClient,
	options: { queryKey: TKey; queryFn: () => Promise<T> },
): Promise<T> {
	try {
		return await queryClient.query({ ...options, retry: false });
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) {
			throw notFound();
		}
		throw error;
	}
}
