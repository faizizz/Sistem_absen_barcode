import { Head, Link, useForm } from '@inertiajs/react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card } from '@/components/composite/Card';
import { Button } from '@/components/primitives/Button';
import { Input, Textarea } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { Select } from '@/components/primitives/Select';
import { ArrowLeft, Save } from 'lucide-react';

export default function EventForm({ event, departments }) {
    const isEdit = !!event?.id;
    const { data, setData, post, put, processing, errors } = useForm({
        nama_kegiatan: event?.nama_kegiatan ?? '',
        deskripsi: event?.deskripsi ?? '',
        tanggal_mulai: event?.tanggal_mulai ?? '',
        tanggal_selesai: event?.tanggal_selesai ?? '',
        waktu_mulai: event?.waktu_mulai ?? '',
        waktu_selesai: event?.waktu_selesai ?? '',
        batas_absensi: event?.batas_absensi ?? '',
        departemen: event?.departemen ?? '',
    });

    function submit(e) {
        e.preventDefault();
        const payload = { ...data, departemen: data.departemen || null };
        if (isEdit) {
            put(`/kuasa/events/${event.id}`, { data: payload });
        } else {
            post('/kuasa/events', { data: payload });
        }
    }

    const requiredOk =
        data.nama_kegiatan.trim() !== '' &&
        data.tanggal_mulai !== '' &&
        data.tanggal_selesai !== '' &&
        data.waktu_mulai !== '' &&
        data.waktu_selesai !== '';

    const deptOptions = [
        { value: '', label: 'Semua departemen' },
        ...departments.map((d) => ({ value: d, label: d })),
    ];

    return (
        <AdminShell
            title={isEdit ? `Edit · ${event.nama_kegiatan}` : 'Event Baru'}
            actions={
                <Button as={Link} href="/kuasa/events" variant="ghost" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Kembali
                </Button>
            }
        >
            <Head title={isEdit ? 'Edit Event' : 'Event Baru'} />

            <form onSubmit={submit} className="max-w-3xl">
                <Card padding="lg" className="space-y-5">
                    <Field label="Nama Kegiatan" required value={data.nama_kegiatan} error={errors.nama_kegiatan} htmlFor="nama_kegiatan">
                        <Input
                            id="nama_kegiatan"
                            value={data.nama_kegiatan}
                            onChange={(e) => setData('nama_kegiatan', e.target.value)}
                            placeholder="Contoh: Forum Bersama"
                            autoFocus
                        />
                    </Field>

                    <Field label="Deskripsi" error={errors.deskripsi} hint="Opsional" htmlFor="deskripsi">
                        <Textarea
                            id="deskripsi"
                            value={data.deskripsi}
                            onChange={(e) => setData('deskripsi', e.target.value)}
                            placeholder="Detail singkat kegiatan…"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Tanggal Mulai" required value={data.tanggal_mulai} error={errors.tanggal_mulai} htmlFor="tanggal_mulai">
                            <Input
                                id="tanggal_mulai"
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) => setData('tanggal_mulai', e.target.value)}
                            />
                        </Field>
                        <Field label="Tanggal Selesai" required value={data.tanggal_selesai} error={errors.tanggal_selesai} htmlFor="tanggal_selesai">
                            <Input
                                id="tanggal_selesai"
                                type="date"
                                value={data.tanggal_selesai}
                                min={data.tanggal_mulai || undefined}
                                onChange={(e) => setData('tanggal_selesai', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Waktu Mulai" required value={data.waktu_mulai} error={errors.waktu_mulai} htmlFor="waktu_mulai">
                            <Input
                                id="waktu_mulai"
                                type="time"
                                value={data.waktu_mulai}
                                onChange={(e) => setData('waktu_mulai', e.target.value)}
                            />
                        </Field>
                        <Field label="Waktu Selesai" required value={data.waktu_selesai} error={errors.waktu_selesai} htmlFor="waktu_selesai">
                            <Input
                                id="waktu_selesai"
                                type="time"
                                value={data.waktu_selesai}
                                onChange={(e) => setData('waktu_selesai', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                            label="Batas Absensi"
                            error={errors.batas_absensi}
                            hint="Setelah jam ini status menjadi terlambat. Kosongkan untuk +15 menit dari mulai."
                            htmlFor="batas_absensi"
                        >
                            <Input
                                id="batas_absensi"
                                type="time"
                                value={data.batas_absensi}
                                onChange={(e) => setData('batas_absensi', e.target.value)}
                            />
                        </Field>
                        <Field
                            label="Departemen"
                            error={errors.departemen}
                            hint="Pilih satu departemen, atau biarkan untuk lintas departemen."
                        >
                            <Select
                                value={data.departemen}
                                onChange={(v) => setData('departemen', v)}
                                options={deptOptions}
                            />
                        </Field>
                    </div>
                </Card>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button as={Link} href="/kuasa/events" variant="ghost" fullWidth>
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={processing}
                        disabled={!requiredOk}
                        leftIcon={<Save className="h-4 w-4" />}
                        fullWidth
                    >
                        {isEdit ? 'Simpan Perubahan' : 'Buat Event'}
                    </Button>
                </div>
            </form>
        </AdminShell>
    );
}
