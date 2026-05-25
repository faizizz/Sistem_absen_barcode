import { Head, Link, useForm } from '@inertiajs/react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card } from '@/components/composite/Card';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { Select } from '@/components/primitives/Select';
import { ArrowLeft, Save } from 'lucide-react';

export default function MemberForm({ member, departments }) {
    const isEdit = !!member?.id;
    const { data, setData, post, put, processing, errors } = useForm({
        nama: member?.nama ?? '',
        nim: member?.nim ?? '',
        departemen: member?.departemen ?? departments[0] ?? '',
        jabatan: member?.jabatan ?? '',
    });

    const requiredOk =
        data.nama.trim() !== '' &&
        data.nim.trim() !== '' &&
        data.departemen !== '' &&
        data.jabatan.trim() !== '';

    function submit(e) {
        e.preventDefault();
        if (!requiredOk) return;
        if (isEdit) {
            put(`/kuasa/members/${member.id}`);
        } else {
            post('/kuasa/members');
        }
    }

    return (
        <AdminShell
            title={isEdit ? `Edit · ${member.nama}` : 'Anggota Baru'}
            description="QR dibuat oleh anggota saat mereka memasukkan NIM di halaman awal."
            actions={
                <Button as={Link} href="/kuasa/members" variant="ghost" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Kembali
                </Button>
            }
        >
            <Head title={isEdit ? 'Edit Anggota' : 'Anggota Baru'} />
            <form onSubmit={submit} className="max-w-2xl">
                <Card padding="lg" className="space-y-5">
                    <Field label="Nama Lengkap" required value={data.nama} error={errors.nama} htmlFor="nama">
                        <Input
                            id="nama"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            autoFocus
                        />
                    </Field>
                    <Field label="NIM" required value={data.nim} error={errors.nim} htmlFor="nim">
                        <Input
                            id="nim"
                            value={data.nim}
                            onChange={(e) => setData('nim', e.target.value)}
                            className="font-mono"
                            inputMode="numeric"
                        />
                    </Field>
                    <Field label="Departemen" required value={data.departemen} error={errors.departemen}>
                        <Select
                            value={data.departemen}
                            onChange={(v) => setData('departemen', v)}
                            options={departments.map((d) => ({ value: d, label: d }))}
                        />
                    </Field>
                    <Field label="Jabatan" required value={data.jabatan} error={errors.jabatan} htmlFor="jabatan">
                        <Input
                            id="jabatan"
                            value={data.jabatan}
                            onChange={(e) => setData('jabatan', e.target.value)}
                            placeholder="Contoh: Anggota, Kepala Biro, Sekretaris"
                        />
                    </Field>
                </Card>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button as={Link} href="/kuasa/members" variant="ghost" fullWidth>
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
                        {isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
                    </Button>
                </div>
            </form>
        </AdminShell>
    );
}
