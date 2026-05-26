import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminShell } from '@/layouts/AdminShell';
import { Stat } from '@/components/composite/Stat';
import { Card, CardHeader } from '@/components/composite/Card';
import { Badge } from '@/components/primitives/Badge';
import { Button } from '@/components/primitives/Button';
import { Select } from '@/components/primitives/Select';
import { Sheet } from '@/components/primitives/Sheet';
import { Ellipsis } from '@/components/primitives/Ellipsis';
import { EmptyState } from '@/components/composite/EmptyState';
import { ExportDialog } from '@/components/composite/ExportDialog';
import { toast } from '@/lib/toast';
import {
    Users,
    UserCheck,
    UserX,
    TrendingUp,
    Calendar,
    Activity,
    Download,
    RotateCcw,
    ChevronRight,
    MoreHorizontal,
} from 'lucide-react';

export default function DashboardPage({
    overview,
    recentAttendances,
    todayEvents,
    exportableEvents,
}) {
    const [selectedEventId, setSelectedEventId] = useState(() => {
        const fromUrl = new URLSearchParams(window.location.search).get('event_id');
        return fromUrl ? Number(fromUrl) : null;
    });
    const [exportOpen, setExportOpen] = useState(false);
    const [pageActionsOpen, setPageActionsOpen] = useState(false);

    const attendances = Array.isArray(recentAttendances) ? recentAttendances : (recentAttendances?.data ?? []);

    const filterOptions = [
        { value: null, label: 'Semua Event' },
        ...(todayEvents ?? []).map((ev) => ({
            value: ev.id,
            label: `${ev.nama_kegiatan} · ${ev.waktu_mulai}–${ev.waktu_selesai}`,
        })),
    ];

    const activeCount = (todayEvents ?? []).filter((e) => e.status === 'active').length;
    const subtitle = `${overview?.date_label ?? ''} · ${activeCount} event aktif`;
    const hasExportableEvents = (exportableEvents ?? []).length > 0;
    const hasScansToday = (overview?.present_today ?? 0) > 0;

    function handleEventFilter(eventId) {
        setSelectedEventId(eventId);
        const params = eventId ? { event_id: eventId } : {};
        router.get('/kuasa/dashboard', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['overview', 'todayEvents', 'recentAttendances'],
        });
    }

    function handleReset() {
        if (!hasScansToday) {
            toast.error('Belum ada absensi hari ini untuk di-reset.');
            return;
        }
        if (!confirm('Reset semua absensi hari ini? Tindakan ini tidak bisa dibatalkan.')) return;
        router.post('/kuasa/attendances/reset');
    }

    return (
        <AdminShell title="Dashboard" description={subtitle} stickyCta>
            <Head title="Dashboard Admin" />

            {/* Event filter */}
            <div className="mb-5 sm:w-80">
                <Select
                    value={selectedEventId}
                    onChange={handleEventFilter}
                    options={filterOptions}
                />
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total Anggota" value={overview?.total_students ?? 0} icon={Users} tone="brand" />
                <Stat label="Hadir Hari Ini" value={overview?.present_today ?? 0} icon={UserCheck} tone="success" />
                <Stat label="Belum Hadir" value={overview?.absent_today ?? 0} icon={UserX} tone="warning" />
                <Stat label="Tingkat Kehadiran" value={`${overview?.attendance_rate ?? 0}%`} icon={TrendingUp} tone="brand" />
            </div>

            {/* Today's events + recent attendances */}
            <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card padding="md">
                        <CardHeader
                            title="Event Hari Ini"
                            subtitle={
                                selectedEventId
                                    ? `Menampilkan: ${todayEvents?.[0]?.nama_kegiatan ?? ''}`
                                    : `${todayEvents?.length ?? 0} kegiatan`
                            }
                            action={
                                <Button as={Link} href="/kuasa/events" variant="ghost" size="xs" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                                    Semua Event
                                </Button>
                            }
                        />
                        <div className="mt-4 space-y-2.5">
                            {!todayEvents?.length ? (
                                <EmptyState
                                    icon={Calendar}
                                    title={selectedEventId ? 'Event tidak ditemukan' : 'Belum ada event hari ini'}
                                    description={selectedEventId ? 'Coba pilih filter lain.' : 'Buat event dulu sebelum membuka scanner.'}
                                    action={
                                        !selectedEventId ? (
                                            <Button as={Link} href="/kuasa/events/create" variant="primary" size="md">
                                                Buat Event Baru
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            ) : (
                                todayEvents.map((ev) => (
                                    <Link
                                        key={ev.id}
                                        href={`/kuasa/events/${ev.id}`}
                                        className="block rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-4 transition-colors hover:border-[color:var(--brand-300)]"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {ev.status === 'active' && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--success-fg)] opacity-75" />
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--success-fg)]" />
                                                        </span>
                                                    )}
                                                    <Ellipsis as="h4" className="text-sm font-semibold tracking-tight">{ev.nama_kegiatan}</Ellipsis>
                                                </div>
                                                <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
                                                    {ev.waktu_mulai} – {ev.waktu_selesai} · {ev.departemen ?? 'Semua dept.'}
                                                </p>
                                            </div>
                                            <StatusBadge status={ev.status} />
                                        </div>
                                        {typeof ev.hadir_count === 'number' && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[color:var(--text-muted)]">{ev.hadir_count} hadir</span>
                                                </div>
                                                <div className="mt-1 h-1.5 rounded-full bg-[color:var(--neutral-100)] dark:bg-[rgba(255,255,255,0.06)]">
                                                    <div
                                                        className="h-1.5 rounded-full bg-[color:var(--brand-600)]"
                                                        style={{ width: `${Math.min(100, (ev.hadir_count / Math.max(overview.total_students, 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 border-t border-[color:var(--border-subtle)] pt-3 md:hidden">
                                            <Button
                                                onClick={() => router.visit(`/kuasa/events/${ev.id}`)}
                                                variant="primary"
                                                size="sm"
                                                className="w-full"
                                            >
                                                Detail Event
                                            </Button>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <Card padding="md">
                    <CardHeader title="Aktivitas Terkini" subtitle="8 absensi terbaru" />
                    <div className="mt-4 space-y-2">
                        {!attendances.length ? (
                            <EmptyState icon={Activity} title="Belum ada aktivitas" />
                        ) : (
                            attendances.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-3"
                                >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--accent-200)] bg-[color:var(--accent-100)] text-xs font-semibold text-[color:var(--accent-900)] dark:border-[rgba(147,181,228,0.28)] dark:bg-[rgba(147,181,228,0.12)] dark:text-[color:var(--accent-100)]">
                                        {(a.nama ?? '?').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Ellipsis as="p" className="text-sm font-medium">{a.nama}</Ellipsis>
                                        <Ellipsis as="p" className="text-xs text-[color:var(--text-muted)]">
                                            {a.event ?? 'Tanpa event'} · {a.check_in_time}
                                        </Ellipsis>
                                    </div>
                                    <Badge tone={statusTone(a.status)} size="sm">
                                        {a.status_label ?? a.status}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <ExportDialog
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                events={exportableEvents ?? []}
            />

            {/* Spacer so the sticky CTA never overlaps the last row */}
            <div className="h-14" aria-hidden="true" />

            {/* Sticky page-action CTA (mirrors event-detail "Aksi Event") */}
            <div
                className="fixed inset-x-0 bottom-[60px] z-20 px-4 pb-2 pt-3 md:bottom-4 md:left-auto md:right-6 md:w-auto md:max-w-xs md:px-0 bg-gradient-to-t from-[color:var(--surface-base)] via-[color:var(--surface-base)] to-transparent pointer-events-none md:bg-none"
            >
                <Button
                    onClick={() => setPageActionsOpen(true)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={<MoreHorizontal className="h-5 w-5" />}
                    className="shadow-[0_8px_24px_rgba(0,0,0,0.18)] pointer-events-auto md:!w-auto md:px-6"
                >
                    Aksi Dashboard
                </Button>
            </div>

            <Sheet
                open={pageActionsOpen}
                onClose={() => setPageActionsOpen(false)}
                side="bottom"
                title="Aksi Dashboard"
                description="Pilih aksi yang ingin dijalankan."
            >
                <div className="flex flex-col gap-2">
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
                    <Button
                        variant="dangerSoft"
                        size="md"
                        fullWidth
                        leftIcon={<RotateCcw className="h-4 w-4" />}
                        title={hasScansToday ? undefined : 'Belum ada absensi hari ini'}
                        onClick={() => {
                            setPageActionsOpen(false);
                            handleReset();
                        }}
                    >
                        Reset Hari Ini
                    </Button>
                </div>
            </Sheet>
        </AdminShell>
    );
}

function StatusBadge({ status }) {
    const map = {
        draft: { tone: 'neutral', label: 'Draft' },
        active: { tone: 'success', label: 'Aktif' },
        closed: { tone: 'neutral', label: 'Closed' },
    };
    const cfg = map[status] ?? map.draft;
    return <Badge tone={cfg.tone} dot={status === 'active'} size="sm">{cfg.label}</Badge>;
}

function statusTone(status) {
    const s = String(status).toLowerCase();
    if (s === 'hadir') return 'success';
    if (s === 'terlambat') return 'warning';
    if (s === 'izin' || s === 'sakit') return 'info';
    if (s === 'alpha') return 'danger';
    return 'neutral';
}
