import { useEffect, useRef } from 'react';
import {
    BriefcaseBusiness,
    Building2,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/primitives/Button';

export function ProfileConfirmationView({
    profile,
    loading,
    error,
    onConfirm,
    onReject,
}) {
    const headingRef = useRef(null);

    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    return (
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] shadow-[var(--shadow-sm)]">
            <div className="bg-gradient-to-br from-[color:var(--brand-600)] to-[color:var(--brand-800)] px-6 py-7 text-white sm:px-8 sm:py-8">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Profil Ditemukan
                </span>

                <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="mt-4 break-words text-3xl font-bold tracking-tight outline-none sm:text-4xl"
                >
                    {profile.nama}
                </h2>
                <p className="mt-1 font-mono text-sm text-white/85 sm:text-base">
                    NIM {profile.nim}
                </p>
            </div>

            <div className="bg-[color:var(--surface-raised)] px-6 py-6 sm:px-8 sm:py-7">
                <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                    Pastikan data ini benar sebelum membuat QR permanen.
                </p>

                <ul className="mt-5 space-y-4">
                    <ProfileDetailRow icon={Building2} label="Departemen">
                        <p className="text-base font-semibold leading-6 text-[color:var(--text-primary)] break-words">
                            {profile.departemen}
                        </p>
                    </ProfileDetailRow>
                    <ProfileDetailRow icon={BriefcaseBusiness} label="Jabatan">
                        <p className="text-base font-semibold leading-6 text-[color:var(--text-primary)] break-words">
                            {profile.jabatan}
                        </p>
                    </ProfileDetailRow>
                </ul>

                {error ? (
                    <div
                        role="alert"
                        className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] px-4 py-3 text-sm text-[color:var(--danger-fg)]"
                    >
                        {error}
                    </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-2 border-t border-[color:var(--border-subtle)] pt-5 sm:flex-row">
                    <Button
                        variant="primary"
                        size="lg"
                        loading={loading}
                        disabled={loading}
                        onClick={onConfirm}
                        aria-label="Buat QR code untuk profil saya"
                        className="w-full sm:flex-1"
                    >
                        Buat QR Code Saya
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        disabled={loading}
                        onClick={onReject}
                        aria-label="Bukan saya, kembali ke input NIM"
                        className="w-full sm:w-auto"
                    >
                        Bukan saya, ganti NIM
                    </Button>
                </div>
            </div>
        </section>
    );
}

function ProfileDetailRow({ icon: Icon, label, children }) {
    return (
        <li className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--brand-100)] bg-[color:var(--brand-50)] text-[color:var(--brand-700)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
                    {label}
                </p>
                <div className="mt-1">{children}</div>
            </div>
        </li>
    );
}

export default ProfileConfirmationView;
