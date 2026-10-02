import { Link } from 'react-router-dom'
import { Poster } from './Poster'
import type { ContentCard } from '../types'
import { formatScore, voteCount } from '../lib/format'

export function hrefFor(card: ContentCard) {
  if (card.kind === 'MOVIE') return `/cine/${card.externalId}`
  if (card.kind === 'BOOK') return `/libros/${card.externalId}`
  if (card.kind === 'FILM') return `/star-wars/${card.externalId}`
  return `/spotify?q=${encodeURIComponent(card.title)}`
}

export function ContentCardView({ card }: { card: ContentCard }) {
  return (
    <Link to={hrefFor(card)} className="group block">
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <Poster src={card.imageUrl} alt={card.title} className="aspect-[2/3] transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <h3 className="mt-3 line-clamp-2 font-medium leading-5">{card.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {[card.year, card.creator, card.category].filter(Boolean).slice(0, 2).join(' · ')}
      </p>
      <p className="mt-1 text-xs text-[var(--accent)]">
        {card.votes > 0 ? `Orbe ${formatScore(card.average)} · ${voteCount(card.votes)}` : 'Sin votos aún'}
        {card.personalScore ? ` · tu nota ${card.personalScore}` : ''}
      </p>
    </Link>
  )
}

export function Rail({ title, cards }: { title: string; cards: ContentCard[] }) {
  if (cards.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="font-serif text-3xl">{title}</h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.slice(0, 12).map((card) => (
          <ContentCardView key={`${card.kind}-${card.externalId}`} card={card} />
        ))}
      </div>
    </section>
  )
}
