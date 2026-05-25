import { cn } from '@/lib/cn';

const tones = {
    neutral: 'bg-[color:var(--neutral-100)] text-[color:var(--neutral-700)] border-[color:var(--neutral-200)] dark:bg-[rgba(255,255,255,0.06)] dark:text-[color:var(--neutral-300)] dark:border-[rgba(255,255,255,0.10)]',
    brand: 'bg-[color:var(--accent-100)] text-[color:var(--accent-900)] border-[color:var(--accent-300)] dark:bg-[rgba(147,181,228,0.18)] dark:text-[color:var(--accent-100)] dark:border-[rgba(147,181,228,0.34)]',
    accent: 'bg-[color:var(--accent-50)] text-[color:var(--accent-700)] border-[color:var(--accent-200)] dark:bg-[rgba(49,95,145,0.24)] dark:text-[color:var(--accent-200)] dark:border-[rgba(147,181,228,0.26)]',
    success: 'bg-[color:var(--success-bg)] text-[color:var(--success-fg)] border-[color:var(--success-border)]',
    warning: 'bg-[color:var(--warning-bg)] text-[color:var(--warning-fg)] border-[color:var(--warning-border)]',
    danger: 'bg-[color:var(--danger-bg)] text-[color:var(--danger-fg)] border-[color:var(--danger-border)]',
    info: 'bg-[color:var(--info-bg)] text-[color:var(--info-fg)] border-[color:var(--info-border)]',
};

const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
};

export function Badge({ tone = 'neutral', size = 'md', dot = false, className, children }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight',
                tones[tone] ?? tones.neutral,
                sizes[size] ?? sizes.md,
                className,
            )}
        >
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            {children}
        </span>
    );
}
