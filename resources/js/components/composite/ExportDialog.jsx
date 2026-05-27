import { useState } from 'react';
import { Dialog } from '@/components/primitives/Dialog';
import { Button } from '@/components/primitives/Button';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Download } from 'lucide-react';

/**
 * ExportDialog — Meta-flow: ghost "Batal" + cobalt commerce CTA.
 * The dialog itself is rendered by `Dialog` (24px radius, ink overlay).
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

    function handleSubmit(e) {
        e.preventDefault();
        window.location.assign(buildHref());
        onClose();
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Batal</Button>
                    <Button
                        variant="buy"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={handleSubmit}
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
