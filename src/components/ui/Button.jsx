export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed select-none font-body'

  const variants = {
    primary: 'btn-primary',
    ghost:   'btn-ghost',
    success: 'btn-success',
    icon:    'p-2.5 rounded-xl transition-all duration-200 active:scale-95',
    link:    'text-xs underline-offset-2 hover:underline',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
