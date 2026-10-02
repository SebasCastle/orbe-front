import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { Poster } from '../components/Poster'
import { RatingGate } from '../components/RatingControl'
import { Reveal } from '../components/Reveal'
import { ErrorState, Spinner } from '../components/States'
import { Opinions } from './BookPage'
import { api, errorMessage } from '../lib/api'
import { formatScore, isAbort, typeLabel, useTitle, voteCount } from '../lib/format'
import type { LibraryItem, Opinion, RateResult, TitleDetail } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

export default function TitlePage() {
  const { imdbId = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const valid = /^tt\d+$/.test(imdbId)
  const [detail, setDetail] = useState<TitleDetail | null>(null)
  const [opinions, setOpinions] = useState<Opinion[]>([])
  const [opinion, setOpinion] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useTitle(detail?.title ?? 'Detalle')

  useEffect(() => {
    if (!valid) {
      setLoading(false)
      setError('El identificador de IMDb no es válido.')
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<TitleDetail>(`/api/cinema/titles/${imdbId}`, { signal: controller.signal })
      .then((next) => {
        setDetail(next)
        if (user && next.title) {
          void api.post('/api/history', movieDraft(next)).catch(() => undefined)
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
  }, [imdbId, valid, attempt, user])

  useEffect(() => {
    if (!valid) return
    const controller = new AbortController()
    api
      .get<Opinion[]>(`/api/ratings?kind=MOVIE&externalId=${imdbId}`, { signal: controller.signal })
      .then(setOpinions)
      .catch(() => setOpinions([]))
    return () => controller.abort()
  }, [imdbId, valid, attempt])

  async function save() {
    if (!user) {
      navigate(`/entrar?next=${encodeURIComponent(`/cine/${imdbId}`)}`)
      return
    }
    setPending(true)
    setError(null)
    try {
      await api.post<LibraryItem>('/api/cinema/library', { imdbId })
      const fresh = await api.get<TitleDetail>(`/api/cinema/titles/${imdbId}`)
      setDetail(fresh)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function rate(score: number) {
    if (!detail?.title) return
    if (!user) {
      navigate(`/entrar?next=${encodeURIComponent(`/cine/${imdbId}`)}`)
      return
    }
    setPending(true)
    try {
      if (detail.libraryId) {
        await api.post(`/api/cinema/library/${detail.libraryId}/ratings`, { score, opinion })
      } else {
        await api.post<RateResult>('/api/ratings', { ...movieDraft(detail), score, opinion })
      }
      const fresh = await api.get<TitleDetail>(`/api/cinema/titles/${imdbId}`)
      setDetail(fresh)
      setOpinions(await api.get<Opinion[]>(`/api/ratings?kind=MOVIE&externalId=${imdbId}`))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function togglePlan() {
    if (!detail?.libraryId) return
    setPending(true)
    try {
      await api.patch(`/api/cinema/library/${detail.libraryId}`, { includedInPlan: !detail.includedInPlan })
      const fresh = await api.get<TitleDetail>(`/api/cinema/titles/${imdbId}`)
      setDetail(fresh)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-[280px_1fr]" aria-busy="true">
        <div className="aspect-[2/3] animate-pulse rounded-3xl bg-white/10" />
        <div className="space-y-4 pt-6">
          <div className="h-10 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
          <div className="h-24 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    )
  }

  if (error && !detail) return <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
  if (!detail) return null

  const facts = [
    detail.year,
    typeLabel(detail.type),
    detail.runtimeMinutes ? `${detail.runtimeMinutes} min` : 'Duración no disponible',
    detail.rated,
    detail.imdbRating ? `IMDb ${detail.imdbRating}` : null,
  ].filter(Boolean)

  return (
    <Reveal>
      <Link to="/cine" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        Volver a la búsqueda
      </Link>
      <div className="mt-6 grid items-start gap-8 md:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <Poster src={detail.poster} alt={detail.title ?? 'Título'} className="aspect-[2/3]" />
        </div>
        <div>
          <h1 className="font-serif text-5xl tracking-tight">{detail.title}</h1>
          <p className="mt-3 text-[var(--muted)]">{facts.join(' · ')}</p>
          {detail.director ? <p className="mt-2 text-sm">Dirección: {detail.director}</p> : null}
          {detail.genre ? <p className="mt-1 text-sm text-[var(--muted)]">{detail.genre}</p> : null}
          <p className="mt-6 max-w-2xl leading-7 text-[var(--ink)]/90">{detail.plot ?? 'Sin sinopsis disponible.'}</p>
          {detail.actors ? <p className="mt-4 text-sm text-[var(--muted)]">Reparto: {detail.actors}</p> : null}
          {error ? (
            <p className="mt-4 text-sm text-rose-200" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {detail.saved ? (
              <Link className={ghostButton} to="/biblioteca">
                En tu biblioteca
              </Link>
            ) : (
              <button className={primaryButton} type="button" onClick={() => void save()} disabled={pending}>
                {pending ? <Spinner /> : null}
                Guardar
              </button>
            )}
            <a className={ghostButton} href={`https://www.imdb.com/title/${detail.imdbId}`} target="_blank" rel="noreferrer">
              Ver en IMDb
            </a>
          </div>
          {detail.saved ? (
            <section className={`${panel} mt-8 p-5`}>
              <h2 className="font-serif text-2xl">Valoración</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {detail.totalRatings === 0
                  ? 'Sin votos todavía.'
                  : `Promedio ${formatScore(detail.averageRating)} · ${voteCount(detail.totalRatings)} · clasificación ${detail.classification}`}
                {detail.personalScore ? ` · tu nota ${detail.personalScore}` : ''}
              </p>
              {detail.recommendation ? <p className="mt-2 text-sm text-[var(--accent)]">{detail.recommendation}</p> : null}
              {user ? (
                <textarea className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" rows={3} maxLength={500} placeholder="Tu opinión, opcional. Volver a votar actualiza la nota." value={opinion} onChange={(event) => setOpinion(event.target.value)} />
              ) : null}
              <div className="mt-4">
                <RatingGate user={user} pending={pending} next={`/cine/${imdbId}`} onRate={(score) => void rate(score)} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={detail.includedInPlan} onChange={() => void togglePlan()} disabled={!detail.libraryId} />
                Incluida en mi plan
              </label>
            </section>
          ) : (
            <section className={`${panel} mt-8 p-5`}>
              <h2 className="font-serif text-2xl">Valoración</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {detail.totalRatings === 0
                  ? 'Sin votos todavía.'
                  : `Promedio ${formatScore(detail.averageRating)} · ${voteCount(detail.totalRatings)}`}
                {detail.personalScore ? ` · tu nota ${detail.personalScore}` : ''}
              </p>
              <div className="mt-4">
                <RatingGate user={user} pending={pending} next={`/cine/${imdbId}`} onRate={(score) => void rate(score)} />
              </div>
            </section>
          )}
          <Opinions opinions={opinions} />
        </div>
      </div>
    </Reveal>
  )
}

function movieDraft(detail: TitleDetail) {
  return {
    kind: 'MOVIE',
    externalId: detail.imdbId,
    title: detail.title,
    year: detail.year,
    creator: detail.director,
    imageUrl: detail.poster,
    synopsis: detail.plot,
    category: detail.genre,
    runtimeMinutes: detail.runtimeMinutes,
    sourceRating: detail.imdbRating,
    subtype: detail.type,
  }
}
