import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card } from '@/components/composite/Card';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { Dialog } from '@/components/primitives/Dialog';
import { Input } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { DataTable } from '@/components/composite/DataTable';
import { EmptyState } from '@/components/composite/EmptyState';
import { toast } from '@/lib/toast';
import {
    UserPlus,
    Trash2,
    KeyRound,
    Shield,
    ShieldOff,
    UnlockKeyhole,
    Eye,
    EyeOff,
    Users as UsersIcon,
} from 'lucide-react';

/**
 * Admin Users Index — manajemen akun admin.
 *
 * Menampilkan seluruh user dengan role admin:
 *   - login_code, status (aktif / terkunci sementara / terkunci permanen / wajib ganti password)
 *   - last_login_at, last_login_ip
 *   - tombol Unlock (muncul jika status terkunci)
 *   - tombol Hapus (disabled jika diri sendiri atau hanya tersisa minAdmins)
 *
 * Tombol "Tambah Admin" membuka dialog dengan form login_code +
 * password + konfirmasi. Server akan memvalidasi pakai
 * StrongPassword rule.
 */

const STATUS_BADGE = {
    active:                { tone: 'successSoft', label: 'Aktif' },
    must_change_password:  { tone: 'warningSoft', label: 'Wajib Ganti Password' },
    locked_temporary:      { tone: 'warning',     label: 'Terkunci Sementara' },
    locked_permanent:      { tone: 'danger',      label: 'Terkunci Permanen' },
};

export default function AdminUsersIndex({ admins, currentUserId, minAdmins }) {
    const { props } = usePage();
    const flashError = props.flash?.error;
    const [createOpen, setCreateOpen] = useState(false);

    const totalAdmins = admins.length;

    function statusBadge(row) {
        const cfg = STATUS_BADGE[row.status] ?? STATUS_BADGE.active;
        const detail =
            row.status === 'locked_temporary' && row.status_detail !== null
                ? ` (${row.status_detail} mnt)`
                : '';
        return (
            <Badge tone={cfg.tone} size="sm">
                {cfg.label}
                {detail}
            </Badge>
        );
    }

    function onUnlock(row) {
        if (row.id === currentUserId) {
            toast.error('Tidak dapat membuka kunci akun sendiri.');
            return;
        }
        if (!confirm(`Buka kunci akun ${row.login_code}? Counter percobaan akan direset.`)) return;
        router.post(
            `/kuasa/admins/${row.id}/unlock`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Akun ${row.login_code} dibuka.`),
                onError: (errors) => {
                    const msg = Object.values(errors)[0] ?? 'Gagal membuka kunci akun.';
                    toast.error(msg);
                },
            }
        );
    }

    function onDelete(row) {
        if (row.id === currentUserId) {
            toast.error('Tidak dapat menghapus akun sendiri.');
            return;
        }
        if (totalAdmins <= minAdmins) {
            toast.error(`Tidak boleh menghapus admin: minimal ${minAdmins} admin harus aktif.`);
            return;
        }
        if (!confirm(`Hapus akun admin ${row.login_code}? Tindakan ini tidak bisa dibatalkan.`)) return;
        router.delete(`/kuasa/admins/${row.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Akun ${row.login_code} dihapus.`),
            onError: (errors) => {
                const msg = Object.values(errors)[0] ?? 'Gagal menghapus akun.';
                toast.error(msg);
            },
        });
    }

    const columns = useMemo(
        () => [
            {
                key: 'login_code',
                label: 'Kode Admin',
                render: (r) => (
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[color:var(--steel)]" />
                        <span className="font-medium">{r.login_code}</span>
                        {r.id === currentUserId && (
                            <Badge tone="ink" size="sm">Anda</Badge>
                        )}
                    </div>
                ),
            },
            {
                key: 'status',
                label: 'Status',
                render: statusBadge,
            },
            {
                key: 'last_login',
                label: 'Login Terakhir',
                render: (r) =>
                    r.last_login_at ? (
                        <div className="text-sm">
                            <p>{r.last_login_at}</p>
                            <p className="text-xs text-[color:var(--steel)] font-mono">{r.last_login_ip ?? '—'}</p>
                        </div>
                    ) : (
                        <span className="text-sm text-[color:var(--steel)]">Belum pernah</span>
                    ),
            },
            {
                key: 'attempts',
                label: 'Percobaan / Siklus',
                render: (r) => (
                    <span className="text-sm font-mono">
                        {r.failed_login_attempts} / {r.lockout_cycles}
                    </span>
                ),
            },
            {
                key: 'actions',
                label: 'Aksi',
                align: 'right',
                render: (r) => {
                    const isLocked = r.status === 'locked_temporary' || r.status === 'locked_permanent';
                    const isSelf = r.id === currentUserId;
                    const cantDelete = isSelf || totalAdmins <= minAdmins;
                    return (
                        <div className="flex justify-end gap-2">
                            {isLocked && (
                                <Button
                                    size="xs"
                                    variant="warningSoft"
                                    onClick={() => onUnlock(r)}
                                    disabled={isSelf}
                                    leftIcon={<UnlockKeyhole className="h-3.5 w-3.5" />}
                                >
                                    Buka Kunci
                                </Button>
                            )}
                            <Button
                                size="xs"
                                variant="dangerSoft"
                                onClick={() => onDelete(r)}
                                disabled={cantDelete}
                                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                                title={
                                    isSelf
                                        ? 'Tidak dapat menghapus akun sendiri'
                                        : totalAdmins <= minAdmins
                                          ? `Minimal ${minAdmins} admin harus aktif`
                                          : 'Hapus admin'
                                }
                            >
                                Hapus
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [currentUserId, totalAdmins, minAdmins]
    );

    function mobileItem(r) {
        const isLocked = r.status === 'locked_temporary' || r.status === 'locked_permanent';
        const isSelf = r.id === currentUserId;
        const cantDelete = isSelf || totalAdmins <= minAdmins;
        return (
            <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[color:var(--steel)]" />
                            <p className="font-bold text-sm">{r.login_code}</p>
                            {isSelf && <Badge tone="ink" size="sm">Anda</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-[color:var(--steel)]">
                            {r.last_login_at ? `Login: ${r.last_login_at} · ${r.last_login_ip ?? '—'}` : 'Belum pernah login'}
                        </p>
                        <p className="text-xs text-[color:var(--steel)] font-mono">
                            Gagal: {r.failed_login_attempts} · Siklus: {r.lockout_cycles}
                        </p>
                    </div>
                    {statusBadge(r)}
                </div>
                <div className="flex flex-wrap gap-2">
                    {isLocked && (
                        <Button
                            size="xs"
                            variant="warningSoft"
                            onClick={() => onUnlock(r)}
                            disabled={isSelf}
                            leftIcon={<UnlockKeyhole className="h-3.5 w-3.5" />}
                        >
                            Buka Kunci
                        </Button>
                    )}
                    <Button
                        size="xs"
                        variant="dangerSoft"
                        onClick={() => onDelete(r)}
                        disabled={cantDelete}
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                        Hapus
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <AdminShell
            eyebrow="Keamanan"
            title="Manajemen Admin"
            description={`Atur akun admin yang dapat mengakses dashboard. Sistem wajib memiliki minimal ${minAdmins} admin agar fitur unlock tetap dapat digunakan.`}
            actions={
                <Button
                    variant="primary"
                    onClick={() => setCreateOpen(true)}
                    leftIcon={<UserPlus className="h-4 w-4" />}
                >
                    Tambah Admin
                </Button>
            }
        >
            <Head title="Manajemen Admin" />

            {flashError && (
                <div className="mb-5 rounded-[var(--radius-xl)] border border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] p-4 text-sm text-[color:var(--danger-fg)]">
                    {flashError}
                </div>
            )}

            <Card padding="md" variant="softTile" className="mb-5">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-[color:var(--steel)]" />
                        <span>
                            <strong>{totalAdmins}</strong> admin aktif
                        </span>
                    </div>
                    <span className="text-[color:var(--steel)]">·</span>
                    <span className="text-[color:var(--charcoal)]">
                        Minimum: <strong>{minAdmins}</strong>
                    </span>
                    {totalAdmins <= minAdmins && (
                        <Badge tone="warningSoft" size="sm">
                            Tambah admin baru sebelum dapat menghapus
                        </Badge>
                    )}
                </div>
            </Card>

            <DataTable
                columns={columns}
                rows={admins}
                mobileItem={mobileItem}
                emptyState={
                    <EmptyState
                        icon={ShieldOff}
                        title="Belum ada admin"
                        description="Klik tombol Tambah Admin untuk membuat akun admin pertama."
                    />
                }
            />

            <CreateAdminDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        </AdminShell>
    );
}

/**
 * Dialog form pembuatan admin baru. Form fields login_code, password,
 * password_confirmation. Validasi dijalankan server-side via
 * StoreAdminUserRequest + StrongPassword rule, errors di-render di
 * Field.
 */
function CreateAdminDialog({ open, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login_code: '',
        password: '',
        password_confirmation: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    function close() {
        reset();
        onClose();
    }

    function submit(e) {
        e.preventDefault();
        if (data.password !== data.password_confirmation) {
            toast.error('Konfirmasi password tidak cocok.');
            return;
        }
        post('/kuasa/admins', {
            preserveScroll: true,
            onSuccess: () => {
                close();
                toast.success('Admin baru berhasil dibuat.');
            },
        });
    }

    return (
        <Dialog
            open={open}
            onClose={close}
            title="Tambah Admin Baru"
            description="Akun yang dibuat akan dipaksa mengganti password pada login pertama."
            size="md"
            footer={
                <>
                    <Button variant="ghost" onClick={close} disabled={processing}>
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submit}
                        loading={processing}
                        leftIcon={<UserPlus className="h-4 w-4" />}
                    >
                        Buat Admin
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field
                    label="Kode Admin"
                    required
                    value={data.login_code}
                    error={errors.login_code}
                    htmlFor="new_login_code"
                    hint="Hanya huruf, angka, underscore, dan dash. Minimal 3 karakter."
                >
                    <Input
                        id="new_login_code"
                        value={data.login_code}
                        onChange={(e) => setData('login_code', e.target.value)}
                        placeholder="contoh: ketua-2026"
                        autoComplete="off"
                        required
                    />
                </Field>

                <Field
                    label="Password"
                    required
                    value={data.password}
                    error={errors.password}
                    htmlFor="new_admin_password"
                    hint="Minimal 12 karakter, gabungan huruf besar, kecil, angka, dan simbol."
                >
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                        <Input
                            id="new_admin_password"
                            type={showPass ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password kuat"
                            className="pl-10 pr-12"
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
                            aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>

                <Field
                    label="Konfirmasi Password"
                    required
                    value={data.password_confirmation}
                    error={errors.password_confirmation}
                    htmlFor="new_admin_password_confirmation"
                >
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                        <Input
                            id="new_admin_password_confirmation"
                            type={showConfirm ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Ulangi password"
                            className="pl-10 pr-12"
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
                            aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>
            </form>
        </Dialog>
    );
}
