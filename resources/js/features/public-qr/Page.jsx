import { useReducer } from 'react';
import { Head } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import { PublicShell } from '@/layouts/PublicShell';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { Dialog } from '@/components/primitives/Dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { reducer, initialState, VIEW } from './publicQrMachine';
import { ProfileConfirmationView } from './ProfileConfirmationView';
import { QrDisplayView } from './QrDisplayView';
import { AlreadyHasQrView } from './AlreadyHasQrView';

export default function PublicQrPage() {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Layout availability guard: if PublicShell is not available at render
    // time, do not render any inner view — there is no shell to host them.
    if (!PublicShell) {
        return null;
    }

    async function handleLookup(e) {
        e?.preventDefault();
        if (!state.nim.trim()) {
            toast.error('Isi NIM terlebih dahulu.');
            return;
        }
        dispatch({ type: 'LOOKUP_REQUEST' });
        try {
            const { data } = await api.post('/lookup-nim', { nim: state.nim });
            dispatch({
                type: 'LOOKUP_SUCCESS',
                profile: data,
                hasQr: Boolean(data?.has_qr),
            });
        } catch (err) {
            if (err?.sessionExpired) return;
            const message = err?.response?.data?.message ?? 'NIM tidak ditemukan.';
            dispatch({ type: 'LOOKUP_FAILURE', message });
            toast.error(message);
        }
    }

    async function handleGenerate() {
        if (!state.profile) return;
        dispatch({ type: 'GENERATE_REQUEST' });
        try {
            const { data } = await api.post('/generate-qr', { nim: state.profile.nim });
            dispatch({ type: 'GENERATE_SUCCESS', qrToken: data.qr_code });
            toast.success('QR Code permanen siap.');
        } catch (err) {
            if (err?.sessionExpired) return;
            const status = err?.response?.status;
            const message =
                err?.response?.data?.message ?? 'Gagal membuat QR. Coba lagi.';

            if (status === 409) {
                // Server says QR already exists — switch to the blocking
                // view instead of treating this as a retryable error.
                dispatch({ type: 'GENERATE_BLOCKED', message });
                toast.error(message);
                return;
            }

            dispatch({ type: 'GENERATE_FAILURE', message });
            toast.error(message);
        }
    }

    function handleNimChange(e) {
        dispatch({ type: 'NIM_CHANGED', value: e.target.value });
    }

    function handleReject() {
        dispatch({ type: 'REJECT' });
    }

    function handleReset() {
        dispatch({ type: 'RESET' });
    }

    function handleAcknowledge() {
        dispatch({ type: 'ACKNOWLEDGE_ONE_TIME' });
    }

    return (
        <PublicShell>
            <Head title="QR Absen" />
            <div className="mx-auto flex max-w-xl flex-col gap-6">
                <section className="text-center">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        QR Absen Permanen
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--text-secondary)] sm:text-base">
                        Masukkan NIM untuk validasi profil, lalu buat QR permanen milikmu.
                    </p>
                </section>

                {state.view === VIEW.LOOKUP && (
                    <form
                        onSubmit={handleLookup}
                        className="rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-5 sm:p-7"
                    >
                        <Field
                            label="NIM Mahasiswa"
                            error={state.error}
                            hint="Contoh: 280911067"
                            htmlFor="nim"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    id="nim"
                                    value={state.nim}
                                    onChange={handleNimChange}
                                    placeholder="Masukkan NIM Anda"
                                    autoFocus
                                    autoComplete="off"
                                    inputMode="numeric"
                                    className="text-base sm:flex-1"
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    loading={state.loading.lookup}
                                >
                                    Cari Profil
                                </Button>
                            </div>
                        </Field>
                    </form>
                )}

                {state.view === VIEW.CONFIRM && (
                    <ProfileConfirmationView
                        profile={state.profile}
                        loading={state.loading.generate}
                        error={state.error}
                        onConfirm={handleGenerate}
                        onReject={handleReject}
                    />
                )}

                {state.view === VIEW.ALREADY_HAS_QR && (
                    <AlreadyHasQrView
                        profile={state.profile}
                        message={state.error}
                        onReset={handleReset}
                    />
                )}

                {state.view === VIEW.QR && (
                    <QrDisplayView
                        qrToken={state.qrToken}
                        profile={state.profile}
                        onReset={handleReset}
                    />
                )}
            </div>

            <OneTimeWarningDialog
                open={Boolean(state.showOneTimeWarning)}
                onAcknowledge={handleAcknowledge}
            />
        </PublicShell>
    );
}

/**
 * Mandatory acknowledgement after a successful first-time QR generation.
 * The user MUST click "Saya Mengerti" before they can interact with the
 * QR display — onClose is wired to the same acknowledge handler so any
 * dismissal counts as acknowledgement.
 */
function OneTimeWarningDialog({ open, onAcknowledge }) {
    return (
        <Dialog
            open={open}
            onClose={onAcknowledge}
            title={
                <span className="inline-flex items-center gap-2">
                    <ShieldAlert
                        className="h-5 w-5 text-[color:var(--warning-fg)]"
                        aria-hidden="true"
                    />
                    QR hanya bisa dibuat sekali
                </span>
            }
            description="Bacalah dengan teliti sebelum menutup dialog."
            footer={
                <div className="flex w-full justify-center">
                    <Button variant="primary" size="md" onClick={onAcknowledge}>
                        Saya Mengerti, Simpan QR Saya
                    </Button>
                </div>
            }
        >
            <div className="space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                <p>
                    QR di balik dialog ini adalah{' '}
                    <strong className="text-[color:var(--text-primary)]">
                        QR permanen kamu
                    </strong>
                    . QR yang sama akan dipakai untuk semua absensi event ke depan.
                </p>
                <p>
                    Portal ini{' '}
                    <strong className="text-[color:var(--text-primary)]">
                        tidak akan menampilkan ulang QR ini
                    </strong>{' '}
                    di kunjungan berikutnya. Pastikan kamu:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>Unduh PNG-nya sekarang, atau</li>
                    <li>Simpan ke galeri lewat tombol "Simpan ke Foto", atau</li>
                    <li>Screenshot dan simpan di tempat aman.</li>
                </ul>
                <p className="text-[color:var(--text-muted)]">
                    Kalau kelupaan dan QR-nya hilang, kamu harus menghubungi admin pengurus
                    untuk minta unduh ulang.
                </p>
            </div>
        </Dialog>
    );
}
