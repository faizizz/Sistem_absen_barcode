import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/primitives/Button';
import { Select } from '@/components/primitives/Select';
import { Badge } from '@/components/primitives/Badge';
import { Input } from '@/components/primitives/Input';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { beepSuccess, beepError } from '@/lib/audio';
import {
    Camera,
    CameraOff,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Info,
    XCircle,
    ScanLine,
    SwitchCamera,
    Keyboard,
    X as XIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const SCANNER_DOM_ID = 'qr-scanner-region';
const TOP_SAFE_OFFSET = 'calc(env(safe-area-inset-top, 0px) + 10px)';
const BOTTOM_SAFE_OFFSET = 'calc(var(--shell-bottomnav-h) + env(safe-area-inset-bottom, 0px) + 10px)';

export default function ScannerPage({ activeEvents }) {
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
    const [hintOpen, setHintOpen] = useState(false);

    const html5Ref = useRef(null);
    const submittingRef = useRef(false);
    const lastScanRef = useRef({ code: null, time: 0 });
    const eventIdRef = useRef(eventId);
    const eventPanelRef = useRef(null);

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
        // Responsive scan box: ~70% of the smaller viewport edge, capped at 360px.
        // A larger box gives html5-qrcode more pixels to work with and dramatically
        // improves decode success on phones where users hold the QR off-center.
        const qrbox = (viewW, viewH) => {
            const min = Math.min(viewW, viewH);
            const size = Math.max(180, Math.min(360, Math.floor(min * 0.7)));
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
        if (submittingRef.current) return;

        const now = Date.now();
        if (lastScanRef.current.code === code && now - lastScanRef.current.time < 2500) return;
        lastScanRef.current = { code, time: now };
        submittingRef.current = true;

        try {
            const payload = {
                mode,
                event_id: currentEvent,
                ...(mode === 'nim' ? { nim: code } : { qr_code: code }),
            };
            const { data } = await api.post('/kuasa/attendances/scan', payload);
            setFlashType('success');
            beepSuccess();
            setLastResult({ ok: true, ...data });
        } catch (err) {
            // The session-expired interceptor already showed a toast and is
            // redirecting; don't double-flash the user with a second message.
            if (err?.sessionExpired) {
                return;
            }
            const msg = err?.response?.data?.message ?? 'Gagal mencatat absen.';
            setFlashType('error');
            beepError();
            setLastResult({ ok: false, message: msg });
        } finally {
            submittingRef.current = false;
            setTimeout(() => setFlashType(null), 400);
            setTimeout(() => setLastResult(null), 4000);
        }
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
        <div className="absolute inset-0 bg-black text-white overflow-hidden">
            <Head title="Scanner" />

            {/* Camera viewport — fullscreen */}
            <div id={SCANNER_DOM_ID} className="absolute inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover" />

            {/* Loading state */}
            {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                    <Camera className="h-10 w-10 animate-pulse" />
                    <p className="text-sm">Mengaktifkan kamera…</p>
                </div>
            )}

            {/* Dim vignette so overlay UI reads */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65" />

            {/* Flash overlay */}
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
                <div className="relative h-[min(70vw,320px)] w-[min(70vw,320px)]">
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

            {/* Top bar */}
            <header className="absolute inset-x-0 z-30 px-4 sm:px-6" style={{ top: TOP_SAFE_OFFSET }}>
                <div className="flex items-center justify-end gap-2">
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

                <div className="mt-2" ref={eventPanelRef}>
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
                                    <p className="truncate text-sm font-medium text-white">
                                        {selectedEvent?.nama_kegiatan ?? 'Pilih event'}
                                    </p>
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

            {/* Bottom bar */}
            <footer
                className="absolute inset-x-0 z-30 flex flex-col items-center gap-2 px-4 pb-2 sm:px-6"
                style={{ bottom: BOTTOM_SAFE_OFFSET }}
            >
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setHintOpen((v) => !v)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md hover:bg-black/70"
                        aria-label="Tampilkan petunjuk scan"
                        aria-expanded={hintOpen}
                    >
                        <Info className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setManualOpen(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-[color:var(--brand-600)] px-5 text-sm font-medium text-white shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-md hover:bg-[color:var(--brand-700)] active:scale-[0.98]"
                    >
                        <Keyboard className="h-4 w-4" />
                        Input Manual
                    </button>
                </div>

                <AnimatePresence>
                    {hintOpen && (
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex items-center gap-2 rounded-full bg-black/55 px-4 py-1.5 text-[11px] text-white/85 backdrop-blur-md"
                        >
                            <ScanLine className="h-3.5 w-3.5" />
                            Arahkan QR ke tengah bingkai
                        </motion.p>
                    )}
                </AnimatePresence>
            </footer>

            {/* Last result toast (in-screen) */}
            <AnimatePresence>
                {lastResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className={cn(
                            'pointer-events-none absolute left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 rounded-[var(--radius-lg)] border p-3 backdrop-blur-md',
                            lastResult.ok
                                ? 'border-emerald-400/40 bg-emerald-500/30'
                                : 'border-red-400/40 bg-red-500/30',
                        )}
                        style={{
                            top: eventPanelOpen
                                ? 'calc(env(safe-area-inset-top, 0px) + 190px)'
                                : 'calc(env(safe-area-inset-top, 0px) + 112px)',
                        }}
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
                                        <p className="truncate text-sm font-semibold">
                                            {lastResult.attendance?.nama}
                                        </p>
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

            {/* Manual input sheet */}
            <AnimatePresence>
                {manualOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
                        onClick={() => setManualOpen(false)}
                    >
                        <motion.form
                            onSubmit={submitManual}
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-t-[var(--radius-xl)] bg-[color:var(--surface-raised)] p-5 text-[color:var(--text-primary)] sm:rounded-[var(--radius-xl)]"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold tracking-tight">Input Manual</h3>
                                <button
                                    type="button"
                                    onClick={() => setManualOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-base)]"
                                    aria-label="Tutup"
                                >
                                    <XIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div
                                role="tablist"
                                aria-label="Mode input manual"
                                className="mb-3 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[color:var(--surface-base)] p-1"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={manualMode === 'qr'}
                                    onClick={() => setManualMode('qr')}
                                    className={cn(
                                        'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition',
                                        manualMode === 'qr'
                                            ? 'bg-[color:var(--brand-600)] text-white shadow-sm'
                                            : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]',
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
                                        'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition',
                                        manualMode === 'nim'
                                            ? 'bg-[color:var(--brand-600)] text-white shadow-sm'
                                            : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]',
                                    )}
                                >
                                    NIM
                                </button>
                            </div>

                            {manualMode === 'qr' ? (
                                <>
                                    <p className="mb-3 text-xs text-[color:var(--text-muted)]">
                                        Tempel kode QR jika kamera tidak bisa membaca.
                                    </p>
                                    <Input
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="qr-token-…"
                                        className="font-mono text-sm"
                                        autoFocus
                                    />
                                </>
                            ) : (
                                <>
                                    <p className="mb-3 text-xs text-[color:var(--text-muted)]">
                                        Ketik NIM mahasiswa (digit). Gunakan kalau anggota tidak bawa QR.
                                    </p>
                                    <Input
                                        value={manualNim}
                                        onChange={(e) => setManualNim(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="0000000001"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="font-mono text-sm tracking-wider"
                                        autoFocus
                                    />
                                </>
                            )}
                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button type="button" variant="ghost" onClick={() => setManualOpen(false)} fullWidth>
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
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
