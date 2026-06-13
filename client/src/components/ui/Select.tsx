import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--muted)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`h-[38px] px-3 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(78,140,255,0.15)] transition-colors ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
