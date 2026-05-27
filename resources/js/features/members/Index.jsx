import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card } from '@/components/composite/Card';
import { Button } from '@/components/primitives/Button';
import { Dropdown } from '@/components/primitives/Dropdown';
import { Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Badge } from '@/components/primitives/Badge';
import { Sheet } from '@/components/primitives/Sheet';
import { Dialog } from '@/components/primitives/Dialog';
import { DataTable } from '@/components/composite/DataTable';
import { EmptyState } from '@/components/composite/EmptyState';
import { Pagination } from '@/components/composite/Pagination';
import { ExportDialog } from '@/components/composite/ExportDialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
    Plus,
    Search,
    Users,
    Trash2,
    Pencil,
    History,
    Download,
    QrCode,
    ShieldCheck,
    ShieldOff,
    MoreHorizontal,
} from 'lucide-react';

const STATUS_LABEL = {
    hadir: 'Hadir',
    terlambat: 'Terlambat',
    izin: 'Izin',
    sakit: 'Sakit',
    alpha: 'Alpha',
};

export default function MembersIndex({ members, departments, filters, exportableEvents = [] }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [dept, setDept] = useState(filters?.departemen ?? '');
    const [historyMember, setHistoryMember] = useState(null);
    const [history, setHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    // QR modal state. `qrPayload` holds { qr_code, nama, nim, ... } when
    // we successfully fetched/activated; null while modal is closed.
    const [qrPayload, setQrPayload] = useState(null);
    const [qrLoadingId, setQrLoadingId] = useState(null);

    // Sticky page-actions sheet (Ekspor / Tambah Anggota) — mirrors the
    // event-detail "Aksi Event" sticky pattern.
    const [pageActionsOpen, setPageActionsOpen] = useState(false);

    const hasExportableEvents = (exportableEvents ?? []).length > 0;
    const filtersTouched = (filters?.search ?? '') !== search || (filters?.departemen ?? '') !== dept;

    function applyFilters(next = {}) {
        router.get('/kuasa/members', { search, departemen: dept, ...next }, { preserveScroll: true, preserveState: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilters();
    }

    function handleDelete(id) {
        if (!confirm('Hapus anggota ini? Semua data terkait akan dihilangkan.')) return;
        router.delete(`/kuasa/members/${id}`, { preserveScroll: true });
    }

    async function openHistory(m) {
        setHistoryMember(m);
        setHistory(null);
        setHistoryLoading(true);
        try {
            const { data } = await api.get(`/kuasa/members/${m.id}/attendance-history`);
            setHistory(data);
        } catch {
            setHistory({ attendances: { data: [] }, summary: null });
        } finally {
            setHistoryLoading(false);
        }
    }

    /**
     * Activate a QR for a member that doesn't have one yet, then open the
     * preview modal so the admin can download the freshly issued QR.
     * Refreshes the row after success so the badge flips to "Aktif".
     */
    async function activateQr(m) {
        if (!confirm(`Aktifkan QR untuk ${m.nama}? QR yang dibuat permanen dan tidak bisa di-reset.`)) return;
        setQrLoadingId(m.id);
        try {
            const { data } = await api.post(`/kuasa/members/${m.id}/qr/activate`);
            setQrPayload({
                ...data,
                departemen: m.departemen,
                jabatan: m.jabatan,
            });
            toast.success('QR berhasil diaktivasi.');
            // Refresh the table data so has_qr badge flips without a full reload.
            router.reload({ only: ['members'], preserveScroll: true, preserveState: true });
        } catch (err) {
            if (err?.sessionExpired) return;
            const status = err?.response?.status;
            const message = err?.response?.data?.message ?? 'Gagal mengaktivasi QR.';
            // 409 means QR already exists — fetch and show it instead.
            if (status === 409 && err?.response?.data?.qr_code) {
                setQrPayload({
                    ...err.response.data,
                    nama: m.nama,
                    nim: m.nim,
                    departemen: m.departemen,
                    jabatan: m.jabatan,
                });
                toast.success('QR sudah ada, menampilkan QR yang sudah aktif.');
                return;
            }
            toast.error(message);
        } finally {
            setQrLoadingId(null);
        }
    }

    /**
     * Open the QR preview modal for a member that already has a QR.
     */
    async function downloadQr(m) {
        setQrLoadingId(m.id);
        try {
            const { data } = await api.get(`/kuasa/members/${m.id}/qr`);
            setQrPayload({
                ...data,
                departemen: m.departemen,
                jabatan: m.jabatan,
            });
        } catch (err) {
            if (err?.sessionExpired) return;
            const message = err?.response?.data?.message ?? 'Gagal mengambil QR.';
            toast.error(message);
        } finally {
            setQrLoadingId(null);
        }
    }

    const deptOptions = [
        { value: '', label: 'Semua departemen' },
        ...departments.map((d) => ({ value: d, label: d })),
    ];

    /**
     * Mobile card renderer for member rows.
     *
     * Phone-first layout:
     *   1. Header: nama + status QR badge inline
     *   2. Identity meta (NIM · jabatan) and dept pill
     *   3. Primary QR action: full-width, sm size (h-10), clearly the main CTA
     *   4. Secondary actions: 3-column grid of equal-width sm buttons
     */
    function renderMobileMemberCard(m) {
        return (
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-[color:var(--text-primary)]">
                            {m.nama}
                        </p>
                        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            NIM {m.nim} · {m.jabatan}
                        </p>
                    </div>
                    {m.has_qr ? (
                        <Badge tone="success" size="sm" className="shrink-0">
                            <ShieldCheck className="h-3 w-3" /> QR Aktif
                        </Badge>
                    ) : (
                        <Badge tone="neutral" size="sm" className="shrink-0">
                            <ShieldOff className="h-3 w-3" /> Belum Aktif
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand" size="sm">
                        {m.departemen}
                    </Badge>
                </div>

                <div className="space-y-2 border-t border-[color:var(--border-subtle)] pt-3">
                    {m.has_qr ? (
                        <Button
                            onClick={() => downloadQr(m)}
                            variant="primary"
                            size="sm"
                            loading={qrLoadingId === m.id}
                            leftIcon={<Download className="h-4 w-4" />}
                            className="w-full"
                        >
                            Unduh QR
                        </Button>
                    ) : (
                        <Button
                            onClick={() => activateQr(m)}
                            variant="primary"
                            size="sm"
                            loading={qrLoadingId === m.id}
                            leftIcon={<QrCode className="h-4 w-4" />}
                            className="w-full"
                        >
                            Aktivasi QR
                        </Button>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            onClick={() => openHistory(m)}
                            variant="outline"
                            size="sm"
                            leftIcon={<History className="h-3.5 w-3.5" />}
                            className="!px-2"
                        >
                            Riwayat
                        </Button>
                        <Button
                            as={Link}
                            href={`/kuasa/members/${m.id}/edit`}
                            variant="outline"
                            size="sm"
                            leftIcon={<Pencil className="h-3.5 w-3.5" />}
                            className="!px-2"
                        >
                            Edit
                        </Button>
                        <Button
                            onClick={() => handleDelete(m.id)}
                            variant="dangerSoft"
                            size="sm"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            className="!px-2"
                        >
                            Hapus
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const columns = [
        {
            key: 'nama',
            label: 'Anggota',
            render: (m) => (
                <div>
                    <p className="font-medium">{m.nama}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">NIM {m.nim}</p>
                </div>
            ),
        },
        { key: 'departemen', label: 'Dept', render: (m) => <Badge tone="brand" size="sm">{m.departemen}</Badge> },
        { key: 'jabatan', label: 'Jabatan', render: (m) => <span className="text-sm">{m.jabatan}</span> },
        {
            key: 'qr',
            label: 'Status QR',
            render: (m) =>
                m.has_qr ? (
                    <Badge tone="success" size="sm">
                        <ShieldCheck className="h-3 w-3" /> Aktif
                    </Badge>
                ) : (
                    <Badge tone="neutral" size="sm">
                        <ShieldOff className="h-3 w-3" /> Belum aktif
                    </Badge>
                ),
        },
        {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (m) => (
                <div className="flex flex-wrap justify-end gap-1.5">
                    {m.has_qr ? (
                        <Button
                            onClick={() => downloadQr(m)}
                            variant="outline"
                            size="xs"
                            loading={qrLoadingId === m.id}
                            leftIcon={<Download className="h-3 w-3" />}
                        >
                            Unduh QR
                        </Button>
                    ) : (
                        <Button
                            onClick={() => activateQr(m)}
                            variant="primary"
                            size="xs"
                            loading={qrLoadingId === m.id}
                            leftIcon={<QrCode className="h-3 w-3" />}
                        >
                            Aktivasi QR
                        </Button>
                    )}
                    <Button onClick={() => openHistory(m)} variant="ghost" size="xs" leftIcon={<History className="h-3.5 w-3.5" />}>
                        Riwayat
                    </Button>
                    <Button as={Link} href={`/kuasa/members/${m.id}/edit`} variant="outline" size="xs" leftIcon={<Pencil className="h-3 w-3" />}>
                        Edit
                    </Button>
                    <Button onClick={() => handleDelete(m.id)} variant="dangerSoft" size="xs" leftIcon={<Trash2 className="h-3 w-3" />}>
                        Hapus
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AdminShell
            title="Anggota"
            stickyCta
            actions={
                <div className="hidden md:flex">
                    <Dropdown
                        label="Aksi Anggota"
                        items={[
                            {
                                key: 'tambah',
                                label: 'Tambah Anggota',
                                icon: Plus,
                                href: '/kuasa/members/create',
                                variant: 'primary',
                            },
                            {
                                key: 'ekspor',
                                label: 'Ekspor',
                                icon: Download,
                                disabled: !hasExportableEvents,
                                title: hasExportableEvents
                                    ? undefined
                                    : 'Belum ada event untuk diekspor',
                                onClick: () => setExportOpen(true),
                            },
                        ]}
                    />
                </div>
            }
        >
            <Head title="Anggota" />

            <Card padding="md" className="mb-5">
                <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                            Cari
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau NIM…"
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="sm:w-64">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                            Departemen
                        </label>
                        <Select
                            value={dept}
                            onChange={(v) => {
                                setDept(v);
                                applyFilters({ departemen: v });
                            }}
                            options={deptOptions}
                        />
                    </div>
                    <Button type="submit" variant="primary" size="md" disabled={!filtersTouched} fullWidth>Cari</Button>
                </form>
            </Card>

            <DataTable
                columns={columns}
                rows={members.data}
                mobileItem={renderMobileMemberCard}
                emptyState={
                    <EmptyState
                        icon={Users}
                        title="Belum ada anggota"
                        description="Tambah anggota baru untuk mulai mencatat kehadiran."
                        action={
                            <Button as={Link} href="/kuasa/members/create" variant="primary" size="md">
                                Tambah Anggota
                            </Button>
                        }
                    />
                }
            />

            <Pagination links={members.links} className="mt-6" />

            <Sheet
                open={!!historyMember}
                onClose={() => setHistoryMember(null)}
                title={historyMember?.nama}
                description={`NIM ${historyMember?.nim ?? ''} · ${historyMember?.departemen ?? ''}`}
            >
                {historyLoading ? (
                    <p className="text-sm text-[color:var(--text-muted)]">Memuat riwayat…</p>
                ) : !history ? null : (
                    <div className="space-y-4">
                        {history.summary && (
                            <div className="grid grid-cols-3 gap-2">
                                <Mini label="Hadir" value={history.summary.hadir} tone="success" />
                                <Mini label="Terlambat" value={history.summary.terlambat} tone="warning" />
                                <Mini label="Alpha" value={history.summary.alpha} tone="danger" />
                                <Mini label="Izin" value={history.summary.izin} tone="info" />
                                <Mini label="Sakit" value={history.summary.sakit} tone="info" />
                                <Mini label="Total" value={`${history.summary.percentage}%`} tone="brand" />
                            </div>
                        )}

                        <div className="space-y-2">
                            {(history.attendances?.data ?? []).length === 0 ? (
                                <EmptyState title="Belum ada riwayat" />
                            ) : (
                                history.attendances.data.map((a) => (
                                    <div key={a.id} className="rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium">{a.event}</p>
                                            <Badge
                                                tone={
                                                    a.status === 'hadir'
                                                        ? 'success'
                                                        : a.status === 'terlambat'
                                                            ? 'warning'
                                                            : a.status === 'alpha'
                                                                ? 'danger'
                                                                : 'info'
                                                }
                                                size="sm"
                                            >
                                                {STATUS_LABEL[a.status] ?? a.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                                            {a.tanggal} · {a.check_in_time}
                                        </p>
                                        {a.alasan && (
                                            <p className="mt-1 text-xs italic text-[color:var(--text-muted)]">
                                                "{a.alasan}"
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </Sheet>

            <ExportDialog
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                events={exportableEvents}
            />

            <QrPreviewDialog payload={qrPayload} onClose={() => setQrPayload(null)} />

            {/* Spacer so the sticky CTA never overlaps the last row */}
            <div className="h-14" aria-hidden="true" />

            {/* Sticky page-action CTA — mobile only. Desktop uses the
                Dropdown injected into AdminShell `actions` slot above. */}
            <div
                className="md:hidden fixed inset-x-0 bottom-[60px] z-20 px-4 pb-2 pt-3 bg-gradient-to-t from-[color:var(--surface-base)] via-[color:var(--surface-base)] to-transparent pointer-events-none"
            >
                <Button
                    onClick={() => setPageActionsOpen(true)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={<MoreHorizontal className="h-5 w-5" />}
                    className="shadow-[0_8px_24px_rgba(0,0,0,0.18)] pointer-events-auto"
                >
                    Aksi Anggota
                </Button>
            </div>

            <Sheet
                open={pageActionsOpen}
                onClose={() => setPageActionsOpen(false)}
                side="bottom"
                title="Aksi Anggota"
                description="Pilih aksi yang ingin dijalankan."
            >
                <div className="flex flex-col gap-2">
                    <Button
                        as={Link}
                        href="/kuasa/members/create"
                        variant="primary"
                        size="md"
                        fullWidth
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => setPageActionsOpen(false)}
                    >
                        Tambah Anggota
                    </Button>
                    <Button
                        variant="outline"
                        size="md"
                        fullWidth
                        leftIcon={<Download className="h-4 w-4" />}
                        disabled={!hasExportableEvents}
                        title={
                            hasExportableEvents ? undefined : 'Belum ada event untuk diekspor'
                        }
                        onClick={() => {
                            setPageActionsOpen(false);
                            setExportOpen(true);
                        }}
                    >
                        Ekspor
                    </Button>
                </div>
            </Sheet>
        </AdminShell>
    );
}

/**
 * Admin-side QR preview & download dialog.
 *
 * Renders a QR canvas from the supplied payload and exposes a Download
 * button that exports the canvas as a PNG file named after the member's NIM.
 */
function QrPreviewDialog({ payload, onClose }) {
    const qrRef = useRef(null);

    function handleDownload() {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-absen-${payload?.nim ?? 'member'}.png`;
        a.click();
    }

    return (
        <Dialog
            open={Boolean(payload)}
            onClose={onClose}
            title="QR Anggota"
            description={
                payload
                    ? `${payload.nama} · NIM ${payload.nim}`
                    : undefined
            }
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Tutup
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleDownload}
                        leftIcon={<Download className="h-4 w-4" />}
                    >
                        Unduh PNG
                    </Button>
                </>
            }
        >
            {payload ? (
                <div className="flex flex-col items-center gap-4">
                    <div
                        ref={qrRef}
                        className="rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] bg-white p-4"
                    >
                        <QRCodeCanvas value={payload.qr_code} size={240} level="H" marginSize={4} />
                    </div>
                    <div className="text-center">
                        {payload.departemen && (
                            <p className="text-sm text-[color:var(--text-secondary)]">
                                {payload.departemen}
                            </p>
                        )}
                        {payload.jabatan && (
                            <p className="text-xs text-[color:var(--text-muted)]">
                                {payload.jabatan}
                            </p>
                        )}
                    </div>
                    <p className="text-center text-xs text-[color:var(--text-muted)]">
                        QR ini permanen. Bagikan via DM/email, jangan posting ke publik.
                    </p>
                </div>
            ) : null}
        </Dialog>
    );
}

function Mini({ label, value, tone }) {
    const tones = {
        success: 'text-[color:var(--success-fg)]',
        warning: 'text-[color:var(--warning-fg)]',
        danger: 'text-[color:var(--danger-fg)]',
        info: 'text-[color:var(--info-fg)]',
        brand: 'text-[color:var(--brand-600)]',
    };
    return (
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p>
            <p className={`mt-0.5 text-base font-semibold ${tones[tone] ?? ''}`}>{value}</p>
        </div>
    );
}
