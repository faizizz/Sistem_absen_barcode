import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

const variants = {
    primary:
        'bg-[color:var(--brand-600)] text-white shadow-[var(--shadow-xs)] hover:bg-[color:var(--brand-700)]',
    accent:
        'bg-[color:var(--accent-600)] text-white shadow-[var(--shadow-xs)] hover:bg-[color:var(--accent-700)]',
    ghost:
        'bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--surface-base)] hover:text-[color:var(--text-primary)] dark:hover:bg-[rgba(255,255,255,0.06)]',
    soft:
        'bg-[color:var(--surface-base)] text-[color:var(--text-primary)] border border-[color:var(--border-default)] shadow-[var(--shadow-xs)] hover:bg-[color:var(--surface-raised)] hover:border-[color:var(--border-strong)] dark:bg-[rgba(255,255,255,0.04)] dark:hover:bg-[rgba(255,255,255,0.08)]',
    outline:
        'bg-[color:var(--surface-raised)] border border-[color:var(--border-default)] text-[color:var(--text-primary)] hover:border-[color:var(--brand-400)] hover:bg-[color:var(--surface-base)] hover:text-[color:var(--brand-700)] dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[color:var(--brand-300)]',
    danger:
        'bg-[color:var(--danger-fg)] text-white shadow-[var(--shadow-xs)] hover:brightness-110',
    dangerSoft:
        'bg-[color:var(--danger-bg)] text-[color:var(--danger-fg)] border border-[color:var(--danger-border)] hover:bg-[color:var(--danger-border)] dark:hover:bg-[rgba(253,165,180,0.20)]',
    success:
        'bg-[color:var(--success-fg)] text-white shadow-[var(--shadow-xs)] hover:brightness-110',
    successSoft:
        'bg-[color:var(--success-bg)] text-[color:var(--success-fg)] border border-[color:var(--success-border)] hover:bg-[color:var(--success-border)] dark:hover:bg-[rgba(110,226,163,0.20)]',
    warning:
        'bg-[color:var(--warning-fg)] text-white shadow-[var(--shadow-xs)] hover:brightness-110',
};

const sizes = {
    xs: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]',
    sm: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
    md: 'h-11 px-5 text-sm gap-2 rounded-[var(--radius-md)]',
    lg: 'h-12 px-6 text-base gap-2.5 rounded-[var(--radius-lg)]',
    xl: 'h-14 px-7 text-base gap-3 rounded-[var(--radius-lg)]',
    icon: 'h-11 w-11 rounded-[var(--radius-md)]',
    iconSm: 'h-9 w-9 rounded-[var(--radius-md)]',
};

const base =
    'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 ease-out select-none active:scale-[0.98] disabled:!cursor-not-allowed disabled:!border-[color:var(--border-default)] disabled:!bg-[color:var(--surface-raised)] disabled:!text-[color:var(--text-secondary)] disabled:!shadow-none disabled:!opacity-100 disabled:active:scale-100 dark:disabled:!border-[color:var(--border-default)] dark:disabled:!bg-[rgba(255,255,255,0.06)] dark:disabled:!text-[color:var(--neutral-300)]';

export const Button = forwardRef(function Button(
    {
        as: Component = 'button',
        variant = 'primary',
        size = 'md',
        leftIcon,
        rightIcon,
        loading = false,
        fullWidth = false,
        className,
        children,
        type = 'button',
        ...props
    },
    ref,
) {
    const extra = Component === 'button' ? { type } : {};
    return (
        <Component
            ref={ref}
            className={cn(
                base,
                variants[variant] ?? variants.primary,
                sizes[size] ?? sizes.md,
                fullWidth && 'w-full sm:w-auto',
                className,
            )}
            disabled={loading || props.disabled}
            {...extra}
            {...props}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
            {children}
            {!loading && rightIcon}
        </Component>
    );
});
