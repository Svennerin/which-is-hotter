import type { ComponentProps } from 'react'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary'
}

const styles = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 active:bg-slate-800',
  secondary: 'bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50',
}

/** A real <button>, so keyboard and screen-reader behaviour comes for free. */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center rounded-lg px-6 py-2 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
