import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { RatingGate } from '../components/RatingControl'
import { Reveal } from '../components/Reveal'
import { ErrorState, Spinner } from '../components/States'
import { api, errorMessage } from '../lib/api'
import { formatScore, isAbort, roman, useTitle, voteCount, yearOf } from '../lib/format'
import type { Film, RateResult } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

export default function FilmPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const filmId = Number(id)
  const valid = Number.isInteger(filmId) && filmId > 0
  const [film, setFilm] = useState<Film | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useTitle(film?.title ?? 'Episodio')

  useEffect(() => {
    if (!valid) {
      setLoading(false)
      setError('Ese número de película no es válido.')
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<Film>(`/api/starwars/films/${filmId}`, { signal: controller.signal })
      .then(setFilm)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [filmId, valid, attempt])

  async function toggle() {
    if (!film) return
    if (!user) {
      navigate(`/entrar?next=${encodeURIComponent(`/star-wars/${film.id}`)}`)
      return
    }
    setPending(true)
    setError(null)
    try {
      if (film.saved) {
        await api.del(`/api/starwars/films/${film.id}/library`)
        setFilm({ ...film, saved: false })
      } else {
        const updated = await api.post<Film>(`/api/starwars/films/${film.id}/library`)
        setFilm(updated)
      }
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function rate(score: number) {
    if (!film || !user) return
    setPending(true)
    setError(null)
    try {
      const result = await api.post<RateResult>('/api/ratings', {
        kind: 'FILM',
        externalId: String(film.id),
        title: film.title,
        year: film.releaseDate,
        creator: film.director,
        synopsis: film.openingCrawl,
        category: 'Star Wars',
        subtype: 'film',
        score,
      })
      setSummary(`Tu nota ${result.personalScore}/5 · promedio ${formatScore(result.average)} · ${voteCount(result.votes)}`)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-12 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-48 animate-pulse rounded-3xl bg-white/10" />
      </div>
    )
  }

  if (error && !film) return <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
  if (!film) return null

  return (
    <Reveal>
      <Link to="/star-wars" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        Volver al archivo
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
        {film.episodeId > 0 ? `Episodio ${roman(film.episodeId)}` : 'Archivo'}
        {yearOf(film.releaseDate) ? ` · ${yearOf(film.releaseDate)}` : ''}
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">{film.title}</h1>
      <p className="mt-4 text-[var(--muted)]">
        {film.director ?? 'Director desconocido'}
        {film.producer ? ` · Producción: ${film.producer}` : ''}
      </p>
      {error ? (
        <p className="mt-4 text-sm text-rose-200" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        <button className={film.saved ? ghostButton : primaryButton} type="button" disabled={pending} onClick={() => void toggle()}>
          {pending ? <Spinner /> : null}
          {film.saved ? 'Quitar de guardados' : 'Guardar película'}
        </button>
        <div className={`${panel} p-5`}>
          <h2 className="font-serif text-2xl">Valoración</h2>
          {summary ? <p className="mt-2 text-sm text-[var(--accent)]">{summary}</p> : null}
          <div className="mt-4">
            <RatingGate user={user} pending={pending} next={`/star-wars/${film.id}`} onRate={(score) => void rate(score)} />
          </div>
        </div>
      </div>
      <section className={`${panel} mt-8 p-6 sm:p-8`}>
        <p className="text-xs uppercase tracking-[0.22em] text-[#f6e2a2]">Apertura</p>
        <p className="mt-4 max-h-80 overflow-auto whitespace-pre-line font-serif text-lg italic leading-8 text-[#f6e7c1]">
          {film.openingCrawl ?? 'Esta ficha no incluye el texto de apertura.'}
        </p>
      </section>
    </Reveal>
  )
}
