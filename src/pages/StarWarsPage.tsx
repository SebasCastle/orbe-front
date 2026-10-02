import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState, LoadingGrid } from '../components/States'
import { api, errorMessage } from '../lib/api'
import { isAbort, roman, useTitle, yearOf } from '../lib/format'
import type { Film } from '../types'
import { panel } from '../ui'

export default function StarWarsPage() {
  useTitle('Star Wars')
  const [films, setFilms] = useState<Film[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const reduce = useReducedMotion() ?? false

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<Film[]>('/api/starwars/films', { signal: controller.signal })
      .then(setFilms)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])

  const saved = films?.filter((film) => film.saved).length ?? 0

  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Archivo</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Star Wars</h1>
      <p className="mt-4 max-w-xl text-[var(--muted)]">
        Los episodios llegan en orden de la historia. Abre uno para leer la apertura y guardarlo.
        {films ? ` ${saved} guardada${saved === 1 ? '' : 's'}.` : ''}
      </p>
      <div className="mt-10">
        {loading ? (
          <LoadingGrid count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        ) : films && films.length === 0 ? (
          <EmptyState title="El archivo no respondió" body="No llegaron películas. Reintenta en unos segundos." />
        ) : films ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {films.map((film, index) => (
              <motion.div
                key={film.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(index * 0.05, 0.3) }}
              >
                <Link to={`/star-wars/${film.id}`} className={`${panel} block h-full p-5 transition hover:-translate-y-1`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    {film.episodeId > 0 ? `Episodio ${roman(film.episodeId)}` : 'Archivo'}
                  </p>
                  <h2 className="mt-4 font-serif text-3xl">{film.title}</h2>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {film.director ?? 'Director desconocido'}
                    {yearOf(film.releaseDate) ? ` · ${yearOf(film.releaseDate)}` : ''}
                  </p>
                  {film.saved ? <p className="mt-4 text-xs uppercase tracking-[0.16em]">Guardada</p> : null}
                </Link>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </Reveal>
  )
}
