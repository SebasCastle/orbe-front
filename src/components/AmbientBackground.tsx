import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Atmosphere } from '../types'

const THEMES: Record<Atmosphere, { accent: string; glows: [string, string, string] }> = {
  home: { accent: '#d9d2ff', glows: ['#6d5dfc', '#ff6fa8', '#3db7ff'] },
  cine: { accent: '#ffb089', glows: ['#ff6436', '#e11d48', '#f5b942'] },
  biblioteca: { accent: '#f3d7a1', glows: ['#e8b15a', '#c2410c', '#fb7185'] },
  starwars: { accent: '#f6e2a2', glows: ['#7dd3fc', '#e7c56a', '#1d4ed8'] },
  spotify: { accent: '#8ef0b4', glows: ['#1ed760', '#059669', '#022c22'] },
  books: { accent: '#f0c7a0', glows: ['#c47b4a', '#7c3a2d', '#f6d7a7'] },
  community: { accent: '#f5b6d6', glows: ['#db2777', '#7c3aed', '#fb7185'] },
  profile: { accent: '#c7d2fe', glows: ['#6366f1', '#0ea5e9', '#312e81'] },
}

const SHIFTS: Record<Atmosphere, Array<{ x: number; y: number; scale: number }>> = {
  home: [
    { x: 0, y: 0, scale: 1 },
    { x: 0, y: 0, scale: 1 },
    { x: 0, y: 20, scale: 1 },
  ],
  cine: [
    { x: 90, y: 30, scale: 1.12 },
    { x: -70, y: 80, scale: 1.05 },
    { x: 40, y: -30, scale: 0.92 },
  ],
  biblioteca: [
    { x: 30, y: 70, scale: 1.08 },
    { x: 40, y: -40, scale: 0.95 },
    { x: -50, y: 20, scale: 1.1 },
  ],
  starwars: [
    { x: -30, y: -20, scale: 0.9 },
    { x: 80, y: 40, scale: 1.16 },
    { x: -80, y: 60, scale: 1 },
  ],
  spotify: [
    { x: 120, y: 90, scale: 1.18 },
    { x: -40, y: 30, scale: 1 },
    { x: 20, y: -50, scale: 0.86 },
  ],
  books: [
    { x: 40, y: 50, scale: 1.06 },
    { x: -60, y: 20, scale: 0.94 },
    { x: 20, y: -40, scale: 1.08 },
  ],
  community: [
    { x: -50, y: 40, scale: 1.1 },
    { x: 70, y: -20, scale: 0.96 },
    { x: 10, y: 60, scale: 1.04 },
  ],
  profile: [
    { x: 20, y: -30, scale: 1.02 },
    { x: -30, y: 40, scale: 0.98 },
    { x: 50, y: 20, scale: 1.06 },
  ],
}

export function AmbientBackground({ atmosphere }: { atmosphere: Atmosphere }) {
  const reduce = useReducedMotion() ?? false
  const theme = THEMES[atmosphere]
  const shift = SHIFTS[atmosphere]

  useEffect(() => {
    const root = document.documentElement
    root.dataset.atmosphere = atmosphere
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--glow-a', theme.glows[0])
    root.style.setProperty('--glow-b', theme.glows[1])
    root.style.setProperty('--glow-c', theme.glows[2])
  }, [atmosphere, theme])

  const orbs = [
    'left-[-8rem] top-[-10rem] h-[38rem] w-[38rem]',
    'right-[-10rem] top-[12%] h-[34rem] w-[34rem]',
    'bottom-[-12rem] left-[28%] h-[36rem] w-[36rem]',
  ]

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--bg)]" aria-hidden>
      {orbs.map((position, index) => (
        <motion.div
          key={position}
          className={`absolute rounded-full blur-[90px] ${position}`}
          style={{ backgroundColor: theme.glows[index], opacity: 0.55 }}
          initial={false}
          animate={{
            backgroundColor: theme.glows[index],
            x: shift[index].x,
            y: shift[index].y,
            scale: shift[index].scale,
          }}
          transition={{ duration: reduce ? 0 : 0.9, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,8,12,0.78)_76%)]" />
      <div className="grain absolute inset-0 opacity-25 mix-blend-overlay" />
    </div>
  )
}
