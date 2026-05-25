import { QrCode } from 'lucide-react';

export function AuthShell({ children, eyebrow, title, description }) {
    return (
        <div className="relative min-h-screen bg-[color:var(--surface-base)]">
            <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
                <div className="mb-6 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--brand-600)] text-white">
                        <QrCode className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold tracking-tight">Sistem Absen</p>
                    </div>
                </div>

                <div className="w-full rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-6 sm:p-8">
                    <div className="mb-6 space-y-1.5">
                        {eyebrow && (
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        )}
                        {description && (
                            <p className="text-sm text-[color:var(--text-secondary)]">{description}</p>
                        )}
                    </div>
                    {children}
                </div>

                <p className="mt-6 text-center text-[11px] text-[color:var(--text-muted)]">
                    Akses dibatasi untuk pengurus.
                </p>
            </div>
        </div>
    );
}
