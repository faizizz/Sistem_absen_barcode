import { cn } from '@/lib/cn';

/**
 * EmptyState — `warranty-card` chrome with a circular icon at the top.
 *
 * - background `{colors.surface-soft}`, rounded `{rounded.xxl}` (24px)
 * - padding `{spacing.xxl}` (32px)
 * - icon frame: `button-icon-circular` (canvas, 40px, circular)
 * - heading: `heading-sm` 24px / 500
 * - body: `body-md` 16px / -0.16px in charcoal
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-[var(--radius-2xl)] bg-[color:var(--surface-soft)] px-8 py-12 text-center',
                className,
            )}
        >
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] text-[color:var(--ink)]">
                    <Icon className="h-5 w-5" />
                </div>
            )}
            {title && (
                <h3 className="meta-heading-sm text-[color:var(--ink-deep)]">
                    {title}
                </h3>
            )}
            {description && (
                <p className="max-w-sm text-base [letter-spacing:-0.16px] leading-[1.5] text-[color:var(--charcoal)]">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
