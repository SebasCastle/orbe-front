import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { motion, useReducedMotion } from 'framer-motion'
import { Poster } from '../components/Poster'
import { MusicSearch } from '../components/MusicSearch'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState, LoadingGrid, Spinner } from '../components/States'
import { api, errorMessage, withQuery } from '../lib/api'
import { formatClock, isAbort, useTitle } from '../lib/format'
import type { AlbumPage, AuthUrl, SpotifyProfile, TrackCard } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

const STORAGE_KEY = 'orbe.spotifyUserId'

const ranges = [
  { id: 'short_term', label: 'Últimas semanas' },
  { id: 'medium_term', label: 'Últimos meses' },
  { id: 'long_term', label: 'Varios años' },
]

export default function SpotifyPage() {
  useTitle('Spotify')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)
  const [albums, setAlbums] = useState<AlbumPage | null>(null)
  const [tracks, setTracks] = useState<TrackCard[] | null>(null)
  const [range, setRange] = useState('medium_term')
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(STORAGE_KEY)))
  const [trackLoading, setTrackLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [morePending, setMorePending] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const reduce = useReducedMotion() ?? false
  const skipRangeReload = useRef(true)

  useEffect(() => {
    const id = params.get('userId')
    const failure = params.get('error')
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
      setUserId(id)
    }
    if (failure) setError(failure)
    if (id || failure) setParams({}, { replace: true })
  }, [params, setParams])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setProfile(null)
      setAlbums(null)
      setTracks(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([
      api.get<SpotifyProfile>(withQuery('/api/spotify/profile', { userId }), { signal: controller.signal }),
      api.get<AlbumPage>(withQuery('/api/spotify/albums', { userId, offset: 0 }), { signal: controller.signal }),
      api.get<TrackCard[]>(withQuery('/api/spotify/top-tracks', { userId, range }), { signal: controller.signal }),
    ])
      .then(([nextProfile, nextAlbums, nextTracks]) => {
        setProfile(nextProfile)
        setAlbums(nextAlbums)
        setTracks(nextTracks)
      })
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [userId, attempt])

  useEffect(() => {
    if (skipRangeReload.current) {
      skipRangeReload.current = false
      return
    }
    if (!userId) return
    const controller = new AbortController()
    setTrackLoading(true)
    api
      .get<TrackCard[]>(withQuery('/api/spotify/top-tracks', { userId, range }), { signal: controller.signal })
      .then(setTracks)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setTrackLoading(false)
      })
    return () => controller.abort()
  }, [range, userId])

  async function connect() {
    setConnecting(true)
    setError(null)
    try {
      const response = await api.get<AuthUrl>('/api/spotify/login')
      window.location.assign(response.authorizationUrl)
    } catch (reason) {
      setError(errorMessage(reason))
      setConnecting(false)
    }
  }

  async function disconnect() {
    if (userId) {
      try {
        await api.del(withQuery('/api/spotify/session', { userId }))
      } catch {
        // La sesión local se cierra aunque el servidor no responda.
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    setUserId(null)
    setProfile(null)
    setAlbums(null)
    setTracks(null)
    setError(null)
  }

  async function more() {
    if (!userId || !albums) return
    setMorePending(true)
    try {
      const next = await api.get<AlbumPage>(withQuery('/api/spotify/albums', { userId, offset: albums.albums.length }))
      setAlbums((current) =>
        current ? { ...next, albums: [...current.albums, ...next.albums] } : next,
      )
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setMorePending(false)
    }
  }

  if (!userId) {
    return (
      <Reveal>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Cuenta</p>
        <h1 className="mt-3 max-w-2xl font-serif text-5xl tracking-tight sm:text-6xl">Tu música, en este mismo ambiente.</h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          Orbe pide permiso para leer tu perfil, los álbumes que guardaste y tus canciones más escuchadas. Los tokens se quedan en el servidor.
        </p>
        {error ? (
          <p className="mt-6 max-w-xl text-sm text-rose-200" role="alert">
            {error}
          </p>
        ) : null}
        <MusicSearch />
        {user ? (
          <button className={`${primaryButton} mt-8`} type="button" onClick={() => void connect()} disabled={connecting}>
            {connecting ? <Spinner /> : null}
            Conectar Spotify
          </button>
        ) : (
          <Link className={`${primaryButton} mt-8`} to="/entrar?next=/spotify">
            Entra para conectar Spotify
          </Link>
        )}
      </Reveal>
    )
  }

  return (
    <Reveal>
      <MusicSearch />
      <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Spotify</p>
          <h1 className="mt-3 font-serif text-5xl tracking-tight">{profile?.displayName ?? 'Tu cuenta'}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {[profile?.email, productLabel(profile?.product)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button className={ghostButton} type="button" onClick={() => void disconnect()}>
          Cerrar sesión
        </button>
      </div>
      {loading ? (
        <div className="mt-10">
          <LoadingGrid count={4} />
        </div>
      ) : error && !profile ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        </div>
      ) : (
        <>
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-3xl">Canciones más oídas</h2>
              <div className="flex flex-wrap gap-2">
                {ranges.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={range === item.id ? primaryButton : ghostButton}
                    onClick={() => setRange(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {trackLoading ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Actualizando el periodo…</p>
            ) : null}
            {tracks && tracks.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="Sin canciones en este periodo" body="Spotify no devolvió un top para este rango." />
              </div>
            ) : (
              <ol className="mt-4 space-y-3">
                {tracks?.map((track, index) => (
                  <motion.li
                    key={track.id ?? index}
                    className={`${panel} flex flex-wrap items-center gap-4 p-3`}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(index * 0.03, 0.2) }}
                  >
                    <span className="w-6 text-center text-sm text-[var(--muted)]">{index + 1}</span>
                    <Poster src={track.imageUrl} alt={track.name ?? 'Canción'} className="h-14 w-14 rounded-xl" />
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{track.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {track.artists}
                        {track.albumName ? ` · ${track.albumName}` : ''}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-[var(--muted)]">{formatClock(track.durationMs)}</span>
                    {track.previewUrl ? <audio controls preload="none" src={track.previewUrl} className="h-9 max-w-full" /> : null}
                    {track.externalUrl ? (
                      <a className={ghostButton} href={track.externalUrl} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    ) : null}
                  </motion.li>
                ))}
              </ol>
            )}
          </section>
          <section className="mt-12">
            <h2 className="font-serif text-3xl">Álbumes guardados</h2>
            {albums && albums.albums.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No hay álbumes guardados" body="Cuando guardes álbumes en Spotify, aparecerán aquí." />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {albums?.albums.map((album, index) => (
                  <a
                    key={`${album.id ?? 'album'}-${index}`}
                    href={album.externalUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <Poster src={album.imageUrl} alt={album.name ?? 'Álbum'} className="aspect-square transition duration-300 group-hover:scale-[1.03]" />
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-medium">{album.name}</h3>
                    <p className="text-sm text-[var(--muted)]">
                      {album.artists}
                      {album.releaseDate ? ` · ${album.releaseDate.slice(0, 4)}` : ''}
                    </p>
                  </a>
                ))}
              </div>
            )}
            {albums && albums.albums.length < albums.total ? (
              <button className={`${ghostButton} mt-6`} type="button" disabled={morePending} onClick={() => void more()}>
                {morePending ? <Spinner /> : null}
                Cargar más
              </button>
            ) : null}
          </section>
        </>
      )}
    </Reveal>
  )
}

function productLabel(product?: string | null) {
  if (!product) return null
  return product.charAt(0).toUpperCase() + product.slice(1)
}
