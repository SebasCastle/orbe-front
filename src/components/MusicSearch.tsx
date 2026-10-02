import { FormEvent, useState } from 'react'
import { useAuth } from '../auth'
import { api, errorMessage, withQuery } from '../lib/api'
import { voteCount, formatScore } from '../lib/format'
import type { ContentCard, RateResult } from '../types'
import { primaryButton } from '../ui'
import { ContentCardView } from './ContentCard'
import { RatingGate } from './RatingControl'

export function MusicSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [cards, setCards] = useState<ContentCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      setCards(await api.get<ContentCard[]>(withQuery('/api/music/search', { q: query.trim() })))
    } catch (reason) {
      setCards([])
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  async function rate(card: ContentCard, score: number) {
    setPendingId(card.externalId)
    setError(null)
    try {
      const result = await api.post<RateResult>('/api/ratings', {
        kind: 'TRACK',
        externalId: card.externalId,
        title: card.title,
        year: card.year,
        creator: card.creator,
        imageUrl: card.imageUrl,
        category: card.category,
        previewUrl: card.previewUrl,
        subtype: 'song',
        score,
      })
      setNotes((current) => ({
        ...current,
        [card.externalId]: `Tu nota ${result.personalScore}/5 · promedio ${formatScore(result.average)} · ${voteCount(result.votes)}`,
      }))
      setCards((current) =>
        current.map((item) =>
          item.externalId === card.externalId
            ? { ...item, average: result.average, votes: result.votes, personalScore: result.personalScore }
            : item,
        ),
      )
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-serif text-3xl">Catálogo</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">Canciones reales de iTunes. Si entras, puedes valorarlas del 1 al 5.</p>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => void submit(event)}>
        <input className="min-w-[16rem] flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Canción o artista" />
        <button className={primaryButton} type="submit" disabled={loading}>{loading ? 'Buscando…' : 'Buscar'}</button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.externalId} className="rounded-3xl border border-white/10 p-3">
            <ContentCardView card={card} />
            {card.previewUrl ? <audio className="mt-2 w-full" controls src={card.previewUrl} preload="none" /> : null}
            <div className="mt-3">
              <RatingGate user={user} pending={pendingId === card.externalId} next="/spotify" onRate={(score) => void rate(card, score)} />
              {notes[card.externalId] ? <p className="mt-2 text-xs text-[var(--accent)]">{notes[card.externalId]}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
