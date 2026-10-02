import { ghostButton, panel } from '../ui'

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
}

export function LoadingGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[2/3] rounded-2xl bg-white/10" />
          <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className={`${panel} px-6 py-14 text-center`}>
      <h2 className="font-serif text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={`${panel} px-6 py-12 text-center`} role="alert">
      <h2 className="font-serif text-3xl">Algo no salió</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">{message}</p>
      {onRetry ? (
        <button className={`${ghostButton} mt-6`} onClick={onRetry} type="button">
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
