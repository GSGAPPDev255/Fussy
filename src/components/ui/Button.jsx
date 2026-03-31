export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-body text-sm rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed select-none'

  const variants = {
    primary: 'w-full py-3.5 px-6 bg-urgency text-white font-heading tracking-wide',
    ghost: 'w-full py-3.5 px-6 border border-border text-text',
    success: 'w-full py-3.5 px-6 bg-success text-bg font-heading tracking-wide',
    icon: 'p-2 border border-border text-subdued hover:text-text hover:border-muted',
    link: 'text-subdued hover:text-text underline-offset-2 hover:underline',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
