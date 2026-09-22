let getToken: (() => Promise<string | null>) | null = null

export function registerTokenGetter(
  fn: (() => Promise<string | null>) | null,
) {
  getToken = fn
}

/** Session token for non-component call sites (api.ts). Null when signed out.
 *  Mounted auth provider registers its getToken once at startup. */
export async function authToken(): Promise<string | null> {
  return getToken?.() ?? null
}
