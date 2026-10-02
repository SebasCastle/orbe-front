import { Link } from 'react-router-dom'
import { Reveal } from '../components/Reveal'
import { useTitle } from '../lib/format'
import { primaryButton } from '../ui'

export default function NotFoundPage() {
  useTitle('No encontrado')
  return (
    <Reveal className="py-16 text-center">
      <h1 className="font-serif text-5xl">Esta página no está en el mapa.</h1>
      <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">El enlace no corresponde a cine, Star Wars ni Spotify.</p>
      <Link className={`${primaryButton} mt-8`} to="/">
        Volver al inicio
      </Link>
    </Reveal>
  )
}
