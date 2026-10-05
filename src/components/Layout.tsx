import type { ReactNode } from 'react'
import { Attribution } from './Attribution'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3">
          <span aria-hidden="true" className="text-xl">🌡️</span>
          <p className="text-lg font-bold tracking-tight">Which Is Hotter?</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <Attribution />
    </div>
  )
}
