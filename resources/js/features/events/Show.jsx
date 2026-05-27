import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card, CardHeader } from '@/components/composite/Card';
import { Stat } from '@/components/composite/Stat';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { Dialog } from '@/components/primitives/Dialog';
import { Field } from '@/components/primitives/Field';
import { Input, Textarea } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Sheet } from '@/components/primitives/Sheet';
import { DataTable } from '@/components/composite/DataTable';
import { EmptyState } from '@/components/composite/EmptyState';
import { ExportDialog } from '@/components/composite/ExportDialog';
import { Pagination } from '@/components/composite/Pagination';
import { cn } from '@/lib/cn';
import {
    UserCheck,
    Clock,
    Heart,
    XCircle,
    Users,
    Play,
    Square,
    Pencil,
    AlertTriangle,
    Download,
    MoreHorizontal,
    Search,
    RefreshCw,
    Pause,
    Ban,
    ShieldCheck,
    ShieldOff,
} from 'lucide-react';

const STATUS_CONFIG = {
    hadir: { tone: 'success', label: 'Hadir' },
    terlambat: { tone: 'warning', label: 'Terlambat' },
    izin: { tone: 'info', label: 'Izin' },
    sakit: { tone: 'info', label: 'Sakit' },
    alpha: { tone: 'danger', label: 'Alpha' },
    revoked: { tone: 'neutral', label: 'Dibatalkan' },
    belum: { tone: 'neutral', label: 'Belum Hadir' },
};

const EVENT_STATUS = {
    draft: { tone: 'neutral', label: 'Draft' },
    active: { tone: 'success', label: 'Aktif' },
    closed: { tone: 'info', label: 'Closed' },
};

const POLL_INTERVAL_MS = 7000;

export default function EventShow({ event, members, summary, filters = {}, departments = [] }) {
    const [permissionTarget, setPermissionTarget] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [deptFilter, setDeptFilter] = useState(filters?.departemen ?? '');
    const [search, setSearch] = useState(filters?.search ?? '');

    // Auto-refresh state
    const isActive = event.status === 'active';
    const [autoRefresh, setAutoRefresh] = useState(isActive);
    const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef(null);
    const memberRows = members?.data ?? [];
    const filteredTotal = members?.total ?? memberRows.length;

    useEffect(() => {
        setSearch(filters?.search ?? '');
        setStatusFilter(filters?.status ?? 'all');
        setDeptFilter(filters?.departemen ?? '');
    }, [filters?.search, filters?.status, filters?.departemen]);

    // Track when fresh data arrives via Inertia partial reloads
    useEffect(() => {
        setLastRefreshed(new Date());
    }, [members, summary]);

    function reloadData(silent = false) {
        if (!silent) setRefreshing(true);
        router.reload({
            only: ['members', 'summary', 'event', 'filters', 'departments'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setRefreshing(false),
        });
    }

    function filterParams(overrides = {}) {
        const params = {
            search,
            status: statusFilter,
            departemen: deptFilter,
            ...overrides,
        };

        if (!params.search?.trim()) delete params.search;
        if (!params.status || params.status === 'all') delete params.status;
        if (!params.departemen) delete params.departemen;
        if (!params.page) delete params.page;

        return params;
    }

    function applyFilters(overrides = {}) {
        router.get(`/kuasa/events/${event.id}`, filterParams(overrides), {
            preserveScroll: true,
            preserveState: true,
        });
    }

    function resetFilters() {
        setStatusFilter('all');
        setDeptFilter('');
        setSearch('');
        router.get(`/kuasa/events/${event.id}`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    // Auto-refresh polling — only when active + tab visible
    useEffect(() => {
        if (!autoRefresh || !isActive) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }

        function tick() {
            if (typeof document !== 'undefined' && document.hidden) return;
            reloadData(true);
        }

        pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
        };
    }, [autoRefresh, isActive]);

    // Disable auto-refresh automatically when event is no longer active
    useEffect(() => {
        if (!isActive && autoRefresh) setAutoRefresh(false);
    }, [isActive]); // eslint-disable-line

    function handleActivate() {
        if (!confirm('Aktifkan event sekarang?')) return;
        router.post(`/kuasa/events/${event.id}/activate`);
    }
    function handleClose() {
        if (!confirm('Tutup event ini?')) return;
        router.post(`/kuasa/events/${event.id}/close`);
    }
    function handleAlpha() {
        if (!confirm('Tandai semua anggota yang belum absen sebagai ALPHA?')) return;
        router.post(`/kuasa/events/${event.id}/mark-alpha`);
    }

    const statusCfg = EVENT_STATUS[event.status] ?? EVENT_STATUS.draft;

    const deptOptions = useMemo(() => departments.map((d) => ({ value: d, label: d })), [departments]);
    const noFilteredMembers = memberRows.length === 0;
    const filtersActive =
        (filters?.status ?? 'all') !== 'all' ||
        (filters?.departemen ?? '') !== '' ||
        (filters?.search ?? '').trim() !== '';
    const filtersTouched =
        search !== (filters?.search ?? '') ||
        statusFilter !== (filters?.status ?? 'all') ||
        deptFilter !== (filters?.departemen ?? '');

    // Action availability gates
    const belumHadirCount = summary.belum ?? 0;
    const canMarkAlpha = belumHadirCount > 0 && event.status === 'closed';

    const columns = [
        {
            key: 'qr_status',
            label: 'Status QR',
            render: (m) =>
                m.has_qr === true ? (
                    <Badge tone="success" size="sm" title="QR aktif">
                        <ShieldCheck className="h-3 w-3" /> QR Aktif
                    </Badge>
                ) : (
                    <Badge tone="neutral" size="sm" title="Belum aktivasi QR">
                        <ShieldOff className="h-3 w-3" /> Belum Aktif
                    </Badge>
                ),
        },
        {
            key: 'nama',
            label: 'Anggota',
            render: (m) => (
                <div className="min-w-0">
                    <p className="break-words font-medium leading-snug">{m.nama}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">NIM {m.nim} · {m.jabatan}</p>
                </div>
            ),
        },
        {
            key: 'departemen',
            label: 'Departemen',
            render: (m) => <Badge tone="brand" size="sm">{m.departemen}</Badge>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (m) =>
                m.attendance ? (
                    <div>
                        <Badge tone={STATUS_CONFIG[m.attendance.status]?.tone ?? 'neutral'}>
                            {STATUS_CONFIG[m.attendance.status]?.label ?? m.attendance.status}
                        </Badge>
                        {m.attendance.check_in_time && (
                            <p className="mt-1 text-xs text-[color:var(--text-muted)]">{m.attendance.check_in_time}</p>
                        )}
                        {m.attendance.alasan && (
                            <p className="mt-1 text-xs italic text-[color:var(--text-muted)]">"{m.attendance.alasan}"</p>
                        )}
                    </div>
                ) : (
                    <Badge tone="neutral" size="sm">Belum hadir</Badge>
                ),
        },
        {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (m) =>
                !m.attendance ? (
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setPermissionTarget(m)}
                        leftIcon={<Pencil className="h-3 w-3" />}
                        disabled={event.status === 'closed'}
                        title={event.status === 'closed' ? 'Event sudah ditutup' : undefined}
                    >
                        Izin / Sakit
                    </Button>
                ) : (
                    <Button
                        size="xs"
                        variant="dangerSoft"
                        onClick={() => setRevokeTarget(m)}
                        leftIcon={<Ban className="h-3 w-3" />}
                    >
                        Revoke
                    </Button>
                ),
        },
    ];

    return (
        <AdminShell
            title={event.nama_kegiatan}
            description={`${event.tanggal_label ?? event.tanggal} · ${event.waktu_mulai}–${event.waktu_selesai} · ${event.departemen ?? 'Semua departemen'}`}
            stickyCta
        >
            <Head title={event.nama_kegiatan} />

            <Card padding="md" className="mb-5 flex flex-wrap items-center gap-3">
                <Badge tone={statusCfg.tone} dot={event.status === 'active'}>
                    {statusCfg.label}
                </Badge>
                {event.deskripsi && (
                    <p className="text-sm text-[color:var(--text-secondary)]">{event.deskripsi}</p>
                )}
            </Card>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Total" value={summary.total_members} icon={Users} tone="brand" />
                <Stat label="Hadir" value={summary.hadir} icon={UserCheck} tone="success" />
                <Stat label="Terlambat" value={summary.terlambat} icon={Clock} tone="warning" />
                <Stat label="Izin" value={summary.izin} icon={Heart} tone="info" />
                <Stat label="Sakit" value={summary.sakit} icon={Heart} tone="info" />
                <Stat label="Alpha" value={summary.alpha} icon={XCircle} tone="danger" />
            </div>

            <Card padding="md" className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <CardHeader
                        title="Daftar Anggota"
                        subtitle={
                            filtersActive
                                ? `${filteredTotal} dari ${summary.total_members} anggota`
                                : `${summary.total_members} anggota target event ini`
                        }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        {isActive && (
                            <Badge tone={autoRefresh ? 'success' : 'neutral'} dot={autoRefresh} size="sm">
                                {autoRefresh ? 'Live' : 'Live dijeda'}
                            </Badge>
                        )}
                        <span className="hidden text-[11px] text-[color:var(--text-muted)] sm:inline">
                            Update: {formatTime(lastRefreshed)}
                        </span>
                        <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => reloadData(false)}
                            leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />}
                            disabled={refreshing}
                        >
                            Refresh
                        </Button>
                        {isActive && (
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setAutoRefresh((v) => !v)}
                                leftIcon={
                                    autoRefresh ? (
                                        <Pause className="h-3.5 w-3.5" />
                                    ) : (
                                        <Play className="h-3.5 w-3.5" />
                                    )
                                }
                            >
                                {autoRefresh ? 'Jeda Auto' : 'Auto Refresh'}
                            </Button>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        applyFilters({ page: undefined });
                    }}
                    className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px_220px_auto_auto]"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau NIM…"
                            className="pl-10"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value);
                            applyFilters({ status: value, page: undefined });
                        }}
                        options={[
                            { value: 'all', label: `Semua status (${summary.total_members})` },
                            { value: 'hadir', label: `Hadir (${summary.hadir})` },
                            { value: 'terlambat', label: `Terlambat (${summary.terlambat})` },
                            { value: 'izin', label: `Izin (${summary.izin})` },
                            { value: 'sakit', label: `Sakit (${summary.sakit})` },
                            { value: 'alpha', label: `Alpha (${summary.alpha})` },
                            { value: 'belum', label: `Belum Hadir (${belumHadirCount})` },
                        ]}
                    />
                    {deptOptions.length > 1 ? (
                        <Select
                            value={deptFilter}
                            onChange={(value) => {
                                setDeptFilter(value);
                                applyFilters({ departemen: value, page: undefined });
                            }}
                            options={[
                                { value: '', label: 'Semua departemen' },
                                ...deptOptions,
                            ]}
                        />
                    ) : (
                        <div className="hidden sm:block" />
                    )}
                    <Button type="submit" variant="primary" size="md" disabled={!filtersTouched}>
                        Cari
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={resetFilters}
                        disabled={!filtersActive}
                    >
                        Reset Filter
                    </Button>
                </form>

                <div className="mt-4">
                    <DataTable
                        columns={columns}
                        rows={memberRows}
                        rowKey="user_id"
                        emptyState={
                            <EmptyState
                                icon={Users}
                                title={noFilteredMembers && filtersActive ? 'Tidak ada hasil' : 'Tidak ada anggota'}
                                description={
                                    noFilteredMembers && filtersActive
                                        ? 'Coba ubah filter atau kata kunci pencarian.'
                                        : 'Tidak ada anggota yang sesuai dengan filter departemen event.'
                                }
                            />
                        }
                    />
                    <Pagination links={members?.links} className="mt-6" />
                </div>
            </Card>

            <div className="h-14" aria-hidden="true" />

            <PermissionDialog
                event={event}
                target={permissionTarget}
                onClose={() => setPermissionTarget(null)}
            />

            <RevokeDialog
                event={event}
                target={revokeTarget}
                onClose={() => setRevokeTarget(null)}
            />

            <ExportDialog
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                events={[event]}
                lockedEventId={event.id}
                title={`Ekspor: ${event.nama_kegiatan}`}
                description="Filter rentang tanggal opsional. Event sudah ter-lock."
            />

            <div
                className="fixed inset-x-0 bottom-[60px] z-20 px-4 pb-2 pt-3 md:bottom-4 md:left-auto md:right-6 md:w-auto md:max-w-xs md:px-0 bg-gradient-to-t from-[color:var(--surface-base)] via-[color:var(--surface-base)] to-transparent pointer-events-none md:bg-none"
            >
                <Button
                    onClick={() => setMobileActionsOpen(true)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={<MoreHorizontal className="h-5 w-5" />}
                    className="shadow-[0_8px_24px_rgba(0,0,0,0.18)] pointer-events-auto md:!w-auto md:px-6"
                >
                    Aksi Event
                </Button>
            </div>

            <Sheet
                open={mobileActionsOpen}
                onClose={() => setMobileActionsOpen(false)}
                side="bottom"
                title="Aksi Event"
                description={event.nama_kegiatan}
            >
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="md"
                        fullWidth
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => {
                            setMobileActionsOpen(false);
                            setExportOpen(true);
                        }}
                    >
                        Ekspor
                    </Button>

                    {event.status === 'draft' && event.time_state !== 'ended' && (
                        <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            leftIcon={<Play className="h-4 w-4" />}
                            onClick={() => {
                                setMobileActionsOpen(false);
                                handleActivate();
                            }}
                        >
                            Aktifkan
                        </Button>
                    )}
                    {event.status === 'active' && (
                        <Button
                            variant="dangerSoft"
                            size="md"
                            fullWidth
                            leftIcon={<Square className="h-4 w-4" />}
                            onClick={() => {
                                setMobileActionsOpen(false);
                                handleClose();
                            }}
                        >
                            Tutup Event
                        </Button>
                    )}
                    {event.status === 'closed' && (
                        <Button
                            variant="danger"
                            size="md"
                            fullWidth
                            leftIcon={<AlertTriangle className="h-4 w-4" />}
                            disabled={!canMarkAlpha}
                            title={canMarkAlpha ? undefined : 'Semua anggota sudah punya status'}
                            onClick={() => {
                                setMobileActionsOpen(false);
                                handleAlpha();
                            }}
                        >
                            Tandai Alpha
                        </Button>
                    )}
                </div>
            </Sheet>
        </AdminShell>
    );
}

function PermissionDialog({ event, target, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: target?.user_id ?? '',
        status: 'izin',
        alasan: '',
    });

    function submit(e) {
        e.preventDefault();
        post(`/kuasa/events/${event.id}/permission`, {
            data: { ...data, user_id: target.user_id },
            onSuccess: () => {
                reset();
                onClose();
            },
            preserveScroll: true,
        });
    }

    return (
        <Dialog
            open={!!target}
            onClose={onClose}
            title={`Catat ${target?.nama ?? 'anggota'}`}
            description={`NIM ${target?.nim ?? ''} · ${target?.departemen ?? ''}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Batal</Button>
                    <Button variant="primary" onClick={submit} loading={processing}>Simpan</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Status" error={errors.status}>
                    <Select
                        value={data.status}
                        onChange={(v) => setData('status', v)}
                        options={[
                            { value: 'izin', label: 'Izin' },
                            { value: 'sakit', label: 'Sakit' },
                        ]}
                    />
                </Field>
                <Field label="Alasan" hint="Opsional" error={errors.alasan}>
                    <Textarea
                        value={data.alasan}
                        onChange={(e) => setData('alasan', e.target.value)}
                        placeholder="Tulis alasan singkat…"
                    />
                </Field>
            </form>
        </Dialog>
    );
}

/**
 * Revoke (cancel) an attendance record. The reason is mandatory and gets
 * stored in the audit log via the backend service. The row stays in the
 * DB with status='revoked'; the same user can be re-scanned afterwards.
 */
function RevokeDialog({ event, target, onClose }) {
    const attendanceId = target?.attendance?.id;
    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '',
    });

    function submit(e) {
        e.preventDefault();
        if (!attendanceId) return;
        post(`/kuasa/events/${event.id}/attendances/${attendanceId}/revoke`, {
            onSuccess: () => {
                reset();
                onClose();
            },
            preserveScroll: true,
        });
    }

    const previousStatus =
        STATUS_CONFIG[target?.attendance?.status]?.label ??
        target?.attendance?.status ??
        '—';

    return (
        <Dialog
            open={!!target}
            onClose={onClose}
            title={`Revoke absensi ${target?.nama ?? ''}`}
            description={`NIM ${target?.nim ?? ''} · status sekarang: ${previousStatus}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Batal</Button>
                    <Button
                        variant="danger"
                        onClick={submit}
                        loading={processing}
                        disabled={data.reason.trim().length < 3}
                    >
                        Revoke
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="rounded-[var(--radius-md)] border border-[color:var(--warning-border)] bg-[color:var(--warning-bg)] px-4 py-3 text-sm text-[color:var(--warning-fg)]">
                    Absensi akan ditandai <strong>dibatalkan</strong>. Anggota bisa
                    di-scan ulang jika perlu, dan riwayat revoke tercatat di audit log.
                </div>
                <Field
                    label="Alasan revoke"
                    hint="Wajib diisi, minimal 3 karakter."
                    error={errors.reason}
                >
                    <Textarea
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        placeholder="Contoh: salah scan, anggota tidak hadir tapi QR-nya sempat di-scan teman."
                        autoFocus
                    />
                </Field>
            </form>
        </Dialog>
    );
}

function formatTime(d) {
    if (!d) return '—';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
