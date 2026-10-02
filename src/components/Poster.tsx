import { useState } from 'react'
import { cn } from '../ui'

export function Poster({
  src,
  alt,
  className,
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div
        className={cn(
          'grid place-items-center bg-gradient-to-br from-white/15 to-white/5 font-serif text-4xl text-white/80',
          className,
        )}
        aria-hidden
      >
        {alt.trim().slice(0, 1) || '•'}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
      onError={() => setFailed(true)}
    />
  )
}
