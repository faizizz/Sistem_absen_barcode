import { useState } from 'react';
import { cn } from '@/lib/cn';
import { AlertCircle } from 'lucide-react';

function isEmpty(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

/**
 * Field — wraps a label + control + hint/error.
 *
 * Per DESIGN.md (`text-input` / `text-input-error`):
 *   - label is `caption-bold` (12px / 700 / 1.33), uppercase, steel
 *   - error message is `body-sm` (14px / 400 / -0.14px) in critical-strong
 *   - hint is `body-sm` in steel
 *
 * The required-warning that fires onBlur is preserved from the previous
 * implementation — empty required field shows a warning-fg helper line.
 */
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
        <div className={cn('space-y-2', className)} onBlur={handleBlur}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--steel)]"
                >
                    {label}
                    {required && (
                        <span
                            className="ml-1 text-[color:var(--critical-strong)]"
                            aria-label="Wajib diisi"
                        >
                            *
                        </span>
                    )}
                </label>
            )}
            {children}
            {error ? (
                <p className="flex items-start gap-1.5 text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--critical-strong)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </p>
            ) : showRequiredWarning ? (
                <p className="flex items-start gap-1.5 text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--warning-fg)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{requiredMessage}</span>
                </p>
            ) : hint ? (
                <p className="text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--steel)]">{hint}</p>
            ) : null}
        </div>
    );
}
