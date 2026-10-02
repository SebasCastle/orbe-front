import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ContentCardView } from '../components/ContentCard'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState, LoadingGrid } from '../components/States'
import { api, errorMessage, withQuery } from '../lib/api'
import { isAbort, useTitle } from '../lib/format'
import type { ContentCard } from '../types'
import { ghostButton, primaryButton } from '../ui'

const subjects = ['science fiction', 'fantasy', 'mystery', 'poetry', 'biography']

export default function BooksPage() {
  useTitle('Libros')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [draft, setDraft] = useState(query)
  const [cards, setCards] = useState<ContentCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => setDraft(query), [query])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const path = query.trim()
      ? withQuery('/api/books/search', { q: query })
      : withQuery('/api/catalog', { kind: 'BOOK' })
    api
      .get<ContentCard[]>(path, { signal: controller.signal })
      .then(setCards)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setCards([])
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [query, attempt])

  function submit(event: FormEvent) {
    event.preventDefault()
    setParams(draft.trim() ? { q: draft.trim() } : {})
  }

  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Open Library</p>
      <h1 className="mt-3 font-serif text-5xl">Libros</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">Fichas reales de Open Library. Guárdalas, favoritas y valóralas una sola vez.</p>
      <form className="mt-6 flex flex-wrap gap-2" onSubmit={submit}>
        <input className="min-w-[16rem] flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-3" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Título o autor" />
        <button className={primaryButton} type="submit">Buscar</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button key={subject} className={ghostButton} type="button" onClick={() => setParams({ q: subject })}>
            {subject}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {loading ? <LoadingGrid /> : null}
        {error ? <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} /> : null}
        {!loading && !error && cards.length === 0 ? (
          <EmptyState title="Sin libros todavía" body="Prueba otra búsqueda. El catálogo también se llena al arrancar el servidor." />
        ) : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {!loading && !error ? cards.map((card) => <ContentCardView key={card.externalId} card={card} />) : null}
        </div>
      </div>
    </Reveal>
  )
}
