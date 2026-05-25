import { cn } from '@/lib/cn';

export function SectionHeader({ eyebrow, title, description, action, className }) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div>
                {eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-600)] dark:text-[color:var(--brand-300)]">
                        {eyebrow}
                    </p>
                )}
                {title && (
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-3xl">
                        {title}
                    </h1>
                )}
                {description && (
                    <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-secondary)]">{description}</p>
                )}
            </div>
            {action && <div className="flex flex-wrap gap-2">{action}</div>}
        </div>
    );
}
