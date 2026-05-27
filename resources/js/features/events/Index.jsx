import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminShell } from '@/layouts/AdminShell';
import { Card } from '@/components/composite/Card';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { DataTable } from '@/components/composite/DataTable';
import { EmptyState } from '@/components/composite/EmptyState';
import { Pagination } from '@/components/composite/Pagination';
import { Ellipsis } from '@/components/primitives/Ellipsis';
import { CalendarDays, Plus, Play, Square, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';

const STATUS_CONFIG = {
    draft: { tone: 'neutral', label: 'Draft' },
    active: { tone: 'success', label: 'Aktif' },
    closed: { tone: 'info', label: 'Closed' },
};

export default function EventsIndex({ events, filters, statuses }) {
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');

    const rows = events?.data ?? [];

    function applyFilter(status) {
        setStatusFilter(status);
        router.get('/kuasa/events', { status }, { preserveScroll: true, preserveState: true });
    }

    function handleActivate(id) {
        if (!confirm('Aktifkan event ini? Anggota akan langsung bisa absen.')) return;
        router.post(`/kuasa/events/${id}/activate`, {}, { preserveScroll: true });
    }
    function handleClose(id) {
        if (!confirm('Tutup event ini? Anggota tidak akan bisa absen lagi.')) return;
        router.post(`/kuasa/events/${id}/close`, {}, { preserveScroll: true });
    }
    function handleDelete(id) {
        if (!confirm('Hapus event ini? Tindakan ini tidak bisa dibatalkan.')) return;
        router.delete(`/kuasa/events/${id}`, { preserveScroll: true });
    }

    function renderMobileEventCard(e) {
        const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.draft;

        return (
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold tracking-tight text-[color:var(--text-primary)]">
                            {e.nama_kegiatan}
                        </p>
                        {e.deskripsi && (
                            <Ellipsis as="p" lines={2} className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                                {e.deskripsi}
                            </Ellipsis>
                        )}
                    </div>
                    <Badge tone={cfg.tone} dot={e.status === 'active'} size="sm">
                        {cfg.label}
                    </Badge>
                </div>

                <div className="space-y-1 text-xs text-[color:var(--text-secondary)]">
                    <p>{e.tanggal_label ?? e.tanggal}</p>
                    <p>{e.waktu_mulai}–{e.waktu_selesai} · {e.departemen ?? 'Semua departemen'}</p>
                </div>

                <div className="border-t border-[color:var(--border-subtle)] pt-3">
                    <Button
                        as={Link}
                        href={`/kuasa/events/${e.id}`}
                        variant="primary"
                        size="sm"
                        className="w-full"
                    >
                        Detail
                    </Button>
                </div>
            </div>
        );
    }

    const columns = [
        {
            key: 'nama_kegiatan',
            label: 'Event',
            render: (e) => (
                <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{e.nama_kegiatan}</p>
                    {e.deskripsi && (
                        <Ellipsis as="p" lines={1} className="mt-0.5 text-xs text-[color:var(--text-muted)]">{e.deskripsi}</Ellipsis>
                    )}
                </div>
            ),
        },
        {
            key: 'tanggal',
            label: 'Tanggal',
            render: (e) => (
                <div>
                    <p>{e.tanggal_label ?? e.tanggal}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">
                        {e.waktu_mulai}–{e.waktu_selesai}
                    </p>
                </div>
            ),
        },
        {
            key: 'departemen',
            label: 'Dept',
            render: (e) => (e.departemen ? <Badge tone="brand">{e.departemen}</Badge> : <span className="text-xs text-[color:var(--text-muted)]">Semua</span>),
        },
        {
            key: 'status',
            label: 'Status',
            render: (e) => {
                const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.draft;
                return (
                    <Badge tone={cfg.tone} dot={e.status === 'active'}>
                        {cfg.label}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            label: 'Aksi',
            align: 'right',
            render: (e) => (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Button as={Link} href={`/kuasa/events/${e.id}`} variant="ghost" size="xs">
                        Detail
                    </Button>
                    {e.status === 'draft' && (
                        <>
                            <Button as={Link} href={`/kuasa/events/${e.id}/edit`} variant="outline" size="xs" leftIcon={<Pencil className="h-3 w-3" />}>
                                Edit
                            </Button>
                            {e.time_state !== 'ended' && (
                                <Button onClick={() => handleActivate(e.id)} variant="primary" size="xs" leftIcon={<Play className="h-3 w-3" />}>
                                    Aktifkan
                                </Button>
                            )}
                            <Button onClick={() => handleDelete(e.id)} variant="dangerSoft" size="xs" leftIcon={<Trash2 className="h-3 w-3" />}>
                                Hapus
                            </Button>
                        </>
                    )}
                    {e.status === 'active' && (
                        <Button onClick={() => handleClose(e.id)} variant="dangerSoft" size="xs" leftIcon={<Square className="h-3 w-3" />}>
                            Tutup
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AdminShell title="Event" stickyCta>
            <Head title="Event" />

            <Card padding="md" className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                    <FilterChip active={!statusFilter} onClick={() => applyFilter('')}>Semua</FilterChip>
                    {statuses.map((s) => (
                        <FilterChip key={s} active={statusFilter === s} onClick={() => applyFilter(s)}>
                            {STATUS_CONFIG[s]?.label ?? s}
                        </FilterChip>
                    ))}
                </div>
            </Card>

            <DataTable
                columns={columns}
                rows={rows}
                mobileItem={renderMobileEventCard}
                emptyState={
                    <EmptyState
                        icon={CalendarDays}
                        title="Belum ada event"
                        description="Buat event baru untuk mulai mencatat kehadiran."
                        action={
                            <Button as={Link} href="/kuasa/events/create" variant="primary" size="md">
                                Buat Event
                            </Button>
                        }
                    />
                }
            />

            <Pagination links={events.links} className="mt-6" />

            {/* Spacer so the sticky CTA never overlaps the last row */}
            <div className="h-14" aria-hidden="true" />

            {/* Sticky CTA: full-width on mobile (above BottomNav), floating
                bottom-right on desktop. Mirrors the detail screen pattern. */}
            <div
                className="fixed inset-x-0 bottom-[60px] z-20 px-4 pb-2 pt-3 md:bottom-4 md:left-auto md:right-6 md:w-auto md:max-w-xs md:px-0 bg-gradient-to-t from-[color:var(--surface-base)] via-[color:var(--surface-base)] to-transparent pointer-events-none md:bg-none"
            >
                <Button
                    as={Link}
                    href="/kuasa/events/create"
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={<Plus className="h-5 w-5" />}
                    className="shadow-[0_8px_24px_rgba(0,0,0,0.18)] pointer-events-auto md:!w-auto md:px-6"
                >
                    Buat Event
                </Button>
            </div>
        </AdminShell>
    );
}

function FilterChip({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'inline-flex items-center rounded-[var(--radius-pill)] px-4 py-2 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] transition-colors',
                active
                    ? 'bg-[color:var(--ink-deep)] text-[color:var(--canvas)]'
                    : 'bg-[color:var(--canvas)] text-[color:var(--ink)] border border-[color:var(--hairline)] hover:bg-[color:var(--surface-soft)]',
            )}
        >
            {children}
        </button>
    );
}
