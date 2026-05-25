import { cn } from '@/lib/cn';

export function Card({ className, variant = 'solid', padding = 'md', children, ...props }) {
    const variants = {
        solid: 'bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] shadow-[var(--shadow-sm)]',
        glass: 'surface-glass',
        outline: 'border border-[color:var(--border-default)] bg-transparent',
        raised: 'bg-[color:var(--surface-raised)] shadow-[var(--shadow-md)]',
    };
    const pad = {
        none: '',
        sm: 'p-4',
        md: 'p-5 sm:p-6',
        lg: 'p-6 sm:p-8',
    };
    return (
        <div
            className={cn(
                'rounded-[var(--radius-lg)]',
                variants[variant] ?? variants.solid,
                pad[padding] ?? pad.md,
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, action, className }) {
    return (
        <div className={cn('flex items-start justify-between gap-3', className)}>
            <div>
                {title && (
                    <h3 className="text-base font-semibold tracking-tight text-[color:var(--text-primary)]">
                        {title}
                    </h3>
                )}
                {subtitle && (
                    <p className="mt-0.5 text-sm text-[color:var(--text-secondary)]">{subtitle}</p>
                )}
            </div>
            {action}
        </div>
    );
}
