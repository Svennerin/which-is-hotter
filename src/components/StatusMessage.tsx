import type { ReactNode } from 'react'

interface StatusMessageProps {
  title: string
  children?: ReactNode
  /** "alert" interrupts screen readers; "status" is announced politely. */
  role?: 'alert' | 'status'
  actions?: ReactNode
  busy?: boolean
}

/** Shared card for loading, error and empty states so they look consistent. */
export function StatusMessage({ title, children, role = 'status', actions, busy }: StatusMessageProps) {
  return (
    <div role={role} aria-busy={busy} className="mx-auto max-w-xl rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      {busy && (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700 motion-reduce:animate-none"
        />
      )}
      <h2 className="text-xl font-bold">{title}</h2>
      {children && <div className="mt-2 text-slate-700">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
