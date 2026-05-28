import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card } from '@/components/composite/Card';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Badge } from '@/components/primitives/Badge';
import { DataTable } from '@/components/composite/DataTable';
import { EmptyState } from '@/components/composite/EmptyState';
import { Pagination } from '@/components/composite/Pagination';
import { History, Search, ChevronDown, ChevronUp } from 'lucide-react';

const TONE = {
    'event.create': 'brand',
    'event.update': 'info',
    'event.delete': 'danger',
    'event.activate': 'success',
    'event.close': 'warning',
    'member.create': 'accent',
    'member.update': 'info',
    'member.delete': 'danger',
    'member.qr_activate': 'brand',
    'attendance.scan': 'success',
    'attendance.permission': 'info',
    'attendance.mark_alpha': 'danger',
    'attendance.reset': 'warning',
    'attendance.export': 'accent',
    'auth.login.success': 'success',
    'auth.login.failed': 'danger',
    'auth.login.locked_attempt': 'warning',
    'auth.login.role_denied': 'danger',
    'auth.logout': 'neutral',
    'auth.lockout_triggered': 'warning',
    'auth.permanent_lock': 'critical',
    'auth.admin_unlocked': 'success',
    'auth.password_changed': 'info',
    'admin.user.created': 'brand',
    'admin.user.deleted': 'danger',
};

/**
 * Mapping label Indonesian untuk action audit log. Jika action tidak
 * ada di mapping, fallback ke value mentah (mis. action baru yang
 * belum dilabeli).
 */
const ACTION_LABEL = {
    'event.create': 'Buat Event',
    'event.update': 'Ubah Event',
    'event.delete': 'Hapus Event',
    'event.activate': 'Aktifkan Event',
    'event.close': 'Tutup Event',
    'member.create': 'Tambah Anggota',
    'member.update': 'Ubah Anggota',
    'member.delete': 'Hapus Anggota',
    'member.qr_activate': 'Aktivasi QR',
    'attendance.scan': 'Scan Absensi',
    'attendance.permission': 'Catat Izin/Sakit',
    'attendance.mark_alpha': 'Tandai Alpha',
    'attendance.reset': 'Reset Absensi',
    'attendance.export': 'Ekspor Absensi',
    'auth.login.success': 'Login Berhasil',
    'auth.login.failed': 'Login Gagal',
    'auth.login.locked_attempt': 'Login pada Akun Terkunci',
    'auth.login.role_denied': 'Login Ditolak (Bukan Admin)',
    'auth.logout': 'Logout',
    'auth.lockout_triggered': 'Akun Dikunci Sementara',
    'auth.permanent_lock': 'Akun Dikunci Permanen',
    'auth.admin_unlocked': 'Akun Dibuka oleh Admin',
    'auth.password_changed': 'Password Diganti',
    'admin.user.created': 'Admin Baru Dibuat',
    'admin.user.deleted': 'Admin Dihapus',
};

function actionLabel(action) {
    return ACTION_LABEL[action] ?? action;
}

export default function AuditIndex({ logs, actions, filters }) {
    const [action, setAction] = useState(filters?.action ?? '');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [expanded, setExpanded] = useState(() => new Set());

    const filtersTouched =
        action !== (filters?.action ?? '') ||
        from !== (filters?.from ?? '') ||
        to !== (filters?.to ?? '');
    const filtersApplied = !!(filters?.action || filters?.from || filters?.to);

    function apply(e) {
        e?.preventDefault();
        router.get('/kuasa/audit-logs', { action, from, to }, { preserveScroll: true, preserveState: true });
    }

    function clear() {
        setAction(''); setFrom(''); setTo('');
        router.get('/kuasa/audit-logs', {}, { preserveScroll: true });
    }

    function toggleExpand(id) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const actionOptions = [
        { value: '', label: 'Semua aksi' },
        ...actions.map((a) => ({ value: a, label: actionLabel(a) })),
    ];

    const columns = [
        {
            key: 'created_at',
            label: 'Waktu',
            render: (l) => <span className="whitespace-nowrap text-sm">{l.created_at}</span>,
        },
        {
            key: 'action',
            label: 'Aksi',
            render: (l) => <Badge tone={TONE[l.action] ?? 'neutral'} size="sm">{actionLabel(l.action)}</Badge>,
        },
        {
            key: 'description',
            label: 'Deskripsi',
            render: (l) => (
                <div>
                    <p className="text-sm">{l.description}</p>
                    {l.metadata && (
                        <pre className="mt-1 max-w-md overflow-x-auto rounded bg-[color:var(--surface-base)] p-1.5 text-[10px] text-[color:var(--text-muted)]">
                            {JSON.stringify(l.metadata)}
                        </pre>
                    )}
                </div>
            ),
        },
        { key: 'actor', label: 'Aktor', render: (l) => <span className="text-sm">{l.actor}</span> },
        { key: 'ip_address', label: 'IP', render: (l) => <span className="font-mono text-xs">{l.ip_address ?? '—'}</span> },
    ];

    function mobileItem(l) {
        const isOpen = expanded.has(l.id);
        return (
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{l.description}</p>
                        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            {l.created_at} · {l.actor}
                        </p>
                    </div>
                    <Badge tone={TONE[l.action] ?? 'neutral'} size="sm">{actionLabel(l.action)}</Badge>
                </div>
                {l.metadata && (
                    <button
                        type="button"
                        onClick={() => toggleExpand(l.id)}
                        className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-[22px] py-[10px] text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--ink-deep)] hover:bg-[color:var(--surface-soft)]"
                    >
                        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isOpen ? 'Sembunyikan detail' : 'Lihat detail'}
                    </button>
                )}
                {isOpen && l.metadata && (
                    <pre className="overflow-x-auto rounded bg-[color:var(--surface-base)] p-2 text-[10px] text-[color:var(--text-muted)]">
                        {JSON.stringify(l.metadata, null, 2)}
                    </pre>
                )}
                <p className="text-[10px] font-mono text-[color:var(--text-muted)]">
                    IP {l.ip_address ?? '—'}
                </p>
            </div>
        );
    }

    return (
        <AdminShell title="Audit">
            <Head title="Audit Log" />

            <Card padding="md" className="mb-5">
                <form onSubmit={apply} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                            Aksi
                        </label>
                        <Select value={action} onChange={setAction} options={actionOptions} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                            Dari
                        </label>
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                            Sampai
                        </label>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            className="flex-1"
                            disabled={!filtersTouched}
                            leftIcon={<Search className="h-4 w-4" />}
                        >
                            Cari
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={clear}
                            disabled={!filtersApplied}
                        >
                            Reset
                        </Button>
                    </div>
                </form>
            </Card>

            <DataTable
                columns={columns}
                rows={logs.data}
                mobileItem={mobileItem}
                emptyState={<EmptyState icon={History} title="Belum ada log" />}
            />

            <Pagination links={logs.links} className="mt-6" />
        </AdminShell>
    );
}
