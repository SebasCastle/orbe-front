export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#140e09] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'

export const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[var(--ink)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60'

export const panel =
  'rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl'
