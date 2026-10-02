import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { Poster } from '../components/Poster'
import { RatingControl } from '../components/RatingControl'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState, LoadingGrid } from '../components/States'
import { api, errorMessage, withQuery } from '../lib/api'
import { formatMinutes, formatScore, isAbort, typeLabel, useTitle, voteCount } from '../lib/format'
import type { LibraryItem, LibrarySummary } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

const sorts = [
  { id: 'name', label: 'Nombre' },
  { id: 'year', label: 'Año' },
  { id: 'rating', label: 'Nota' },
]

export default function LibraryPage() {
  useTitle('Biblioteca')
  const { user } = useAuth()
  const [sort, setSort] = useState('name')
  const [data, setData] = useState<LibrarySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setData(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<LibrarySummary>(withQuery('/api/cinema/library', { sort }), { signal: controller.signal })
      .then(setData)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [sort, attempt, user])

  async function rate(item: LibraryItem, score: number) {
    setPendingId(item.id)
    try {
      const updated = await api.post<LibraryItem>(`/api/cinema/library/${item.id}/ratings`, { score })
      setData((current) =>
        current ? { ...current, items: current.items.map((entry) => (entry.id === item.id ? updated : entry)) } : current,
      )
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPendingId(null)
    }
  }

  async function remove(item: LibraryItem) {
    if (!window.confirm(`¿Quitar “${item.title}” de tu biblioteca?`)) return
    setPendingId(item.id)
    try {
      await api.del(`/api/cinema/library/${item.id}`)
      setAttempt((value) => value + 1)
    } catch (reason) {
      setError(errorMessage(reason))
      setPendingId(null)
    }
  }

  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Guardados</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Biblioteca</h1>
      {!user ? (
        <div className="mt-8">
          <EmptyState
            title="Entra para ver tu biblioteca"
            body="Los títulos guardados y las notas son solo de tu cuenta."
            action={<Link className={primaryButton} to="/entrar?next=/biblioteca">Entrar</Link>}
          />
        </div>
      ) : (
      <>
      <p className="mt-4 max-w-xl text-[var(--muted)]">
        Tus títulos quedan guardados en tu cuenta. El tiempo total suma solo lo que guardaste tú, y el promedio sale de todos los votos.
      </p>
      {data && !loading ? (
        <div className={`${panel} mt-8 grid gap-4 p-5 sm:grid-cols-3`}>
          <Stat label="Títulos" value={String(data.count)} />
          <Stat label="Tiempo para verlo todo" value={formatMinutes(data.totalMinutes)} />
          <Stat label="Orden" value={sorts.find((item) => item.id === sort)?.label ?? 'Nombre'} />
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {sorts.map((item) => (
          <button
            key={item.id}
            type="button"
            className={sort === item.id ? primaryButton : ghostButton}
            onClick={() => setSort(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {loading ? (
          <LoadingGrid count={4} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="La biblioteca está vacía"
            body="Busca un título y guárdalo. Aquí verás la duración total y si entra en tus favoritos."
            action={
              <Link className={primaryButton} to="/cine">
                Buscar cine
              </Link>
            }
          />
        ) : data ? (
          <div className="grid gap-4">
            {error ? (
              <p className="text-sm text-rose-200" role="alert">
                {error}
              </p>
            ) : null}
            {data.items.map((item) => (
              <article key={item.id} className={`${panel} grid gap-5 p-4 sm:grid-cols-[120px_1fr]`}>
                <Link to={`/cine/${item.imdbId}`} className="overflow-hidden rounded-2xl">
                  <Poster src={item.poster} alt={item.title} className="aspect-[2/3] sm:aspect-auto sm:h-full" />
                </Link>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link to={`/cine/${item.imdbId}`} className="font-serif text-3xl hover:text-[var(--accent)]">
                        {item.title}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {typeLabel(item.type)}
                        {item.year ? ` · ${item.year}` : ''}
                        {item.runtimeMinutes ? ` · ${item.runtimeMinutes} min` : ' · duración no disponible'}
                        {item.includedInPlan ? ' · en tu plan' : ''}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[var(--accent)]">
                      {item.recommendation}
                    </span>
                  </div>
                  {item.plot ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{item.plot}</p> : null}
                  <p className="mt-3 text-sm">
                    {item.totalRatings === 0
                      ? 'Sin votos todavía.'
                      : `Promedio ${formatScore(item.averageRating)} · ${voteCount(item.totalRatings)} · clasificación ${item.classification}`}
                    {item.personalScore ? ` · tu nota ${item.personalScore}` : ''}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <RatingControl pending={pendingId === item.id} onRate={(score) => void rate(item, score)} />
                    <button className={ghostButton} type="button" disabled={pendingId === item.id} onClick={() => void remove(item)}>
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
      </>
      )}
    </Reveal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </div>
  )
}
