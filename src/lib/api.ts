const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ErrorBody = { message?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('orbe.token')
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('No hay conexión con el servidor. ¿Está encendido el backend?', 0)
  }

  if (response.status === 401 && token) {
    localStorage.removeItem('orbe.token')
    localStorage.removeItem('orbe.user')
    window.dispatchEvent(new Event('orbe-auth'))
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  const payload = text ? safeJson(text) : null
  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'No se pudo completar la solicitud.'
    throw new ApiError(message, response.status)
  }
  return payload as T
}

function safeJson(text: string): ErrorBody | null {
  try {
    return JSON.parse(text) as ErrorBody
  } catch {
    return null
  }
}

export function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return 'No se pudo completar la solicitud.'
}
