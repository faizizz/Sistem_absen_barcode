import { useState } from 'react';
import { Dialog } from '@/components/primitives/Dialog';
import { Button } from '@/components/primitives/Button';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Download } from 'lucide-react';
import { toast } from '@/lib/toast';

/**
 * ExportDialog — Meta-flow: ghost "Batal" + cobalt commerce CTA.
 * The dialog itself is rendered by `Dialog` (24px radius, ink overlay).
 *
 * Why fetch + blob instead of `window.location.assign`?
 *   - A top-level navigation depends entirely on the server sending
 *     `Content-Disposition: attachment` for the browser to trigger a
 *     download instead of rendering the bytes inline. On reverse-proxied
 *     hosts (Railway, etc.) the header sometimes gets stripped or the
 *     response gets redirected, leaving the user on the same page with
 *     no visible feedback.
 *   - With fetch we can:
 *       1) inspect status / Content-Type / body so any non-xlsx response
 *          surfaces as a real toast instead of silent failure;
 *       2) drive the download from a blob URL we control, so the
 *          download trigger is independent of the server header chain;
 *       3) show a loading state on the CTA so the click feels acknowledged.
 */
export function ExportDialog({
    open,
    onClose,
    events = [],
    lockedEventId = null,
    title = 'Ekspor Rekap Absensi',
    description = 'Atur filter event dan rentang tanggal. File XLSX akan terunduh otomatis.',
}) {
    const [eventId, setEventId] = useState(lockedEventId ?? '');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const eventOptions = [
        { value: '', label: 'Semua event' },
        ...events.map((ev) => ({
            value: String(ev.id),
            label: ev.tanggal
                ? `${ev.nama_kegiatan} · ${ev.tanggal}`
                : ev.nama_kegiatan,
        })),
    ];

    function buildHref() {
        const params = new URLSearchParams();
        const effectiveEvent = lockedEventId ?? eventId;
        if (effectiveEvent) params.set('event_id', String(effectiveEvent));
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const qs = params.toString();
        return `/kuasa/attendances/export${qs ? `?${qs}` : ''}`;
    }

    function fileNameFromHeader(disposition, fallback) {
        if (!disposition) return fallback;
        // RFC 6266 — try filename*=UTF-8'' first, fall back to plain filename=.
        const utf = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf) {
            try {
                return decodeURIComponent(utf[1]);
            } catch {
                /* fall through */
            }
        }
        const plain = disposition.match(/filename\s*=\s*"?([^";]+)"?/i);
        return plain ? plain[1] : fallback;
    }

    async function handleSubmit(e) {
        e?.preventDefault?.();
        if (submitting) return;
        setSubmitting(true);

        const url = buildHref();
        let response;

        try {
            response = await fetch(url, {
                credentials: 'same-origin',
                headers: {
                    Accept:
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*',
                },
            });
        } catch (err) {
            console.error('[Export] network error', err);
            toast.error('Gagal menghubungi server. Periksa koneksi internet Anda.');
            setSubmitting(false);
            return;
        }

        // Auth lapsed during long sessions — server redirects to login.
        // fetch follows the redirect so we land on a 200 HTML page; detect
        // this via Content-Type + body content rather than status alone.
        const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
        const isXlsx =
            contentType.includes('spreadsheetml') ||
            contentType.includes('officedocument');

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            console.error('[Export] HTTP', response.status, body.slice(0, 1000));
            toast.error(
                `Gagal export (HTTP ${response.status}). Detail tersedia di console browser.`,
            );
            setSubmitting(false);
            return;
        }

        if (!isXlsx) {
            const body = await response.text().catch(() => '');
            console.error(
                '[Export] unexpected content-type',
                contentType,
                body.slice(0, 1000),
            );
            // If the response looks like a Laravel/Inertia HTML redirect,
            // session has likely lapsed. Be specific so users know to retry
            // after refreshing the page.
            const looksLikeAuth =
                body.includes('login') || body.includes('Kuasa') || body.includes('Login');
            toast.error(
                looksLikeAuth
                    ? 'Sesi login Anda mungkin sudah habis. Refresh halaman lalu coba lagi.'
                    : 'Server mengembalikan format yang tidak terduga. Cek console untuk detail.',
            );
            setSubmitting(false);
            return;
        }

        const blob = await response.blob();
        if (blob.size === 0) {
            console.error('[Export] empty blob received');
            toast.error('File yang diterima kosong. Coba ulangi atau hubungi admin.');
            setSubmitting(false);
            return;
        }

        const filename = fileNameFromHeader(
            response.headers.get('Content-Disposition'),
            `rekap-kehadiran-${new Date().toISOString().slice(0, 10)}.xlsx`,
        );

        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Defer revocation so Safari finishes reading the blob before it
        // gets garbage-collected.
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1500);

        toast.success('File rekap kehadiran berhasil diunduh.');
        setSubmitting(false);
        onClose();
    }

    return (
        <Dialog
            open={open}
            onClose={submitting ? () => {} : onClose}
            title={title}
            description={description}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Batal
                    </Button>
                    <Button
                        variant="buy"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={handleSubmit}
                        loading={submitting}
                    >
                        Unduh XLSX
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {!lockedEventId && (
                    <Field
                        label="Event"
                        hint="Kosongkan untuk mengunduh semua event."
                    >
                        <Select
                            value={eventId}
                            onChange={setEventId}
                            options={eventOptions}
                        />
                    </Field>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Dari tanggal" hint="Opsional" htmlFor="export-from">
                        <Input
                            id="export-from"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </Field>
                    <Field label="Sampai tanggal" hint="Opsional" htmlFor="export-to">
                        <Input
                            id="export-to"
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            min={from || undefined}
                        />
                    </Field>
                </div>

                <p className="text-xs leading-relaxed text-[color:var(--steel)]">
                    Sheet yang dihasilkan: Ringkasan event, detail per event, rekap individu anggota.
                </p>
            </form>
        </Dialog>
    );
}
