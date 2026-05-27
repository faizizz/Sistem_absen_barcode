import { QrCode } from 'lucide-react';

/**
 * AuthShell — single-card login surface.
 *
 * Visual treatment:
 *   - Canvas background (no gradient — Meta's marketing surfaces are
 *     deliberately stark white so the form feels like a configurator
 *     panel, not a hero).
 *   - 24px (`--radius-2xl`) card on desktop matching `card-feature-photo`
 *     proportions.
 *   - Hairline-soft border, no shadow (DESIGN.md "elevation is a
 *     commerce-flow signal, not a marketing flourish").
 *   - The brand mark sits on a black ink pill — same shape language as
 *     `button-primary`.
 */
export function AuthShell({ children, eyebrow, title, description }) {
    return (
        <div className="relative min-h-screen bg-[color:var(--canvas)]">
            <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
                <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--ink-deep)] text-[color:var(--canvas)]">
                        <QrCode className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-base font-bold leading-[1.5] [letter-spacing:-0.16px] text-[color:var(--ink-deep)]">Sistem Absen</p>
                        <p className="text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--steel)]">Konsol pengurus</p>
                    </div>
                </div>

                <div className="w-full rounded-[var(--radius-2xl)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] p-6 sm:p-10">
                    <div className="mb-8 space-y-2">
                        {eyebrow && (
                            <p className="meta-eyebrow">{eyebrow}</p>
                        )}
                        {title && (
                            <h1 className="meta-heading-lg text-[color:var(--ink-deep)]">{title}</h1>
                        )}
                        {description && (
                            <p className="text-lg leading-[1.44] text-[color:var(--charcoal)]">{description}</p>
                        )}
                    </div>
                    {children}
                </div>

                <p className="mt-8 text-center text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--steel)]">
                    Akses dibatasi untuk pengurus.
                </p>
            </div>
        </div>
    );
}
