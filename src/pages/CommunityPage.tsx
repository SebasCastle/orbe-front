import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Rail } from '../components/ContentCard'
import { Reveal } from '../components/Reveal'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { api, errorMessage } from '../lib/api'
import { isAbort, useTitle } from '../lib/format'
import type { CommunityOverview, Post } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

export default function CommunityPage() {
  useTitle('Comunidad')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<CommunityOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<CommunityOverview>('/api/community', { signal: controller.signal })
      .then(setData)
      .catch((reason: unknown) => {
        if (isAbort(reason)) return
        setError(errorMessage(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])

  function requireUser() {
    if (user) return true
    navigate('/entrar?next=/comunidad')
    return false
  }

  async function publish(event: FormEvent) {
    event.preventDefault()
    if (!requireUser()) return
    setPending(true)
    try {
      await api.post('/api/community/posts', { title, body })
      setTitle('')
      setBody('')
      setAttempt((value) => value + 1)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function refresh() {
    setData(await api.get<CommunityOverview>('/api/community'))
  }

  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Comunidad Orbe</p>
      <h1 className="mt-3 font-serif text-5xl">Lo que se está mirando</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">Tendencias, lo mejor valorado y un foro corto. Solo puedes borrar lo que escribes tú.</p>
      {loading ? <div className="mt-10 h-40 animate-pulse rounded-3xl bg-white/10" /> : null}
      {error && !data ? <div className="mt-8"><ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} /></div> : null}
      {data ? (
        <>
          <Rail title="Tendencias" cards={data.trending} />
          <Rail title="Mejor valoradas" cards={data.topRated} />
          <Rail title="Más populares" cards={data.popular} />
          <section className="mt-12">
            <h2 className="font-serif text-3xl">Valoraciones recientes</h2>
            {data.recent.length === 0 ? <p className="mt-3 text-[var(--muted)]">Todavía no hay opiniones escritas.</p> : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.recent.map((item) => (
                <article key={`${item.username}-${item.updatedAt}`} className={`${panel} p-4`}>
                  <p className="text-sm text-[var(--accent)]">{item.displayName} · {item.score}/5</p>
                  <p className="mt-2">{item.opinion}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="mt-12">
            <h2 className="font-serif text-3xl">Foro</h2>
            {user ? (
              <form className={`${panel} mt-4 space-y-3 p-5`} onSubmit={(event) => void publish(event)}>
                <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
                <textarea className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="¿Qué estás viendo, leyendo o escuchando?" rows={3} value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} />
                <button className={primaryButton} type="submit" disabled={pending}>{pending ? 'Publicando…' : 'Publicar'}</button>
              </form>
            ) : (
              <p className={`${panel} mt-4 p-5 text-sm text-[var(--muted)]`}>
                Inicia sesión para publicar.{' '}
                <Link className="text-[var(--accent)]" to="/entrar?next=/comunidad">Entrar</Link>
              </p>
            )}
            {data.posts.length === 0 ? (
              <div className="mt-4"><EmptyState title="El foro está en silencio" body="Publica la primera nota." /></div>
            ) : null}
            <div className="mt-4 space-y-4">
              {data.posts.map((post) => (
                <PostCard key={post.id} post={post} onChange={() => void refresh()} requireUser={requireUser} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </Reveal>
  )
}

function PostCard({ post, onChange, requireUser }: { post: Post; onChange: () => void; requireUser: () => boolean }) {
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function like() {
    if (!requireUser()) return
    setPending(true)
    try {
      await api.post(`/api/community/posts/${post.id}/likes`)
      onChange()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!requireUser()) return
    setPending(true)
    try {
      await api.post(`/api/community/posts/${post.id}/comments`, { body: comment })
      setComment('')
      onChange()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    setPending(true)
    try {
      await api.del(`/api/community/posts/${post.id}`)
      onChange()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function removeComment(id: number) {
    setPending(true)
    try {
      await api.del(`/api/community/comments/${id}`)
      onChange()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <article className={`${panel} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">{post.title}</h3>
          <p className="text-sm text-[var(--muted)]">{post.displayName}</p>
        </div>
        {post.mine ? (
          <button className={ghostButton} type="button" disabled={pending} onClick={() => void remove()}>Borrar</button>
        ) : null}
      </div>
      <p className="mt-3 leading-7">{post.body}</p>
      <button className={`${ghostButton} mt-4`} type="button" disabled={pending} onClick={() => void like()}>
        {pending ? <Spinner /> : null}
        {post.liked ? 'Te gusta' : 'Me gusta'} · {post.likes}
      </button>
      <div className="mt-4 space-y-2">
        {post.comments.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2 text-sm">
            <p><span className="text-[var(--accent)]">{item.displayName}. </span>{item.body}</p>
            {item.mine ? (
              <button className="text-[var(--muted)]" type="button" onClick={() => void removeComment(item.id)}>Borrar</button>
            ) : null}
          </div>
        ))}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(event) => void send(event)}>
        <input className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-2" placeholder="Comentar" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} />
        <button className={ghostButton} type="submit" disabled={pending || !comment.trim()}>Enviar</button>
      </form>
      {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
      <Link className="sr-only" to="/comunidad">Foro</Link>
    </article>
  )
}
