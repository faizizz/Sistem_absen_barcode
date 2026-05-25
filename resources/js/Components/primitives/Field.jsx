import { useState } from 'react';
import { cn } from '@/lib/cn';
import { AlertCircle } from 'lucide-react';

function isEmpty(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

export function Field({
    label,
    hint,
    error,
    required,
    htmlFor,
    value,
    requiredMessage = 'Wajib diisi.',
    className,
    children,
}) {
    const [touched, setTouched] = useState(false);

    // Mark as touched when focus leaves any descendant of this Field.
    function handleBlur(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setTouched(true);
        }
    }

    const valueProvided = value !== undefined;
    const isFieldEmpty = valueProvided && isEmpty(value);
    const showRequiredWarning =
        required && !error && valueProvided && isFieldEmpty && touched;

    return (
        <div className={cn('space-y-1.5', className)} onBlur={handleBlur}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]"
                >
                    {label}
                    {required && (
                        <span
                            className="ml-1 text-[color:var(--danger-fg)]"
                            aria-label="Wajib diisi"
                        >
                            *
                        </span>
                    )}
                </label>
            )}
            {children}
            {error ? (
                <p className="flex items-start gap-1.5 text-xs text-[color:var(--danger-fg)]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{error}</span>
                </p>
            ) : showRequiredWarning ? (
                <p className="flex items-start gap-1.5 text-xs text-[color:var(--warning-fg)]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>{requiredMessage}</span>
                </p>
            ) : hint ? (
                <p className="text-xs text-[color:var(--text-muted)]">{hint}</p>
            ) : null}
        </div>
    );
}
