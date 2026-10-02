import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { hrefFor } from '../components/ContentCard'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState } from '../components/States'
import { api, errorMessage } from '../lib/api'
import { formatScore, isAbort, useTitle, voteCount } from '../lib/format'
import type { Profile } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

export default function ProfilePage() {
  useTitle('Perfil')
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [listName, setListName] = useState('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<Profile>('/api/me', { signal: controller.signal })
      .then(setProfile)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [user, attempt])

  async function createList(event: FormEvent) {
    event.preventDefault()
    try {
      await api.post('/api/shelves', { name: listName })
      setListName('')
      setAttempt((value) => value + 1)
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  async function removeList(id: number) {
    await api.del(`/api/shelves/${id}`)
    setAttempt((value) => value + 1)
  }

  if (!user) {
    return (
      <EmptyState
        title="Entra para ver tu perfil"
        body="Tus favoritos, listas, valoraciones e historial viven en tu cuenta."
        action={<Link className={primaryButton} to="/entrar?next=/perfil">Entrar</Link>}
      />
    )
  }

  return (
    <Reveal>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Perfil</p>
          <h1 className="mt-3 font-serif text-5xl">{profile?.displayName ?? user.displayName}</h1>
          <p className="mt-2 text-[var(--muted)]">@{user.username} · {user.email}</p>
        </div>
        <button className={ghostButton} type="button" onClick={() => void logout()}>Cerrar sesión</button>
      </div>
      {loading ? <div className="mt-8 h-40 animate-pulse rounded-3xl bg-white/10" /> : null}
      {error ? <div className="mt-8"><ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {profile ? (
        <div className="mt-10 space-y-10">
          <Block title="Valoraciones">
            {profile.ratings.length === 0 ? <p className="text-[var(--muted)]">Aún no valoras nada.</p> : null}
            <ul className="space-y-2">
              {profile.ratings.map((item) => (
                <li key={item.card.id}>
                  <Link to={hrefFor(item.card)}>{item.card.title}</Link>
                  <span className="text-[var(--muted)]"> · tu nota {item.score}/5 · media {formatScore(item.card.average)} ({voteCount(item.card.votes)})</span>
                  {item.opinion ? <span> · {item.opinion}</span> : null}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Favoritos">
            {profile.favorites.length === 0 ? <p className="text-[var(--muted)]">Sin favoritos.</p> : null}
            <ul className="space-y-2">
              {profile.favorites.map((card) => (
                <li key={card.id}><Link to={hrefFor(card)}>{card.title}</Link></li>
              ))}
            </ul>
          </Block>
          <Block title="Guardados">
            {profile.saved.length === 0 ? <p className="text-[var(--muted)]">Nada guardado todavía.</p> : null}
            <ul className="space-y-2">
              {profile.saved.map((item) => (
                <li key={item.id}><Link to={hrefFor(item.card)}>{item.card.title}</Link></li>
              ))}
            </ul>
          </Block>
          <Block title="Listas">
            <form className="mb-4 flex gap-2" onSubmit={(event) => void createList(event)}>
              <input className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-2" placeholder="Nombre de la lista" value={listName} onChange={(event) => setListName(event.target.value)} maxLength={40} />
              <button className={primaryButton} type="submit">Crear</button>
            </form>
            {profile.shelves.map((shelf) => (
              <div key={shelf.id} className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl">{shelf.name}</h3>
                  <button className={ghostButton} type="button" onClick={() => void removeList(shelf.id)}>Borrar lista</button>
                </div>
                <ul className="mt-2 space-y-1">
                  {shelf.items.map((card) => (
                    <li key={card.id} className="flex items-center justify-between gap-3">
                      <Link to={hrefFor(card)}>{card.title}</Link>
                      <button className="text-sm text-[var(--muted)]" type="button" onClick={() => void api.del(`/api/shelves/${shelf.id}/items/${card.id}`).then(() => setAttempt((value) => value + 1))}>Quitar</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Block>
          <Block title="Historial">
            {profile.history.length === 0 ? <p className="text-[var(--muted)]">El historial aparece cuando abres una ficha con la sesión iniciada.</p> : null}
            <ul className="space-y-2">
              {profile.history.map((item) => (
                <li key={`${item.card.id}-${item.viewedAt}`}><Link to={hrefFor(item.card)}>{item.card.title}</Link></li>
              ))}
            </ul>
          </Block>
        </div>
      ) : null}
    </Reveal>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${panel} p-5`}>
      <h2 className="font-serif text-3xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}
