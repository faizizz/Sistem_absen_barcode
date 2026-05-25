import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';

/**
 * Blocking view shown when:
 *   - lookup-nim returned has_qr=true, OR
 *   - generate-qr returned 409 (QR already exists for this NIM).
 *
 * The public portal is one-time-only by policy: anggota yang sudah punya
 * QR tidak bisa generate ulang dari sini. Mereka harus hubungi admin yang
 * bisa unduh ulang QR mereka dari tab Anggota.
 */
export function AlreadyHasQrView({ profile, message, onReset }) {
    return (
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] shadow-[var(--shadow-sm)]">
            <div className="bg-gradient-to-br from-[color:var(--warning-bg)] to-[color:var(--surface-raised)] px-6 py-7 sm:px-8 sm:py-8">
                <Badge tone="warning" size="md">
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    QR Sudah Aktif
                </Badge>
                {profile ? (
                    <>
                        <h2 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-3xl text-[color:var(--text-primary)]">
                            {profile.nama}
                        </h2>
                        <p className="mt-1 font-mono text-sm text-[color:var(--text-secondary)] sm:text-base">
                            NIM {profile.nim}
                        </p>
                    </>
                ) : null}
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
                <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                    QR untuk NIM ini sudah pernah dibuat sebelumnya dan{' '}
                    <strong className="text-[color:var(--text-primary)]">
                        hanya bisa dibuat satu kali
                    </strong>
                    . Demi keamanan, portal ini tidak menampilkan ulang QR yang sudah ada.
                </p>

                {message ? (
                    <div
                        role="alert"
                        className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--warning-border)] bg-[color:var(--warning-bg)] px-4 py-3 text-sm text-[color:var(--warning-fg)]"
                    >
                        {message}
                    </div>
                ) : null}

                <div className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-4">
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                        Lupa atau hilang QR-nya?
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                        Hubungi admin pengurus untuk mendapatkan kembali QR-mu.
                    </p>
                </div>

                <div className="mt-6 flex flex-col gap-2 border-t border-[color:var(--border-subtle)] pt-5 sm:flex-row sm:justify-end">
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onReset}
                        leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                        className="w-full sm:w-auto"
                    >
                        Coba NIM lain
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default AlreadyHasQrView;
