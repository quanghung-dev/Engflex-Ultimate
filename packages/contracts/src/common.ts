// Placeholder until `make contracts` generates this from Go.
// Shape mirrors internal/common: {message, data?, pagination?}.
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  message: string
  data?: T
  pagination?: Pagination
}
