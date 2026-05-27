import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Input — DESIGN.md `text-input`.
 *
 * Spec:
 *   - background canvas, ink text
 *   - typography `body-md` (16px / 400 / 1.5 / -0.16px)
 *   - rounded `{rounded.lg}` (8px)
 *   - padding `{spacing.md}` (12px)
 *   - height 44px
 *   - rest border `1px solid {colors.hairline}`
 *
 * Focus state — `text-input-focused`:
 *   - border `2px solid {colors.fb-blue}`
 *   - we compensate the extra 1px with a -1px padding shrink so the
 *     control's overall box doesn't jitter on focus.
 */
const base =
    'block w-full h-11 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--canvas)] px-3 py-3 text-base [letter-spacing:-0.16px] text-[color:var(--ink)] placeholder:text-[color:var(--steel)] transition-colors duration-150 focus:outline-none focus:border-[color:var(--fb-blue)] focus:border-2 focus:px-[11px] focus:py-[11px] disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
    return <input ref={ref} type={type} className={cn(base, className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
    return (
        <textarea
            ref={ref}
            rows={rows}
            className={cn(base, 'min-h-[6rem] py-3 resize-y leading-6', className)}
            {...props}
        />
    );
});
