import { cn } from '@/lib/cn';

/**
 * Card — Meta surface variants.
 *
 * Variants map to DESIGN.md cards (1:1):
 *   - solid    : `card-product-feature` (canvas, hairline, 32px radius, 32px pad)
 *   - feature  : alias of solid for naming intent in marketing surfaces
 *   - photo    : `card-feature-photo` (32px radius, no chrome, no padding)
 *   - ink      : `card-promo-strip` (ink-deep fill, 32px radius, 64px pad)
 *   - softTile : `warranty-card` (surface-soft, 24px radius, 32px pad)
 *   - icon     : `card-icon-feature` / `why-buy-tile` (canvas, 16px radius)
 *   - checkout : `card-checkout-summary` (canvas, 16px radius, level-2 shadow)
 *   - whyBuy   : `why-buy-tile` (canvas, 16px radius, 32px 24px pad)
 *   - faq      : `faq-accordion-item` (canvas, 16px radius, 24px pad)
 *   - glass    : translucent canvas — utility back-compat
 *   - outline  : transparent + hairline — utility back-compat
 *   - raised   : alias of `checkout` — utility back-compat
 *
 * Padding presets (cleanly map onto DESIGN.md `{spacing.*}`):
 *   none  = 0
 *   sm    = 16px (`{spacing.base}`)
 *   md    = 24px (`{spacing.xl}`)
 *   lg    = 32px (`{spacing.xxl}`) — `card-product-feature` standard
 *   xl    = 40px (`{spacing.xxxl}`)
 *   section = 64px (`{spacing.section}`) — `card-promo-strip`
 */
export function Card({ className, variant = 'solid', padding, children, ...props }) {
    const variants = {
        solid:    'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-3xl)]',
        feature:  'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-3xl)]',
        photo:    'bg-[color:var(--canvas)] rounded-[var(--radius-3xl)] overflow-hidden',
        ink:      'bg-[color:var(--ink-deep)] text-[color:var(--canvas)] rounded-[var(--radius-3xl)]',
        softTile: 'bg-[color:var(--surface-soft)] rounded-[var(--radius-2xl)]',
        icon:     'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-xl)]',
        checkout: 'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]',
        whyBuy:   'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-xl)]',
        faq:      'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-xl)]',
        glass:    'surface-glass',
        outline:  'border border-[color:var(--hairline)] bg-transparent rounded-[var(--radius-xl)]',
        raised:   'bg-[color:var(--canvas)] border border-[color:var(--hairline-soft)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]',
    };

    const pad = {
        none: '',
        sm:   'p-4',                   /* 16px */
        md:   'p-6',                   /* 24px — `card-icon-feature` / `card-checkout-summary` */
        lg:   'p-8',                   /* 32px — `card-product-feature` */
        xl:   'p-10',                  /* 40px */
        section: 'p-10 sm:p-16',       /* 64px on desktop — `card-promo-strip` */
    };

    /* Variant-aware default padding so callers don't have to remember the
       spec mapping every time. Override is still possible via `padding`. */
    const defaultPad = {
        solid:    'lg',
        feature:  'lg',
        photo:    'none',
        ink:      'section',
        softTile: 'lg',
        icon:     'md',
        checkout: 'md',
        whyBuy:   'lg',
        faq:      'md',
        glass:    'md',
        outline:  'md',
        raised:   'md',
    };

    const padKey = padding ?? defaultPad[variant] ?? 'md';

    return (
        <div
            className={cn(
                variants[variant] ?? variants.solid,
                pad[padKey] ?? pad.md,
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * CardHeader — title in `heading-sm` (24px / 500 / 1.25), subtitle in
 * `body-md` (16px / 400 / -0.16px) charcoal.
 */
export function CardHeader({ title, subtitle, action, className }) {
    return (
        <div className={cn('flex items-start justify-between gap-4', className)}>
            <div className="min-w-0">
                {title && (
                    <h3 className="meta-heading-sm text-[color:var(--ink-deep)]">
                        {title}
                    </h3>
                )}
                {subtitle && (
                    <p className="mt-1.5 text-base [letter-spacing:-0.16px] leading-[1.5] text-[color:var(--charcoal)]">{subtitle}</p>
                )}
            </div>
            {action}
        </div>
    );
}
