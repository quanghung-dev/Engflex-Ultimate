// Typed client for the Go API. Success or failure comes from the HTTP
// status; the envelope is {message, data[, pagination]}.
// Framework-agnostic: no router/query/auth imports here.
import type { ApiResponse, Pagination } from '@engflex/contracts'
import { authToken } from './auth-token.ts'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export { API_URL }

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  opts: ApiOptions = {},
): Promise<{ data: T; pagination?: Pagination }> {
  const { query, withCredentials = true } = opts
  const url = query ? withQuery(path, query) : path
  const token = withCredentials ? await authToken() : null
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  const body = (await res.json()) as ApiResponse
  if (!res.ok) {
    throw new ApiError(res.status, body.message || `Request failed (${res.status})`)
  }
  return { data: body.data as T, pagination: body.pagination }
}

/** Per-request options: `query` appends URL params; `withCredentials`
 *  (default true) attaches the session token when signed in. */
export interface ApiOptions {
  query?: Record<string, string | number>
  withCredentials?: boolean
}

/** Non-paginated request (single object, create, update, delete). */
export async function api<T>(
  path: string,
  init?: RequestInit,
  opts?: ApiOptions,
): Promise<T> {
  const { data } = await request<T>(path, init, opts)
  return data
}

/** Paginated list request. Throws if the response has no pagination meta. */
export async function apiPage<T>(
  path: string,
  init?: RequestInit,
  opts?: ApiOptions,
): Promise<{ items: T[]; pagination: Pagination }> {
  const { data, pagination } = await request<T[]>(path, init, opts)
  if (!pagination) {
    throw new ApiError(500, 'Expected a paginated response')
  }
  return { items: data, pagination }
}

/** Appends `page` / `pageSize` style params to a path. */
export function withQuery(
  path: string,
  params: Record<string, string | number>,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}
