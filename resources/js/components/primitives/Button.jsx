import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

/**
 * Button — Meta commerce design.
 *
 * Pill radius (`{rounded.full}` = 100px) is the brand signature; applied to
 * every button + icon-button shape. Typography is locked to
 * `{typography.button-md}` — 14px / 700 / line-height 1.43 / letter-spacing
 * −0.14px — across every variant, so the label fingerprint stays uniform.
 *
 * Variant intent (DESIGN.md §Components → Buttons):
 *   - primary  : `button-primary`     — black ink, marketing CTAs (`14px 30px`)
 *   - buy      : `button-buy-cta`     — cobalt, commerce CTAs only (`14px 30px`)
 *   - secondary: `button-secondary`   — outlined ink-deep (`12px 28px`)
 *   - ghost    : `button-ghost`       — quieter outlined (`10px 22px`)
 *   - pillTab  : `button-pill-tab`    — category nav chip (`8px 16px`)
 *   - soft     : surface-soft fill, ink text — utility / chips
 *   - outline  : white pill with hairline border — search-like utilities
 *   - danger   : `badge-critical` color as a destructive solid CTA
 *   - dangerSoft / successSoft / warningSoft — tinted utility chips
 *
 * Compatibility shim: `accent` maps to `buy` (cobalt) since pre-existing
 * pages used "accent" for highlighted commerce-ish actions.
 */

/* DESIGN.md `button-primary` and friends spell out their padding in the
   YAML front-matter. Keep these as named layout tokens so the size table
   stays readable when the spec ships -pressed / -disabled variants. */
const PADDING = {
    primary:   'px-[30px] py-[14px]',  /* button-primary / button-buy-cta   */
    secondary: 'px-[28px] py-[12px]',  /* button-secondary (border-2 trims 2px) */
    ghost:     'px-[22px] py-[10px]',  /* button-ghost                       */
    pillTab:   'px-4 py-2',            /* button-pill-tab — 8px 16px         */
};

const variants = {
    primary:
        'bg-[color:var(--ink-button)] text-[color:var(--on-ink-button)] active:bg-[color:var(--charcoal)]',
    buy:
        'bg-[color:var(--primary)] text-[color:var(--on-primary)] active:bg-[color:var(--primary-deep)]',
    accent:
        'bg-[color:var(--primary)] text-[color:var(--on-primary)] active:bg-[color:var(--primary-deep)]',
    secondary:
        'bg-transparent text-[color:var(--ink-deep)] border-2 border-[color:var(--ink-deep)] active:bg-[color:var(--ink-deep)] active:text-[color:var(--canvas)]',
    ghost:
        'bg-transparent text-[color:var(--ink-deep)] border-2 border-[color-mix(in_srgb,var(--ink-deep)_12%,transparent)] active:border-[color:var(--ink-deep)]',
    pillTab:
        'bg-[color:var(--canvas)] text-[color:var(--ink)] border border-[color:var(--hairline)] active:bg-[color:var(--ink-deep)] active:text-[color:var(--canvas)] active:border-transparent',
    soft:
        'bg-[color:var(--surface-soft)] text-[color:var(--ink-deep)] border border-transparent active:bg-[color-mix(in_srgb,var(--surface-soft)_80%,var(--ink-deep)_20%)]',
    outline:
        'bg-[color:var(--canvas)] border border-[color:var(--hairline)] text-[color:var(--ink-deep)] active:border-[color:var(--ink-deep)]',
    danger:
        'bg-[color:var(--critical)] text-[color:var(--canvas)] active:bg-[color:var(--critical-strong)]',
    dangerSoft:
        'bg-[color:var(--danger-bg)] text-[color:var(--danger-fg)] border border-[color:var(--danger-border)] active:bg-[color:var(--danger-border)]',
    success:
        'bg-[color:var(--success)] text-[color:var(--canvas)] active:brightness-95',
    successSoft:
        'bg-[color:var(--success-bg)] text-[color:var(--success-fg)] border border-[color:var(--success-border)] active:bg-[color:var(--success-border)]',
    warning:
        'bg-[color:var(--warning)] text-[color:var(--ink-deep)] active:brightness-95',
    warningSoft:
        'bg-[color:var(--warning-bg)] text-[color:var(--warning-fg)] border border-[color:var(--warning-border)] active:bg-[color:var(--warning-border)]',
};

/* Variant -> default padding bucket. Sizes still let callers scale up
   without losing the canonical pill geometry. */
function paddingFor(variant) {
    if (variant === 'secondary') return PADDING.secondary;
    if (variant === 'ghost') return PADDING.ghost;
    if (variant === 'pillTab') return PADDING.pillTab;
    return PADDING.primary;
}

/* Sizes scale in 4px steps but keep the pill radius and the
   button-md letter-spacing fingerprint. The icon sizes are
   `button-icon-circular` per DESIGN.md (40×40 default). */
const sizes = {
    xs:     'h-8  text-xs   gap-1.5 rounded-[var(--radius-pill)]',
    sm:     'h-10 text-sm   gap-2   rounded-[var(--radius-pill)]',
    md:     'h-11 text-sm   gap-2   rounded-[var(--radius-pill)]',
    lg:     'h-12 text-sm   gap-2.5 rounded-[var(--radius-pill)]',
    xl:     'h-14 text-base gap-3   rounded-[var(--radius-pill)]',
    icon:   'h-10 w-10              rounded-full',
    iconSm: 'h-9  w-9               rounded-full',
};

/* Smaller sizes need tighter padding so they don't widen unevenly. */
const SIZE_PAD_OVERRIDE = {
    xs: 'px-3.5',
    sm: 'px-5',
    icon: 'p-0',
    iconSm: 'p-0',
};

const base =
    'inline-flex items-center justify-center font-bold transition-all duration-150 ease-out select-none active:scale-[0.985] disabled:!cursor-not-allowed disabled:!bg-[color:var(--disabled-text)] disabled:!text-[color:var(--canvas)] disabled:!border-transparent disabled:!shadow-none disabled:active:scale-100 [letter-spacing:-0.14px]';

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
    const sizeClass = sizes[size] ?? sizes.md;
    const padOverride = SIZE_PAD_OVERRIDE[size];
    const padClass = padOverride ?? paddingFor(variant);

    return (
        <Component
            ref={ref}
            className={cn(
                base,
                variants[variant] ?? variants.primary,
                sizeClass,
                padClass,
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
