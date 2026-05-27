import { cn } from '@/lib/cn';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Ellipsis } from '@/components/primitives/Ellipsis';

/* Tone -> icon-frame foreground. The frame itself is always a soft
   surface-soft circle to keep the "flat by default" Meta posture. */
const TONE_ICON = {
    brand:   'text-[color:var(--primary-deep)]',
    accent:  'text-[color:var(--ink-deep)]',
    success: 'text-[color:var(--success)]',
    warning: 'text-[color:var(--attention)]',
    danger:  'text-[color:var(--critical)]',
    info:    'text-[color:var(--primary)]',
};

/**
 * Stat — large-number tile.
 *
 * Layout mirrors `why-buy-tile` chrome (canvas, 16px radius, hairline
 * border, 32px / 24px padding). Hierarchy inside:
 *   - eyebrow label  : `caption-bold` 12px uppercase steel
 *   - value          : `heading-lg`   36px display
 *   - hint           : `body-sm`      14px charcoal
 *   - icon frame     : 40px circle, `button-icon-circular` chrome
 *   - delta          : `body-sm-bold` colored success/critical
 */
export function Stat({ label, value, hint, delta, icon: Icon, tone = 'brand', className }) {
    const positive = typeof delta === 'number' && delta >= 0;
    return (
        <div
            className={cn(
                'relative rounded-[var(--radius-xl)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] p-6 sm:py-8 sm:px-6',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="meta-eyebrow">
                        {label}
                    </p>
                    <p className="mt-3 meta-heading-lg leading-none text-[color:var(--ink-deep)]">
                        {value}
                    </p>
                    {hint && (
                        <Ellipsis as="p" className="mt-2 text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--charcoal)]">
                            {hint}
                        </Ellipsis>
                    )}
                </div>
                {Icon && (
                    <div
                        className={cn(
                            /* `button-icon-circular` — 40×40, canvas, ink icon. */
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--hairline-soft)] bg-[color:var(--surface-soft)]',
                            TONE_ICON[tone] ?? TONE_ICON.brand,
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            {typeof delta === 'number' && (
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px]">
                    {positive ? (
                        <ArrowUpRight className="h-4 w-4 text-[color:var(--success)]" />
                    ) : (
                        <ArrowDownRight className="h-4 w-4 text-[color:var(--critical)]" />
                    )}
                    <span className={positive ? 'text-[color:var(--success)]' : 'text-[color:var(--critical)]'}>
                        {positive ? '+' : ''}
                        {delta}%
                    </span>
                </div>
            )}
        </div>
    );
}
