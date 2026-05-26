import { cn } from '@/lib/cn';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Ellipsis } from '@/components/primitives/Ellipsis';

const TONE_ICON = {
    brand: 'text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]',
    accent: 'text-[color:var(--accent-700)] dark:text-[color:var(--accent-300)]',
    success: 'text-[color:var(--success-fg)]',
    warning: 'text-[color:var(--warning-fg)]',
    danger: 'text-[color:var(--danger-fg)]',
    info: 'text-[color:var(--info-fg,var(--brand-600))]',
};

export function Stat({ label, value, hint, delta, icon: Icon, tone = 'brand', className }) {
    const positive = typeof delta === 'number' && delta >= 0;
    return (
        <div
            className={cn(
                'relative rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-4 sm:p-5',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-muted)]">
                        {label}
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-[color:var(--text-primary)] sm:text-[28px]">
                        {value}
                    </p>
                    {hint && (
                        <Ellipsis as="p" className="mt-1 text-xs text-[color:var(--text-secondary)]">{hint}</Ellipsis>
                    )}
                </div>
                {Icon && (
                    <div
                        className={cn(
                            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]',
                            TONE_ICON[tone] ?? TONE_ICON.brand,
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            {typeof delta === 'number' && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
                    {positive ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-[color:var(--success-fg)]" />
                    ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-[color:var(--danger-fg)]" />
                    )}
                    <span className={positive ? 'text-[color:var(--success-fg)]' : 'text-[color:var(--danger-fg)]'}>
                        {positive ? '+' : ''}
                        {delta}%
                    </span>
                </div>
            )}
        </div>
    );
}
