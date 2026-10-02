import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Poster } from '../components/Poster'
import { ContentCardView } from '../components/ContentCard'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState, LoadingGrid } from '../components/States'
import { api, errorMessage, withQuery } from '../lib/api'
import { isAbort, typeLabel, useTitle } from '../lib/format'
import type { ContentCard, SearchResponse } from '../types'
import { ghostButton, primaryButton } from '../ui'

const RECENT_KEY = 'orbe.recentSearches'

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 6) : []
  } catch {
    return []
  }
}

export default function CinemaPage() {
  useTitle('Cine')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const [draft, setDraft] = useState(query)
  const [recent, setRecent] = useState<string[]>(readRecent)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const reduce = useReducedMotion() ?? false

  useEffect(() => setDraft(query), [query])

  useEffect(() => {
    if (!query.trim()) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<SearchResponse>(withQuery('/api/cinema/search', { q: query, page }), { signal: controller.signal })
      .then((response) => {
        setData(response)
        const next = [query, ...readRecent().filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 6)
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
        setRecent(next)
      })
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setData(null)
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [query, page, attempt])

  function submit(value: string, nextPage = 1) {
    const trimmed = value.trim()
    if (!trimmed) return
    setParams(nextPage > 1 ? { q: trimmed, page: String(nextPage) } : { q: trimmed })
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 10)) : 1

  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Búsqueda</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Cine</h1>
      <p className="mt-4 max-w-xl text-[var(--muted)]">
        Escribe un título. Los resultados salen de OMDB y puedes guardarlos en tu biblioteca.
      </p>
      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          submit(draft)
        }}
      >
        <label className="sr-only" htmlFor="movie-search">
          Título
        </label>
        <input
          id="movie-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Up, Dune, The Office…"
          className="w-full rounded-full border border-white/15 bg-black/30 px-5 py-3 outline-none backdrop-blur placeholder:text-white/35"
        />
        <button className={primaryButton} type="submit">
          Buscar
        </button>
      </form>
      {recent.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {recent.map((item) => (
            <button key={item} className={ghostButton} type="button" onClick={() => submit(item)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-10">
        {!query.trim() ? (
          <MovieShelf />
        ) : loading ? (
          <LoadingGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        ) : data && data.results.length === 0 ? (
          <EmptyState title="Sin coincidencias" body="No encontré títulos con ese nombre. Prueba con otra palabra." />
        ) : data ? (
          <>
            <p className="mb-4 text-sm text-[var(--muted)]">
              {data.total} resultado{data.total === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.results.map((item, index) => (
                <motion.div
                  key={item.imdbId}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(index * 0.04, 0.24) }}
                >
                  <Link to={`/cine/${item.imdbId}`} className="group block">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <Poster src={item.poster} alt={item.title ?? 'Título'} className="aspect-[2/3] transition duration-300 group-hover:scale-[1.03]" />
                    </div>
                    <h2 className="mt-3 line-clamp-2 font-medium">{item.title}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {typeLabel(item.type)}
                      {item.year ? ` · ${item.year}` : ''}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-between">
                <button className={ghostButton} type="button" disabled={page <= 1} onClick={() => submit(query, page - 1)}>
                  Anterior
                </button>
                <span className="text-sm text-[var(--muted)]">
                  Página {page} de {totalPages}
                </span>
                <button
                  className={ghostButton}
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => submit(query, page + 1)}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Reveal>
  )
}

function MovieShelf() {
  const [cards, setCards] = useState<ContentCard[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    api
      .get<ContentCard[]>(withQuery('/api/catalog', { kind: 'MOVIE' }), { signal: controller.signal })
      .then(setCards)
      .catch((reason: unknown) => {
        if (!isAbort(reason)) setError(errorMessage(reason))
      })
    return () => controller.abort()
  }, [])
  if (error) return <ErrorState message={error} />
  if (cards.length === 0) {
    return <EmptyState title="Busca una película" body="El catálogo se llena al arrancar el servidor. Mientras tanto puedes buscar por título." />
  }
  return (
    <div>
      <h2 className="font-serif text-3xl">En el catálogo</h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => <ContentCardView key={card.externalId} card={card} />)}
      </div>
    </div>
  )
}
