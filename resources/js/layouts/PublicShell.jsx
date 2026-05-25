import { useState } from 'react';
import { toggleTheme } from '@/lib/theme';
import { Moon, Sun, QrCode } from 'lucide-react';
import { cn } from '@/lib/cn';

export function PublicShell({ children, className }) {
    const [theme, setThemeState] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.dataset.theme : 'light',
    );

    function onToggle() {
        toggleTheme();
        setThemeState(document.documentElement.dataset.theme);
    }

    return (
        <div className="relative min-h-screen overflow-hidden gradient-mesh text-[color:var(--text-primary)]">
            <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--brand-600)] text-white">
                        <QrCode className="h-4 w-4" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold tracking-tight">Sistem Absen</p>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="rounded-[var(--radius-md)] border border-[color:var(--border-default)] bg-[color:var(--surface-raised)] p-2 transition hover:border-[color:var(--brand-300)]"
                    aria-label="Ganti tema"
                >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
            </header>
            <main className={cn('relative z-10 px-5 pb-12 sm:px-10', className)}>{children}</main>
            <footer className="relative z-10 px-5 pb-6 pt-2 text-center text-[11px] text-[color:var(--text-muted)] sm:px-10">
                © {new Date().getFullYear()} Sistem Absen — Sistem Absensi Barcode
            </footer>
        </div>
    );
}
