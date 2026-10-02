import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AuthUser } from '../types'
import { primaryButton } from '../ui'
import { Spinner } from './States'

export function RatingControl({ onRate, pending }: { onRate: (score: number) => void; pending: boolean }) {
  const [score, setScore] = useState(3)
  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onRate(score)
      }}
    >
      <label className="flex min-w-48 flex-1 items-center gap-3 text-sm">
        <span className="text-[var(--muted)]">Nota</span>
        <input
          className="w-full accent-[var(--accent)]"
          type="range"
          min={1}
          max={5}
          step={1}
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
        />
        <span className="w-6 font-medium tabular-nums">{score}</span>
      </label>
      <button className={primaryButton} disabled={pending} type="submit">
        {pending ? <Spinner /> : null}
        Evaluar
      </button>
    </form>
  )
}

export function RatingGate({
  user,
  pending,
  next,
  onRate,
}: {
  user: AuthUser | null
  pending: boolean
  next: string
  onRate: (score: number) => void
}) {
  if (!user) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Inicia sesión para valorar de 1 a 5.{' '}
        <Link className="text-[var(--accent)]" to={`/entrar?next=${encodeURIComponent(next)}`}>
          Entrar
        </Link>
      </p>
    )
  }
  return <RatingControl pending={pending} onRate={onRate} />
}
