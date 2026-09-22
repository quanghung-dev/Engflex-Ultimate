import { API_ROUTES } from '../../app/api-routes.ts'
import { api, apiPage, withQuery } from '../../lib/api.ts'
import type { Content, CreateContent } from '@engflex/contracts'

/** Paginated content list. Pattern for all domain services. */
export function listContents(page: number, pageSize: number) {
  return apiPage<Content>(withQuery(API_ROUTES.CONTENTS.LIST, { page, pageSize }))
}

/** Single content by ID. */
export function getContent(id: string) {
  return api<Content>(API_ROUTES.CONTENTS.BY_ID(id))
}

/** Create content (admin/seed path; difficulty derived server-side). */
export function createContent(payload: CreateContent) {
  return api<Content>(API_ROUTES.CONTENTS.LIST, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Delete content. */
export async function deleteContent(id: string): Promise<void> {
  await api<unknown>(API_ROUTES.CONTENTS.BY_ID(id), { method: 'DELETE' })
}
