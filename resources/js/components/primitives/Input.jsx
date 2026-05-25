import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const base =
    'block w-full min-h-11 rounded-[var(--radius-md)] border border-[color:var(--border-default)] bg-[color:var(--surface-raised)] px-4 py-2.5 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition-shadow duration-150 focus:outline-none focus:border-[color:var(--brand-500)] focus:shadow-[var(--shadow-focus-ring)] disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
    return <input ref={ref} type={type} className={cn(base, className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
    return (
        <textarea
            ref={ref}
            rows={rows}
            className={cn(base, 'min-h-[6rem] py-3 resize-y', className)}
            {...props}
        />
    );
});
