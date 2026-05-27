import { cn } from '@/lib/cn';

/**
 * Badge — Meta pill chip.
 *
 * Default size mirrors DESIGN.md badges exactly:
 *   typography `{typography.caption-bold}` (12px / 700 / 1.33),
 *   padding `4px 10px`, rounded `{rounded.full}`.
 *
 * Tones:
 *   - neutral / brand / accent / ink   : utility chips
 *   - success / warning / danger / info: semantic
 *   - promo                            : `badge-promo-yellow`
 *   - attention                        : `badge-attention`
 *   - critical                         : `badge-critical`
 *   - successSoft / warningSoft / dangerSoft : tinted-fill variants
 */
const tones = {
    neutral:     'bg-[color:var(--surface-soft)] text-[color:var(--charcoal)] border-[color:var(--hairline-soft)]',
    brand:       'bg-[color:var(--brand-50)] text-[color:var(--brand-800)] border-[color:var(--brand-100)]',
    accent:      'bg-[color:var(--surface-soft)] text-[color:var(--ink-deep)] border-[color:var(--hairline-soft)]',
    ink:         'bg-[color:var(--ink-deep)] text-[color:var(--canvas)] border-transparent',
    success:     'bg-[color:var(--success)] text-[color:var(--canvas)] border-transparent',
    warning:     'bg-[color:var(--warning)] text-[color:var(--ink-deep)] border-transparent',
    danger:      'bg-[color:var(--critical)] text-[color:var(--canvas)] border-transparent',
    info:        'bg-[color:var(--info-bg)] text-[color:var(--info-fg)] border-[color:var(--info-border)]',
    promo:       'bg-[color:var(--warning)] text-[color:var(--ink-deep)] border-transparent',
    attention:   'bg-[color:var(--attention)] text-[color:var(--canvas)] border-transparent',
    critical:    'bg-[color:var(--critical)] text-[color:var(--canvas)] border-transparent',
    successSoft: 'bg-[color:var(--success-bg)] text-[color:var(--success-fg)] border-[color:var(--success-border)]',
    warningSoft: 'bg-[color:var(--warning-bg)] text-[color:var(--warning-fg)] border-[color:var(--warning-border)]',
    dangerSoft:  'bg-[color:var(--danger-bg)] text-[color:var(--danger-fg)] border-[color:var(--danger-border)]',
};

/* `md` = the canonical badge from DESIGN.md (12px / 700, 4px 10px padding).
   `sm` is a compressed variant for inline-cell pills inside dense tables;
   `lg` bumps to 14px / 700 (pill-tab label fingerprint) for hero badges. */
const sizes = {
    sm: 'text-[11px] leading-[1.3] px-2.5 py-[3px] font-bold',
    md: 'text-xs    leading-[1.33] px-2.5 py-1     font-bold', /* 12 / 700 / 4px 10px */
    lg: 'text-sm    leading-[1.43] px-3   py-1     font-bold [letter-spacing:-0.14px]',
};

export function Badge({ tone = 'neutral', size = 'md', dot = false, className, children }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border tracking-tight whitespace-nowrap',
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
