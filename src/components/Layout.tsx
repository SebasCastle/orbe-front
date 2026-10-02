import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { AmbientBackground } from './AmbientBackground'
import { useAtmosphere } from '../atmosphere'
import { cn } from '../ui'

const links = [
  { to: '/cine', label: 'Cine' },
  { to: '/biblioteca', label: 'Biblioteca' },
  { to: '/star-wars', label: 'Star Wars' },
  { to: '/spotify', label: 'Spotify' },
  { to: '/libros', label: 'Libros' },
  { to: '/comunidad', label: 'Comunidad' },
  { to: '/perfil', label: 'Perfil' },
]

export function Layout() {
  const { atmosphere } = useAtmosphere()
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen">
      <AmbientBackground atmosphere={atmosphere} />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07080c]/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <NavLink to="/" end className="font-serif text-2xl tracking-tight">
            Orbe
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Secciones">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:text-[var(--ink)]',
                    isActive && 'bg-white/10 text-[var(--accent)]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to={user ? '/perfil' : '/entrar'} className="rounded-full px-3 py-1.5 text-[var(--accent)]">
              {user ? user.displayName : 'Entrar'}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<div className="py-24 text-center text-[var(--muted)]">Cargando…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="relative z-10 mx-auto max-w-6xl px-4 pb-10 text-sm text-[var(--muted)] sm:px-6">
        Cine, libros, Star Wars, música y la comunidad, en el ambiente que toca.
      </footer>
    </div>
  )
}
