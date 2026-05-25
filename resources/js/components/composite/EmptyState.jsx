import { cn } from '@/lib/cn';

export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--border-default)] bg-[color:var(--surface-base)] px-6 py-12 text-center',
                className,
            )}
        >
            {Icon && (
                <div className="rounded-full bg-[color:var(--surface-glass)] p-3 text-[color:var(--brand-500)]">
                    <Icon className="h-6 w-6" />
                </div>
            )}
            {title && (
                <h3 className="text-base font-semibold tracking-tight text-[color:var(--text-primary)]">
                    {title}
                </h3>
            )}
            {description && (
                <p className="max-w-sm text-sm text-[color:var(--text-secondary)]">{description}</p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
