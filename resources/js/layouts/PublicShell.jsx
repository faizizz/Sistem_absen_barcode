import { useState } from 'react';
import { toggleTheme } from '@/lib/theme';
import { Moon, Sun, QrCode } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * PublicShell — Meta marketing-page chrome.
 *
 * Top-of-page layout:
 *   1. Promo strip (above nav) — dark ink-deep band carrying microcopy.
 *   2. Sticky white nav bar with hairline-soft bottom divider.
 *   3. Centered content column with stark white canvas.
 *   4. Hairline footer with caption microcopy.
 *
 * The brand mark uses the same ink pill as AuthShell to keep the
 * pre-auth and post-auth marketing surfaces visually unified.
 */
export function PublicShell({ children, className }) {
    const [theme, setThemeState] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.dataset.theme : 'light',
    );

    function onToggle() {
        toggleTheme();
        setThemeState(document.documentElement.dataset.theme);
    }

    return (
        <div className="relative min-h-screen bg-[color:var(--canvas)] text-[color:var(--ink-deep)]">
            {/* Promo banner above the nav — DESIGN.md `promo-banner` */}
            <div className="promo-banner-dark">
                <div className="mx-auto flex max-w-[var(--container-marketing)] items-center justify-center gap-2 px-6 py-3 text-center text-sm font-bold leading-[1.43] [letter-spacing:-0.14px]">
                    Buat QR absen permanen — sekali klaim, dipakai seumur kepengurusan.
                </div>
            </div>

            {/* Top nav */}
            <header className="sticky top-0 z-40 border-b border-[color:var(--hairline-soft)] bg-[color:var(--canvas)]/95 backdrop-blur">
                <div className="mx-auto flex max-w-[var(--container-marketing)] items-center justify-between gap-4 px-5 py-3 sm:px-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ink-deep)] text-[color:var(--canvas)]">
                            <QrCode className="h-4 w-4" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-base font-bold leading-[1.5] [letter-spacing:-0.16px] text-[color:var(--ink-deep)]">Sistem Absen</p>
                            <p className="text-xs leading-[1.33] text-[color:var(--steel)]">QR absen permanen</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggle}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--canvas)] text-[color:var(--ink)] transition hover:bg-[color:var(--surface-soft)]"
                        aria-label="Ganti tema"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className={cn('mx-auto max-w-[var(--container-marketing)] px-5 pb-20 pt-12 sm:px-10 sm:pt-20', className)}>
                {children}
            </main>

            {/* Footer — DESIGN.md `footer-region` */}
            <footer className="border-t border-[color:var(--hairline-soft)] bg-[color:var(--canvas)]">
                <div className="mx-auto max-w-[var(--container-marketing)] px-5 py-10 text-center text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--steel)] sm:px-10">
                    © {new Date().getFullYear()} Sistem Absen — Sistem Absensi Barcode
                </div>
            </footer>
        </div>
    );
}
