import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === 'Orbe' ? 'Orbe' : `${title} · Orbe`
  }, [title])
}

export function formatMinutes(total: number) {
  if (!total) return '0 min'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatScore(value: number) {
  return value.toLocaleString('es', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

export function voteCount(count: number) {
  return `${count} ${count === 1 ? 'voto' : 'votos'}`
}

export function typeLabel(type: string | null | undefined) {
  switch (type) {
    case 'movie':
      return 'Película'
    case 'series':
      return 'Serie'
    case 'episode':
      return 'Episodio'
    case 'game':
      return 'Juego'
    default:
      return type || 'Título'
  }
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export function roman(value: number) {
  return ROMAN[value] ?? String(value)
}

export function yearOf(date: string | null | undefined) {
  if (!date) return null
  const match = date.match(/\d{4}/)
  return match ? match[0] : date
}

export function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
