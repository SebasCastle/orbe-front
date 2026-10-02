import { createContext, useContext, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Atmosphere } from './types'

type AtmosphereContextValue = {
  atmosphere: Atmosphere
  preview: (next: Atmosphere | null) => void
}

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null)

export function atmosphereFor(pathname: string): Atmosphere {
  if (pathname.startsWith('/cine')) return 'cine'
  if (pathname.startsWith('/biblioteca')) return 'biblioteca'
  if (pathname.startsWith('/star-wars')) return 'starwars'
  if (pathname.startsWith('/spotify')) return 'spotify'
  if (pathname.startsWith('/libros')) return 'books'
  if (pathname.startsWith('/comunidad')) return 'community'
  if (pathname.startsWith('/perfil') || pathname.startsWith('/entrar')) return 'profile'
  return 'home'
}

export function AtmosphereProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const routed = atmosphereFor(location.pathname)
  const [hover, setHover] = useState<Atmosphere | null>(null)
  const value = useMemo(
    () => ({ atmosphere: hover ?? routed, preview: setHover }),
    [hover, routed],
  )
  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>
}

export function useAtmosphere() {
  const context = useContext(AtmosphereContext)
  if (!context) throw new Error('El ambiente no está disponible.')
  return context
}
