import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { Poster } from '../components/Poster'
import { RatingGate } from '../components/RatingControl'
import { Reveal } from '../components/Reveal'
import { ErrorState, Spinner } from '../components/States'
import { api, errorMessage } from '../lib/api'
import { formatScore, isAbort, useTitle, voteCount } from '../lib/format'
import type { ContentCard, Opinion, RateResult, Shelf } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

export default function BookPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [card, setCard] = useState<ContentCard | null>(null)
  const [opinions, setOpinions] = useState<Opinion[]>([])
  const [opinion, setOpinion] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [shelfId, setShelfId] = useState('')
  const [attempt, setAttempt] = useState(0)
  useTitle(card?.title ?? 'Libro')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([
      api.get<ContentCard>(`/api/books/${id}`, { signal: controller.signal }),
      api.get<Opinion[]>(`/api/ratings?kind=BOOK&externalId=${encodeURIComponent(id)}`, { signal: controller.signal }),
    ])
      .then(([next, notes]) => {
        setCard(next)
        setOpinions(notes)
        if (user) {
          void api.post('/api/history', draft(next)).catch(() => undefined)
        }
      })
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, attempt, user])

  useEffect(() => {
    if (!user) {
      setShelves([])
      return
    }
    api.get<Shelf[]>('/api/shelves').then(setShelves).catch(() => setShelves([]))
  }, [user, attempt])

  function requireUser() {
    if (user) return true
    navigate(`/entrar?next=${encodeURIComponent(`/libros/${id}`)}`)
    return false
  }

  async function save() {
    if (!card || !requireUser()) return
    setPending(true)
    try {
      await api.post('/api/library', draft(card))
      setCard(await api.get<ContentCard>(`/api/books/${id}`))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function favorite() {
    if (!card || !requireUser()) return
    setPending(true)
    try {
      setCard(await api.post<ContentCard>('/api/favorites', draft(card)))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function rate(score: number) {
    if (!card || !requireUser()) return
    setPending(true)
    try {
      await api.post<RateResult>('/api/ratings', { ...draft(card), score, opinion })
      const [next, notes] = await Promise.all([
        api.get<ContentCard>(`/api/books/${id}`),
        api.get<Opinion[]>(`/api/ratings?kind=BOOK&externalId=${encodeURIComponent(id)}`),
      ])
      setCard(next)
      setOpinions(notes)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  if (loading) return <div className="h-80 animate-pulse rounded-3xl bg-white/10" />
  if (error && !card) return <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
  if (!card) return null

  return (
    <Reveal>
      <Link to="/libros" className="text-sm text-[var(--muted)]">Volver a libros</Link>
      <div className="mt-6 grid items-start gap-8 md:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <Poster src={card.imageUrl} alt={card.title} className="aspect-[2/3]" />
        </div>
        <div>
          <h1 className="font-serif text-5xl">{card.title}</h1>
          <p className="mt-3 text-[var(--muted)]">{[card.creator, card.year, card.category].filter(Boolean).join(' · ')}</p>
          <p className="mt-6 max-w-2xl leading-7">{card.synopsis ?? 'Sin sinopsis disponible.'}</p>
          <p className="mt-4 text-sm text-[var(--accent)]">
            {card.votes > 0 ? `Promedio ${formatScore(card.average)} · ${voteCount(card.votes)}` : 'Sin votos todavía'}
            {card.personalScore ? ` · tu nota ${card.personalScore}` : ''}
          </p>
          {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button className={primaryButton} type="button" disabled={pending} onClick={() => void save()}>
              {pending ? <Spinner /> : null}
              {card.saved ? 'En tu biblioteca' : 'Guardar'}
            </button>
            <button className={ghostButton} type="button" disabled={pending} onClick={() => void favorite()}>
              {card.favorite ? 'Quitar favorito' : 'Favorito'}
            </button>
            {shelves.length > 0 ? (
              <select
                className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm"
                value={shelfId}
                onChange={(event) => {
                  const next = event.target.value
                  setShelfId(next)
                  if (next) void api.post(`/api/shelves/${next}/items`, draft(card)).catch((reason) => setError(errorMessage(reason)))
                }}
              >
                <option value="">Añadir a una lista</option>
                {shelves.map((shelf) => (
                  <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
                ))}
              </select>
            ) : null}
          </div>
          <section className={`${panel} mt-8 p-5`}>
            <h2 className="font-serif text-2xl">Tu valoración</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Si ya la valoraste, la nueva nota reemplaza la anterior.</p>
            {user ? (
              <textarea className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" rows={3} maxLength={500} placeholder="Una opinión breve, opcional" value={opinion} onChange={(event) => setOpinion(event.target.value)} />
            ) : null}
            <div className="mt-4">
              <RatingGate user={user} pending={pending} next={`/libros/${id}`} onRate={(score) => void rate(score)} />
            </div>
          </section>
          <Opinions opinions={opinions} />
        </div>
      </div>
    </Reveal>
  )
}

export function Opinions({ opinions }: { opinions: Opinion[] }) {
  if (opinions.length === 0) return null
  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-serif text-2xl">Opiniones</h2>
      {opinions.map((item) => (
        <article key={`${item.username}-${item.updatedAt}`} className={`${panel} p-4`}>
          <p className="text-sm text-[var(--accent)]">{item.displayName} · {item.score}/5</p>
          <p className="mt-2">{item.opinion}</p>
        </article>
      ))}
    </section>
  )
}

function draft(card: ContentCard) {
  return {
    kind: card.kind,
    externalId: card.externalId,
    title: card.title,
    year: card.year,
    creator: card.creator,
    imageUrl: card.imageUrl,
    synopsis: card.synopsis,
    category: card.category,
    runtimeMinutes: card.runtimeMinutes,
    previewUrl: card.previewUrl,
    sourceRating: card.sourceRating,
    subtype: card.subtype,
  }
}
