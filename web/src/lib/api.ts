// Zentrale API-Hilfsfunktion. Alle Anfragen laufen über den Vite-Proxy
// auf das Backend und schicken das Auth-Cookie automatisch mit.
import i18n from '../i18n'

export class ApiError extends Error {
  status: number
  // Vollständige Antwort des Servers, z. B. für Zusatzangaben wie retryAfterMinutes
  data: Record<string, unknown> | null
  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message)
    this.status = status
    this.data = data
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Grundlegende Anfrage
async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Antwort als JSON lesen (kann leer sein)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    // Bekannte Fehlercodes in der gewählten Sprache, sonst die Meldung des Servers
    const message = data?.code === 'stopped' ? i18n.t('control.stoppedMessage') : data?.error || `Fehler ${response.status}`
    throw new ApiError(message, response.status, data)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
