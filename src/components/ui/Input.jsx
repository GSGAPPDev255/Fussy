export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="section-label">{label}</label>
      )}
      <input
        className={`input-field ${error ? 'border-[rgba(255,59,48,0.5)] bg-[rgba(255,59,48,0.04)]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs" style={{ color: '#FF3B30' }}>{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="section-label">{label}</label>}
      <select
        className={`input-field appearance-none cursor-pointer ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs" style={{ color: '#FF3B30' }}>{error}</p>}
    </div>
  )
}

export function MultiToggle({ label, options, value = [], onChange }) {
  const toggle = (opt) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="w-full">
      {label && <label className="section-label">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="px-3.5 py-2 rounded-xl text-xs transition-all duration-200 active:scale-95 font-medium"
              style={active ? {
                background: 'rgba(255,59,48,0.12)',
                border: '1px solid rgba(255,59,48,0.35)',
                color: '#FF3B30',
                boxShadow: '0 0 12px rgba(255,59,48,0.08)'
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)'
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function RangeRow({ label, minName, maxName, minVal, maxVal, onMinChange, onMaxChange, min = 18, max = 80 }) {
  return (
    <div className="w-full">
      {label && <label className="section-label">{label}</label>}
      <div className="flex items-center gap-3">
        <input
          type="number"
          name={minName}
          value={minVal}
          onChange={onMinChange}
          min={min}
          max={max}
          className="w-20 input-field text-center"
          placeholder={String(min)}
        />
        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>to</span>
        <input
          type="number"
          name={maxName}
          value={maxVal}
          onChange={onMaxChange}
          min={min}
          max={max}
          className="w-20 input-field text-center"
          placeholder={String(max)}
        />
      </div>
    </div>
  )
}
