import type { ContactErrors, ContactPayload, Portfolio } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly errors: ContactErrors

  constructor(status: number, errors: ContactErrors = {}) {
    super(`API request failed with status ${status}`)
    this.status = status
    this.errors = errors
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, body as ContactErrors)
  return body as T
}

export function fetchPortfolio(): Promise<Portfolio> {
  return request<Portfolio>('/api/portfolio/')
}

export function sendContactMessage(payload: ContactPayload): Promise<{ ok: boolean }> {
  return request('/api/contact/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
