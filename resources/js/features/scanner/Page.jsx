import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/primitives/Button';
import { Select } from '@/components/primitives/Select';
import { Badge } from '@/components/primitives/Badge';
import { Input } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { Sheet } from '@/components/primitives/Sheet';
import { Dialog } from '@/components/primitives/Dialog';
import { Ellipsis } from '@/components/primitives/Ellipsis';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { beepSuccess, beepError } from '@/lib/audio';
import {
    Camera,
    CameraOff,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    ScanLine,
    SwitchCamera,
    Keyboard,
    Clock,
    ShieldCheck,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const SCANNER_DOM_ID = 'qr-scanner-region';

const CONFIRM_MODE_STORAGE_KEY = 'scanner.confirmMode';
const CONFIRM_MODE_AUTO = 'auto';
const CONFIRM_MODE_CONFIRM = 'confirm';

/**
 * Baca mode konfirmasi dari localStorage. Kembalikan default 'auto'
 * jika belum pernah di-set atau localStorage tidak tersedia (SSR / privacy).
 */
function readConfirmMode() {
    if (typeof window === 'undefined') return CONFIRM_MODE_AUTO;
    try {
        const v = window.localStorage.getItem(CONFIRM_MODE_STORAGE_KEY);
        return v === CONFIRM_MODE_CONFIRM ? CONFIRM_MODE_CONFIRM : CONFIRM_MODE_AUTO;
    } catch {
        return CONFIRM_MODE_AUTO;
    }
}

function writeConfirmMode(mode) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(CONFIRM_MODE_STORAGE_KEY, mode);
    } catch {
        /* ignore */
    }
}

export default function ScannerPage({ activeEvents, recentAttendances }) {
    const firstOpen = (activeEvents ?? []).find((e) => e.is_open_for_scan);
    const [eventId, setEventId] = useState(firstOpen?.id ?? null);
    const [manualOpen, setManualOpen] = useState(false);
    const [manualMode, setManualMode] = useState('qr');
    const [manualCode, setManualCode] = useState('');
    const [manualNim, setManualNim] = useState('');
    const [flashType, setFlashType] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [activeCameraId, setActiveCameraId] = useState(null);
    const [switching, setSwitching] = useState(false);
    const [eventPanelOpen, setEventPanelOpen] = useState(false);

    // Mode konfirmasi: 'auto' = langsung simpan saat scan sukses (default,
    // perilaku lama). 'confirm' = tampilkan modal preview dulu, admin
    // harus klik Konfirmasi untuk men-create record. Disimpan di
    // localStorage agar persist antar reload.
    const [confirmMode, setConfirmMode] = useState(() => readConfirmMode());
    // pendingScan menyimpan { code, mode, preview } selama menunggu
    // admin menekan Konfirmasi/Batal di modal. Selain itu null.
    const [pendingScan, setPendingScan] = useState(null);
    const [confirming, setConfirming] = useState(false);

    // Recent scans feed: hydrate from props, then optimistically prepend on
    // each successful scan so the operator sees the row instantly without
    // waiting for the next 30s Inertia reload.
    const propsRecent = useMemo(
        () => (Array.isArray(recentAttendances) ? recentAttendances : recentAttendances?.data ?? []),
        [recentAttendances],
    );
    const [recent, setRecent] = useState(propsRecent);
    useEffect(() => {
        setRecent(propsRecent);
    }, [propsRecent]);

    const html5Ref = useRef(null);
    const submittingRef = useRef(false);
    const lastScanRef = useRef({ code: null, time: 0 });
    const eventIdRef = useRef(eventId);
    const eventPanelRef = useRef(null);
    const confirmModeRef = useRef(confirmMode);
    useEffect(() => {
        confirmModeRef.current = confirmMode;
        writeConfirmMode(confirmMode);
    }, [confirmMode]);
    const pendingScanRef = useRef(pendingScan);
    useEffect(() => {
        pendingScanRef.current = pendingScan;
    }, [pendingScan]);

    useEffect(() => {
        eventIdRef.current = eventId;
    }, [eventId]);

    // Poll backend so lifecycle transitions (DRAFT→ACTIVE→CLOSED) appear
    // without a manual page reload.
    useEffect(() => {
        const id = setInterval(() => {
            router.reload({
                only: ['activeEvents', 'recentAttendances', 'todayOverview'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 30000);
        return () => clearInterval(id);
    }, []);

    // Reconcile selected event when activeEvents updates: if current
    // selection vanished or stopped being scannable, fall back to the
    // first open event (or null).
    useEffect(() => {
        const list = activeEvents ?? [];
        if (eventId) {
            const current = list.find((e) => e.id === eventId);
            if (current?.is_open_for_scan) return;
        }
        const next = list.find((e) => e.is_open_for_scan);
        setEventId(next?.id ?? null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeEvents]);

    useEffect(() => {
        if (!eventPanelOpen) return undefined;

        function onKeyDown(e) {
            if (e.key === 'Escape') {
                setEventPanelOpen(false);
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [eventPanelOpen]);

    useEffect(() => {
        if (!eventPanelOpen) return undefined;

        function onPointerDown(e) {
            const target = e.target instanceof Element ? e.target : null;
            if (target?.closest('[data-headlessui-portal]')) {
                return;
            }
            if (!eventPanelRef.current?.contains(e.target)) {
                setEventPanelOpen(false);
            }
        }

        window.addEventListener('pointerdown', onPointerDown);
        return () => window.removeEventListener('pointerdown', onPointerDown);
    }, [eventPanelOpen]);

    function handleEventChange(newId) {
        setEventId(newId);
        setEventPanelOpen(false);
        // Verify status freshness right when admin picks an event, so
        // a stale "active" entry that just closed gets reflected.
        router.reload({
            only: ['activeEvents'],
            preserveScroll: true,
            preserveState: true,
        });
    }

    const eventOptions = useMemo(
        () =>
            (activeEvents ?? []).map((ev) => {
                const stateLabel =
                    ev.time_state === 'upcoming'
                        ? ' · belum mulai'
                        : ev.time_state === 'ended'
                            ? ' · berakhir'
                            : '';
                return {
                    value: ev.id,
                    label: `${ev.nama_kegiatan} · ${ev.waktu_mulai}–${ev.waktu_selesai}${stateLabel}`,
                    disabled: ev.is_open_for_scan === false,
                };
            }),
        [activeEvents],
    );

    const selectedEvent = useMemo(() => {
        const list = activeEvents ?? [];
        return list.find((e) => e.id === eventId) ?? firstOpen ?? list[0] ?? null;
    }, [activeEvents, eventId, firstOpen]);

    const selectedEventState = useMemo(() => {
        if (!selectedEvent) {
            return { label: 'Tidak aktif', tone: 'neutral' };
        }
        if (selectedEvent.is_open_for_scan) {
            return { label: 'Open', tone: 'success' };
        }
        if (selectedEvent.time_state === 'upcoming') {
            return { label: 'Belum mulai', tone: 'warning' };
        }
        if (selectedEvent.time_state === 'ended') {
            return { label: 'Berakhir', tone: 'danger' };
        }
        return { label: 'Nonaktif', tone: 'neutral' };
    }, [selectedEvent]);

    // Init camera
    useEffect(() => {
        let cancelled = false;
        let inst = null;

        (async () => {
            try {
                const mod = await import('html5-qrcode');
                if (cancelled) return;
                const { Html5Qrcode } = mod;

                let list = [];
                try {
                    list = await Html5Qrcode.getCameras();
                } catch {
                    list = [];
                }
                if (cancelled) return;
                setCameras(list ?? []);

                inst = new Html5Qrcode(SCANNER_DOM_ID);
                html5Ref.current = inst;

                const back = (list ?? []).find((c) => /back|rear|environment/i.test(c.label ?? ''));
                const startCamId = back?.id ?? list?.[0]?.id ?? null;

                await startCamera(inst, startCamId);
                if (!cancelled) setActiveCameraId(startCamId);
            } catch (err) {
                console.error('[scanner] init failed:', err);
                toast.error(`Kamera tidak tersedia: ${err?.message ?? 'unknown'}. Gunakan input manual.`);
                setCameraReady(false);
            }
        })();

        return () => {
            cancelled = true;
            const inst2 = html5Ref.current;
            if (inst2?.isScanning) inst2.stop().catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function startCamera(inst, camId) {
        const cameraConfig = camId ? { deviceId: { exact: camId } } : { facingMode: 'environment' };
        // Responsive scan box: ~70% of the smaller viewport edge, capped at 320px.
        // Slightly smaller than the previous 360px cap so the visual reticle
        // (clamp(180px, 60vmin, 300px)) and the decode area both comfortably
        // sit inside the safe zone between header and toolbar on tall phones.
        const qrbox = (viewW, viewH) => {
            const min = Math.min(viewW, viewH);
            const size = Math.max(180, Math.min(320, Math.floor(min * 0.7)));
            return { width: size, height: size };
        };
        try {
            await inst.start(
                cameraConfig,
                {
                    fps: 15,
                    qrbox,
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                (decoded) => handleScan(decoded),
                () => {},
            );
            setCameraReady(true);
        } catch (err) {
            console.error('[scanner] startCamera failed:', err);
            setCameraReady(false);
            toast.error(`Gagal memulai kamera: ${err?.message ?? 'unknown'}`);
        }
    }

    async function flipCamera() {
        const inst = html5Ref.current;
        if (!inst || cameras.length < 2 || switching) return;

        setSwitching(true);
        try {
            if (inst.isScanning) await inst.stop();
            const idx = cameras.findIndex((c) => c.id === activeCameraId);
            const nextIdx = (idx + 1) % cameras.length;
            const nextCam = cameras[nextIdx];
            await startCamera(inst, nextCam.id);
            setActiveCameraId(nextCam.id);
        } catch {
            toast.error('Gagal mengganti kamera.');
        } finally {
            setSwitching(false);
        }
    }

    async function handleScan(code, mode = 'qr') {
        if (!code) return;
        const currentEvent = eventIdRef.current;
        if (!currentEvent) {
            toast.error('Pilih event terlebih dahulu.');
            return;
        }
        // Jangan terima scan baru kalau modal konfirmasi masih terbuka
        // atau kita sedang submit ke server.
        if (submittingRef.current || pendingScanRef.current) return;

        const now = Date.now();
        if (lastScanRef.current.code === code && now - lastScanRef.current.time < 2500) return;
        lastScanRef.current = { code, time: now };
        submittingRef.current = true;

        const payload = {
            mode,
            event_id: currentEvent,
            ...(mode === 'nim' ? { nim: code } : { qr_code: code }),
        };

        try {
            if (confirmModeRef.current === CONFIRM_MODE_CONFIRM) {
                // Mode konfirmasi: panggil endpoint preview, buka modal,
                // tunggu admin menekan Konfirmasi / Batal.
                const { data } = await api.post('/kuasa/attendances/scan/preview', payload);
                beepSuccess();
                setPendingScan({ code, mode, preview: data });
                // submittingRef tetap true selama modal terbuka — di-unset
                // saat modal close (confirmPendingScan / cancelPendingScan).
                return;
            }

            // Mode auto (default): langsung simpan.
            const { data } = await api.post('/kuasa/attendances/scan', payload);
            setFlashType('success');
            beepSuccess();
            setLastResult({ ok: true, ...data });
            if (data?.attendance) {
                setRecent((prev) => {
                    const next = [data.attendance, ...prev.filter((r) => r.id !== data.attendance.id)];
                    return next.slice(0, 12);
                });
            }
            submittingRef.current = false;
            setTimeout(() => setFlashType(null), 400);
            setTimeout(() => setLastResult(null), 4000);
        } catch (err) {
            // The session-expired interceptor already showed a toast and is
            // redirecting; don't double-flash the user with a second message.
            if (err?.sessionExpired) {
                submittingRef.current = false;
                return;
            }
            const msg = err?.response?.data?.message ?? 'Gagal mencatat absen.';
            setFlashType('error');
            beepError();
            setLastResult({ ok: false, message: msg });
            submittingRef.current = false;
            setTimeout(() => setFlashType(null), 400);
            setTimeout(() => setLastResult(null), 4000);
        }
    }

    /**
     * Setelah admin menekan tombol Konfirmasi di modal preview, eksekusi
     * scan beneran via endpoint /scan dan tutup modal.
     */
    async function confirmPendingScan() {
        const pending = pendingScanRef.current;
        if (!pending || confirming) return;
        setConfirming(true);
        try {
            const payload = {
                mode: pending.mode,
                event_id: eventIdRef.current,
                ...(pending.mode === 'nim' ? { nim: pending.code } : { qr_code: pending.code }),
            };
            const { data } = await api.post('/kuasa/attendances/scan', payload);
            setFlashType('success');
            beepSuccess();
            setLastResult({ ok: true, ...data });
            if (data?.attendance) {
                setRecent((prev) => {
                    const next = [data.attendance, ...prev.filter((r) => r.id !== data.attendance.id)];
                    return next.slice(0, 12);
                });
            }
            setPendingScan(null);
        } catch (err) {
            if (err?.sessionExpired) {
                setPendingScan(null);
                return;
            }
            const msg = err?.response?.data?.message ?? 'Gagal mencatat absen.';
            setFlashType('error');
            beepError();
            setLastResult({ ok: false, message: msg });
            setPendingScan(null);
        } finally {
            setConfirming(false);
            submittingRef.current = false;
            setTimeout(() => setFlashType(null), 400);
            setTimeout(() => setLastResult(null), 4000);
        }
    }

    /**
     * Admin batal: buang preview, reset throttle agar scan kode yang
     * sama bisa diulang segera tanpa harus tunggu 2500ms cooldown.
     */
    function cancelPendingScan() {
        setPendingScan(null);
        submittingRef.current = false;
        lastScanRef.current = { code: null, time: 0 };
    }

    function submitManual(e) {
        e.preventDefault();
        if (manualMode === 'nim') {
            const nim = manualNim.trim();
            if (!nim) return;
            handleScan(nim, 'nim');
            setManualNim('');
        } else {
            const code = manualCode.trim();
            if (!code) return;
            handleScan(code, 'qr');
            setManualCode('');
        }
        setManualOpen(false);
    }

    const noActiveEvents = (activeEvents ?? []).length === 0;

    return (
        <>
            <Head title="Scanner" />

            {/* Page column: dark scanner block on top, light recent-scans
                panel filling the gap below. */}
            <div className="flex h-full flex-col">
                <div className="relative flex flex-1 min-h-0 flex-col bg-black text-white">

                {/* ── Header ─────────────────────────────────────── */}
                <header className="relative z-30 shrink-0 space-y-2 px-4 pb-2 pt-[env(safe-area-inset-top,8px)] sm:px-6">
                    <div className="flex items-center justify-end gap-2">
                        {/* Segmented control: pilihan mode konfirmasi.
                            Dua chip selalu terlihat sehingga admin tahu
                            opsi yang tersedia dan yang sedang aktif. */}
                        <div
                            role="tablist"
                            aria-label="Mode konfirmasi scan"
                            className="flex items-center gap-0.5 rounded-full bg-black/55 p-0.5 backdrop-blur-md"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={confirmMode === CONFIRM_MODE_AUTO}
                                onClick={() => setConfirmMode(CONFIRM_MODE_AUTO)}
                                title="Scan langsung tercatat tanpa konfirmasi"
                                className={cn(
                                    'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition',
                                    confirmMode === CONFIRM_MODE_AUTO
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-white/85 hover:text-white',
                                )}
                            >
                                <Zap className="h-3.5 w-3.5" />
                                <span>Auto</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={confirmMode === CONFIRM_MODE_CONFIRM}
                                onClick={() => setConfirmMode(CONFIRM_MODE_CONFIRM)}
                                title="Scan munculkan modal preview dulu sebelum disimpan"
                                className={cn(
                                    'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition',
                                    confirmMode === CONFIRM_MODE_CONFIRM
                                        ? 'bg-amber-400 text-black shadow-sm'
                                        : 'text-white/85 hover:text-white',
                                )}
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Konfirmasi</span>
                            </button>
                        </div>
                        <Badge tone={cameraReady ? 'success' : 'neutral'} dot={cameraReady} size="sm" className="bg-black/55 backdrop-blur-md">
                            {cameraReady ? 'Kamera Aktif' : 'Menunggu kamera'}
                        </Badge>
                        <button
                            onClick={flipCamera}
                            disabled={cameras.length < 2 || switching}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md hover:bg-black/70 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Balik kamera"
                            title={cameras.length < 2 ? 'Hanya satu kamera tersedia' : 'Balik kamera'}
                        >
                            {switching ? <CameraOff className="h-5 w-5 animate-pulse" /> : <SwitchCamera className="h-5 w-5" />}
                        </button>
                    </div>

                    <div ref={eventPanelRef}>
                        {noActiveEvents ? (
                            <div className="rounded-[var(--radius-lg)] bg-black/55 px-3 py-2 backdrop-blur-md">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-white/80">Tidak ada event aktif.</p>
                                    <Button as={Link} href="/kuasa/events" size="xs" variant="primary">
                                        Kelola Event
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setEventPanelOpen((v) => !v)}
                                    aria-expanded={eventPanelOpen}
                                    aria-label="Buka panel event aktif"
                                    className="flex w-full items-center gap-2 rounded-[var(--radius-lg)] bg-black/55 px-3 py-2 text-left backdrop-blur-md"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
                                            Event Aktif
                                        </p>
                                        <Ellipsis as="p" className="text-sm font-medium text-white">
                                            {selectedEvent?.nama_kegiatan ?? 'Pilih event'}
                                        </Ellipsis>
                                    </div>
                                    <Badge
                                        tone={selectedEventState.tone}
                                        size="sm"
                                        className="bg-black/35 text-white border-white/20"
                                    >
                                        {selectedEventState.label}
                                    </Badge>
                                    {eventPanelOpen ? (
                                        <ChevronUp className="h-4 w-4 text-white/70" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-white/70" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {eventPanelOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="mt-2 rounded-[var(--radius-lg)] bg-black/65 p-3 backdrop-blur-md"
                                        >
                                            <p className="mb-2 text-[11px] text-white/75">Pilih event yang ingin discan</p>
                                            <Select
                                                value={eventId}
                                                onChange={handleEventChange}
                                                options={eventOptions}
                                                className="[&_button]:!bg-white/10 [&_button]:!text-white [&_button]:!border-white/20 [&_svg]:!text-white/70"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </header>

                {/* ── Camera viewport ────────────────────────────── */}
                <div className="relative flex-1 min-h-0 overflow-hidden">
                    {/* html5-qrcode mounts <video> here */}
                    <div
                        id={SCANNER_DOM_ID}
                        className="absolute inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
                    />

                    {/* Loading overlay */}
                    {!cameraReady && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/80">
                            <Camera className="h-10 w-10 animate-pulse" />
                            <p className="text-sm">Mengaktifkan kamera…</p>
                        </div>
                    )}

                    {/* Vignette */}
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

                    {/* Flash */}
                    <AnimatePresence>
                        {flashType && (
                            <motion.div
                                key={flashType}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.55, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35, times: [0, 0.4, 1] }}
                                className={cn(
                                    'pointer-events-none absolute inset-0 z-20',
                                    flashType === 'success' ? 'bg-emerald-400' : 'bg-red-500',
                                )}
                            />
                        )}
                    </AnimatePresence>

                    {/* Reticle */}
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                        <div className="relative aspect-square" style={{ width: 'clamp(160px, 50%, 280px)' }}>
                            <Corner className="-left-1 -top-1 border-l-2 border-t-2" />
                            <Corner className="-right-1 -top-1 border-r-2 border-t-2" />
                            <Corner className="-bottom-1 -left-1 border-b-2 border-l-2" />
                            <Corner className="-bottom-1 -right-1 border-b-2 border-r-2" />
                            <motion.div
                                className="absolute inset-x-3 h-0.5 bg-[color:var(--brand-300)] shadow-[0_0_12px_rgba(103,232,249,0.8)]"
                                animate={{ top: ['8%', '92%', '8%'] }}
                                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </div>
                    </div>

                    {/* Scan result toast */}
                    <AnimatePresence>
                        {lastResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className={cn(
                                    'pointer-events-none absolute top-3 left-1/2 z-30 w-[min(88%,360px)] -translate-x-1/2 rounded-[var(--radius-lg)] border p-3 backdrop-blur-md',
                                    lastResult.ok
                                        ? 'border-emerald-400/40 bg-emerald-500/30'
                                        : 'border-red-400/40 bg-red-500/30',
                                )}
                            >
                                <div className="flex items-start gap-2.5">
                                    {lastResult.ok ? (
                                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-200" />
                                    ) : (
                                        <XCircle className="h-5 w-5 flex-shrink-0 text-red-200" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {lastResult.ok ? (
                                            <>
                                                <Ellipsis as="p" className="text-sm font-semibold">
                                                    {lastResult.attendance?.nama}
                                                </Ellipsis>
                                                <p className="text-xs text-white/85">
                                                    NIM {lastResult.attendance?.nim} · {lastResult.attendance?.status_label}
                                                    {lastResult.attendance?.check_in_time
                                                        ? ` · ${lastResult.attendance.check_in_time}`
                                                        : ''}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-medium">{lastResult.message}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Footer ─────────────────────────────────────── */}
                <footer className="relative z-30 shrink-0 flex flex-col items-center gap-2 px-4 pb-2 pt-2 sm:px-6">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white/85 backdrop-blur-md">
                        <ScanLine className="h-3.5 w-3.5" />
                        Arahkan QR ke tengah bingkai
                    </p>
                    <button
                        onClick={() => setManualOpen(true)}
                        className="flex h-11 items-center gap-2 rounded-[var(--radius-pill)] bg-[color:var(--ink-button)] px-[30px] text-sm font-bold text-[color:var(--canvas)] shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-md hover:bg-[color:var(--charcoal)] active:scale-[0.98]"
                    >
                        <Keyboard className="h-4 w-4" />
                        Input Manual
                    </button>
                </footer>
                </div>

                {/* ── Recent scans ──────────────────────────────────
                    Lives in the light gap between the dark scanner block
                    and the BottomNav. Uses surface-soft / canvas tokens so
                    it visually belongs to the admin shell, not the camera
                    tool. Capped height with internal scroll so a long list
                    never pushes the camera viewport. */}
                <RecentScansPanel
                    items={recent}
                    selectedEventId={eventId}
                />
            </div>

            {/* Manual input sheet */}
            <Sheet
                open={manualOpen}
                onClose={() => setManualOpen(false)}
                side="bottom"
                title="Input Manual"
                description="Pakai mode QR untuk paste token atau NIM untuk fallback."
            >
                <form onSubmit={submitManual} className="space-y-4">
                    <div
                        role="tablist"
                        aria-label="Mode input manual"
                        className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[color:var(--surface-base)] p-1"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={manualMode === 'qr'}
                            onClick={() => setManualMode('qr')}
                            className={cn(
                                'rounded-[var(--radius-pill)] px-4 py-2 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] transition',
                                manualMode === 'qr'
                                    ? 'bg-[color:var(--ink-deep)] text-[color:var(--canvas)]'
                                    : 'bg-[color:var(--canvas)] text-[color:var(--ink)] border border-[color:var(--hairline)] hover:bg-[color:var(--surface-soft)]',
                            )}
                        >
                            Kode QR
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={manualMode === 'nim'}
                            onClick={() => setManualMode('nim')}
                            className={cn(
                                'rounded-[var(--radius-pill)] px-4 py-2 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] transition',
                                manualMode === 'nim'
                                    ? 'bg-[color:var(--ink-deep)] text-[color:var(--canvas)]'
                                    : 'bg-[color:var(--canvas)] text-[color:var(--ink)] border border-[color:var(--hairline)] hover:bg-[color:var(--surface-soft)]',
                            )}
                        >
                            NIM
                        </button>
                    </div>

                    {manualMode === 'qr' ? (
                        <Field
                            label="Kode QR"
                            hint="Tempel kode QR jika kamera tidak bisa membaca."
                            htmlFor="manual-qr-input"
                        >
                            <Input
                                id="manual-qr-input"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="qr-token-…"
                                className="font-mono text-sm"
                                autoFocus
                            />
                        </Field>
                    ) : (
                        <Field
                            label="NIM Mahasiswa"
                            hint="Ketik NIM (digit). Gunakan kalau anggota tidak bawa QR."
                            htmlFor="manual-nim-input"
                        >
                            <Input
                                id="manual-nim-input"
                                value={manualNim}
                                onChange={(e) => setManualNim(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="0000000001"
                                inputMode="numeric"
                                autoComplete="off"
                                className="font-mono text-sm tracking-wider"
                                autoFocus
                            />
                        </Field>
                    )}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setManualOpen(false)}
                            fullWidth
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                !eventId ||
                                (manualMode === 'qr' ? !manualCode.trim() : !manualNim.trim())
                            }
                            fullWidth
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </Sheet>

            <ConfirmScanDialog
                pending={pendingScan}
                confirming={confirming}
                onConfirm={confirmPendingScan}
                onCancel={cancelPendingScan}
            />
        </>
    );
}

function Corner({ className }) {
    return (
        <span
            className={cn(
                'absolute h-7 w-7 rounded-[2px] border-[color:var(--brand-300)] shadow-[0_0_16px_rgba(103,232,249,0.45)]',
                className,
            )}
        />
    );
}

const STATUS_CONFIG = {
    hadir: { tone: 'success', label: 'Hadir' },
    terlambat: { tone: 'warning', label: 'Terlambat' },
    izin: { tone: 'info', label: 'Izin' },
    sakit: { tone: 'info', label: 'Sakit' },
    alpha: { tone: 'danger', label: 'Alpha' },
};

/**
 * RecentScansPanel — light strip beneath the dark scanner block.
 *
 * Filters to the currently-selected event so the operator sees only the
 * stream relevant to their station. When no event is selected (or the
 * filtered list is empty), shows the empty state.
 *
 * Capped at 36vh with internal scroll so the panel never starves the
 * camera viewport on small phones.
 */
function RecentScansPanel({ items, selectedEventId }) {
    const filtered = useMemo(() => {
        if (!selectedEventId) return items;
        return items.filter((a) => a.event_id === selectedEventId);
    }, [items, selectedEventId]);

    return (
        <section
            className="relative z-30 shrink-0 border-t border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] px-3 pb-[env(safe-area-inset-bottom,8px)] pt-2 sm:px-4"
            style={{ maxHeight: '36vh' }}
        >
            <div className="mb-1.5 flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--steel)]">
                    Absensi Terbaru
                </p>
                {filtered.length > 0 && (
                    <span className="text-[10px] text-[color:var(--steel)]">
                        {filtered.length} entri
                    </span>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[color:var(--hairline)] px-3 py-4 text-center">
                    <ScanLine className="h-4 w-4 text-[color:var(--steel)]" />
                    <p className="text-xs text-[color:var(--charcoal)]">Belum ada absensi tercatat</p>
                </div>
            ) : (
                <ul
                    className="flex flex-col gap-1.5 overflow-y-auto pr-0.5"
                    style={{ maxHeight: 'calc(36vh - 36px)' }}
                >
                    {filtered.map((a) => {
                        const cfg = STATUS_CONFIG[a.status] ?? { tone: 'neutral', label: a.status_label ?? a.status };
                        return (
                            <li
                                key={a.id}
                                className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[color:var(--hairline-soft)] bg-[color:var(--surface-soft)] px-2.5 py-1.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <Ellipsis as="p" className="text-xs font-semibold text-[color:var(--ink-deep)]">
                                        {a.nama}
                                    </Ellipsis>
                                    <p className="text-[10px] text-[color:var(--steel)]">
                                        NIM {a.nim}
                                    </p>
                                </div>
                                <Badge tone={cfg.tone} size="sm" className="shrink-0">
                                    {cfg.label}
                                </Badge>
                                <span className="hidden shrink-0 items-center gap-0.5 text-[10px] text-[color:var(--steel)] sm:flex">
                                    <Clock className="h-3 w-3" />
                                    {formatScanTime(a.check_in_time)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

/**
 * Backend serializes check_in_time as `dd MMM yyyy, HH:mm:ss`. The full
 * string is too noisy in a dense list, so trim to just the time tail.
 */
function formatScanTime(value) {
    if (!value) return '';
    const idx = value.lastIndexOf(', ');
    const tail = idx >= 0 ? value.slice(idx + 2) : value;
    // Drop seconds: 14:32:05 → 14:32
    return tail.split(':').slice(0, 2).join(':');
}



const STATUS_TONE = {
    hadir: 'success',
    terlambat: 'warning',
    izin: 'info',
    sakit: 'info',
    alpha: 'danger',
};

/**
 * ConfirmScanDialog — muncul saat mode 'confirm' setelah preview sukses.
 * Menampilkan info anggota + status yang akan dicatat. Admin klik
 * "Konfirmasi" untuk men-trigger scan beneran, atau "Batal" untuk
 * membuang scan dan kembali ke kamera.
 */
function ConfirmScanDialog({ pending, confirming, onConfirm, onCancel }) {
    const open = Boolean(pending);
    const preview = pending?.preview;

    const tone = preview ? STATUS_TONE[preview.would_be_status] ?? 'neutral' : 'neutral';

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            title="Konfirmasi Absensi"
            description="Periksa data anggota di bawah, lalu konfirmasi untuk mencatat absensi."
            size="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onCancel} disabled={confirming}>
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        loading={confirming}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                        Konfirmasi & Simpan
                    </Button>
                </>
            }
        >
            {preview && (
                <div className="space-y-4">
                    <div className="rounded-[var(--radius-xl)] border border-[color:var(--hairline-soft)] bg-[color:var(--surface-soft)] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--steel)]">
                            Anggota
                        </p>
                        <p className="mt-1 text-base font-bold text-[color:var(--ink-deep)]">
                            {preview.member?.nama ?? '—'}
                        </p>
                        <p className="text-sm text-[color:var(--charcoal)]">
                            NIM {preview.member?.nim ?? '—'}
                            {preview.member?.departemen ? ` · ${preview.member.departemen}` : ''}
                            {preview.member?.jabatan ? ` · ${preview.member.jabatan}` : ''}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[var(--radius-xl)] border border-[color:var(--hairline-soft)] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--steel)]">
                                Event
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[color:var(--ink-deep)]">
                                {preview.event?.nama_kegiatan ?? '—'}
                            </p>
                            <p className="text-xs text-[color:var(--charcoal)]">
                                {preview.event?.waktu_mulai && preview.event?.waktu_selesai
                                    ? `${preview.event.waktu_mulai}–${preview.event.waktu_selesai}`
                                    : '—'}
                                {preview.event?.batas_absensi ? ` · batas ${preview.event.batas_absensi}` : ''}
                            </p>
                        </div>
                        <div className="rounded-[var(--radius-xl)] border border-[color:var(--hairline-soft)] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--steel)]">
                                Status & Waktu
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge tone={tone} size="sm">
                                    {preview.would_be_status_label ?? preview.would_be_status}
                                </Badge>
                                <span className="text-xs text-[color:var(--charcoal)]">
                                    {preview.scan_time_label ?? ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
}
