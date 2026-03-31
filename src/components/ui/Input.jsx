export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-mono uppercase tracking-widest text-subdued mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-surface border ${error ? 'border-urgency' : 'border-border'} rounded-lg px-4 py-3 text-text text-sm placeholder-subdued focus:outline-none focus:border-urgency transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-urgency">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-mono uppercase tracking-widest text-subdued mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-surface border ${error ? 'border-urgency' : 'border-border'} rounded-lg px-4 py-3 text-text text-sm focus:outline-none focus:border-urgency transition-colors appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-urgency">{error}</p>}
    </div>
  )
}

export function MultiToggle({ label, options, value = [], onChange }) {
  const toggle = (opt) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-mono uppercase tracking-widest text-subdued mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              value.includes(opt.value)
                ? 'border-urgency bg-urgency/15 text-urgency'
                : 'border-border text-subdued hover:border-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RangeRow({ label, minName, maxName, minVal, maxVal, onMinChange, onMaxChange, min = 18, max = 80 }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-mono uppercase tracking-widest text-subdued mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <input
          type="number"
          name={minName}
          value={minVal}
          onChange={onMinChange}
          min={min}
          max={max}
          className="w-20 bg-surface border border-border rounded-lg px-3 py-2.5 text-text text-sm text-center focus:outline-none focus:border-urgency transition-colors"
          placeholder={String(min)}
        />
        <span className="text-subdued text-xs">to</span>
        <input
          type="number"
          name={maxName}
          value={maxVal}
          onChange={onMaxChange}
          min={min}
          max={max}
          className="w-20 bg-surface border border-border rounded-lg px-3 py-2.5 text-text text-sm text-center focus:outline-none focus:border-urgency transition-colors"
          placeholder={String(max)}
        />
      </div>
    </div>
  )
}
