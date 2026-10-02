import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { Reveal } from '../components/Reveal'
import { api, errorMessage } from '../lib/api'
import { useTitle } from '../lib/format'
import type { AuthResponse } from '../types'
import { ghostButton, panel, primaryButton } from '../ui'

export default function AuthPage() {
  useTitle('Entrar')
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/perfil'
  const [mode, setMode] = useState<'login' | 'register'>(params.get('modo') === 'registro' ? 'register' : 'login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body =
        mode === 'login'
          ? { email, password }
          : { username, email, password, displayName: displayName || username }
      const session = await api.post<AuthResponse>(path, body)
      setSession(session)
      navigate(next.startsWith('/') ? next : '/perfil')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <Reveal>
      <div className={`${panel} mx-auto max-w-md p-8`}>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Tu Orbe</p>
        <h1 className="mt-3 font-serif text-4xl">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Favoritos, listas y valoraciones quedan solo en tu perfil.</p>
        <form className="mt-6 space-y-3" onSubmit={(event) => void submit(event)}>
          {mode === 'register' ? (
            <>
              <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="Usuario" value={username} onChange={(event) => setUsername(event.target.value)} required />
              <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="Nombre visible" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </>
          ) : null}
          <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" type="email" placeholder="Correo" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === 'register' ? 8 : 1} />
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <button className={`${primaryButton} w-full`} type="submit" disabled={pending}>
            {pending ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>
        <button className={`${ghostButton} mt-4 w-full`} type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta'}
        </button>
        <Link className="mt-4 block text-center text-sm text-[var(--muted)]" to="/">
          Volver al inicio
        </Link>
      </div>
    </Reveal>
  )
}
