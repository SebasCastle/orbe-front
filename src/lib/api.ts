const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ErrorBody = { message?: string; code?: string }

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

  if (response.status === 401 && token && !isSpotifyPath(path)) {
    localStorage.removeItem('orbe.token')
    localStorage.removeItem('orbe.user')
    window.dispatchEvent(new Event('orbe-auth'))
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  const payload = text ? safeJson(text) : null
  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'No se pudo completar la solicitud.'
    throw new ApiError(message, response.status, typeof payload?.code === 'string' ? payload.code : null)
  }
  return payload as T
}

function isSpotifyPath(path: string) {
  return /^\/api\/(?:spotify\/|login(?:\?|$)|get-user-code(?:\?|$)|home(?:\?|$)|user-saved-album(?:\?|$)|user-top-songs(?:\?|$))/.test(path)
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

export function spotifyErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const message = spotifyStatusMessage(error.status)
    if (message) return message
    return error.message
  }
  return 'No se pudo completar la solicitud a Spotify.'
}

export function spotifyStatusMessage(status: number) {
  if (status === 400) return 'La solicitud a Spotify no es válida.'
  if (status === 401) return 'Tu autorización de Spotify expiró. Vuelve a conectar tu cuenta.'
  if (status === 403) return 'Esta cuenta de Spotify no está autorizada para esta demo.'
  if (status === 404) return 'El recurso de Spotify no fue encontrado.'
  if (status === 429) return 'Spotify está limitando temporalmente las solicitudes. Intenta nuevamente.'
  if (status >= 500 && status <= 599) return 'Spotify está teniendo problemas temporalmente. Intenta nuevamente.'
  return null
}
