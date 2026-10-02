import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useAtmosphere } from '../atmosphere'
import { Rail } from '../components/ContentCard'
import { Reveal } from '../components/Reveal'
import { api, errorMessage } from '../lib/api'
import { isAbort, useTitle } from '../lib/format'
import type { Atmosphere, HomeCatalog } from '../types'
import { panel } from '../ui'

const worlds: Array<{ to: string; atmosphere: Atmosphere; kicker: string; title: string; body: string }> = [
  { to: '/cine', atmosphere: 'cine', kicker: 'OMDB', title: 'Cine', body: 'Busca películas y series, guarda ficha y deja tu nota.' },
  { to: '/libros', atmosphere: 'books', kicker: 'Open Library', title: 'Libros', body: 'Un estante real de obras, autores y portadas.' },
  { to: '/star-wars', atmosphere: 'starwars', kicker: 'Archivo', title: 'Star Wars', body: 'Recorre los episodios y conserva los que quieras.' },
  { to: '/spotify', atmosphere: 'spotify', kicker: 'Escucha', title: 'Spotify', body: 'Tu música conectada y un catálogo de canciones.' },
  { to: '/comunidad', atmosphere: 'community', kicker: 'Juntos', title: 'Comunidad', body: 'Tendencias, opiniones y un foro breve.' },
  { to: '/perfil', atmosphere: 'profile', kicker: 'Tuyo', title: 'Perfil', body: 'Favoritos, listas, historial y tus valoraciones.' },
]

export default function HomePage() {
  useTitle('Orbe')
  const { preview } = useAtmosphere()
  const reduce = useReducedMotion() ?? false
  const [catalog, setCatalog] = useState<HomeCatalog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    api
      .get<HomeCatalog>('/api/catalog/home', { signal: controller.signal })
      .then(setCatalog)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
    return () => controller.abort()
  }, [])

  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Portafolio · Oracle ONE</p>
      <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
        El ambiente cambia con lo que miras.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
        Cine, libros, Star Wars y música, con valoraciones de toda la comunidad y un rincón que es solo tuyo.
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3" onMouseLeave={() => preview(null)}>
        {worlds.map((world, index) => (
          <motion.div
            key={world.to}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: reduce ? 0 : 0.06 * index }}
          >
            <Link
              to={world.to}
              className={`${panel} group block h-full p-6 transition hover:-translate-y-1`}
              onMouseEnter={() => preview(world.atmosphere)}
              onFocus={() => preview(world.atmosphere)}
              onBlur={() => preview(null)}
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{world.kicker}</p>
              <h2 className="mt-6 font-serif text-4xl">{world.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{world.body}</p>
              <span className="mt-8 inline-block text-sm text-[var(--ink)]">Entrar</span>
            </Link>
          </motion.div>
        ))}
      </div>
      {error ? <p className="mt-8 text-sm text-[var(--muted)]">{error}</p> : null}
      {catalog ? (
        <>
          <Rail title="Tendencias" cards={catalog.trending} />
          <Rail title="Cine" cards={catalog.movies} />
          <Rail title="Libros" cards={catalog.books} />
          <Rail title="Música" cards={catalog.tracks} />
          <Rail title="Star Wars" cards={catalog.films} />
        </>
      ) : null}
    </Reveal>
  )
}
