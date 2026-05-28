import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import Page from './Page';
import { api } from '@/lib/api';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    router: {
        reload: vi.fn(),
    },
}));

vi.mock('@/lib/api', () => ({
    api: {
        post: vi.fn(),
    },
}));

vi.mock('@/lib/toast', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('@/lib/audio', () => ({
    beepSuccess: vi.fn(),
    beepError: vi.fn(),
}));

let html5Instance = null;
const startSpy = vi.fn();
const stopSpy = vi.fn(async () => {});
const pauseSpy = vi.fn(() => {});
const resumeSpy = vi.fn(() => {});
const getCamerasSpy = vi.fn(async () => [
    { id: 'cam-back', label: 'Back Camera' },
    { id: 'cam-front', label: 'Front Camera' },
]);

vi.mock('html5-qrcode', () => {
    class Html5Qrcode {
        static getCameras = getCamerasSpy;

        constructor() {
            html5Instance = this;
            this.isScanning = false;
            this.start = startSpy.mockImplementation(async (_, __, onSuccess) => {
                this.isScanning = true;
                this.onSuccess = onSuccess;
                return null;
            });
            this.stop = stopSpy.mockImplementation(async () => {
                this.isScanning = false;
            });
            this.pause = pauseSpy.mockImplementation(() => {
                this.isPaused = true;
            });
            this.resume = resumeSpy.mockImplementation(() => {
                this.isPaused = false;
            });
        }
    }

    return { Html5Qrcode };
});

Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: vi.fn(() => []),
});

const activeEvents = [
    {
        id: 11,
        nama_kegiatan: 'Latihan Baris',
        waktu_mulai: '08:00',
        waktu_selesai: '10:00',
        time_state: 'active',
        is_open_for_scan: true,
    },
];

function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function renderPage() {
    render(<Page activeEvents={activeEvents} recentAttendances={[]} />);
}

beforeEach(() => {
    vi.clearAllMocks();
    html5Instance = null;
    window.localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe('ScannerPage loading modal', () => {
    it('shows a loading modal, pauses camera scanning, and blocks follow-up scans while the save request is in flight', async () => {
        const deferred = createDeferred();
        api.post.mockImplementationOnce(() => deferred.promise);

        renderPage();

        await waitFor(() => expect(startSpy).toHaveBeenCalled());

        await act(async () => {
            html5Instance.onSuccess('QR-001');
        });

        await screen.findByText(/Memproses scan/i);
        expect(screen.getByText(/QR terdeteksi/i)).toBeInTheDocument();
        expect(pauseSpy).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledTimes(1);

        await act(async () => {
            html5Instance.onSuccess('QR-002');
        });
        expect(api.post).toHaveBeenCalledTimes(1);

        await act(async () => {
            deferred.resolve({
                data: {
                    attendance: {
                        id: 1001,
                        nama: 'Budi Santoso',
                        nim: '20210001',
                        status_label: 'Hadir',
                        check_in_time: '28 Mei 2026, 10:10:10',
                        event_id: 11,
                    },
                },
            });
        });

        await waitFor(() => {
            expect(screen.queryByText(/Memproses scan/i)).not.toBeInTheDocument();
        });
        expect(screen.getAllByText(/Budi Santoso/i).length).toBeGreaterThan(0);
        expect(resumeSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps the scanner paused during preview, then resumes only after confirm is finished', async () => {
        window.localStorage.setItem('scanner.confirmMode', 'confirm');
        const previewDeferred = createDeferred();
        const saveDeferred = createDeferred();
        api.post
            .mockImplementationOnce(() => previewDeferred.promise)
            .mockImplementationOnce(() => saveDeferred.promise);

        renderPage();

        await waitFor(() => expect(startSpy).toHaveBeenCalled());

        await act(async () => {
            html5Instance.onSuccess('QR-ABC');
        });

        await screen.findByText(/Memverifikasi scan/i);
        expect(pauseSpy).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledTimes(1);

        await act(async () => {
            previewDeferred.resolve({
                data: {
                    member: {
                        nama: 'Siti Aminah',
                        nim: '20210002',
                        departemen: 'TI',
                        jabatan: 'Anggota',
                    },
                    event: {
                        nama_kegiatan: 'Latihan Baris',
                        waktu_mulai: '08:00',
                        waktu_selesai: '10:00',
                        batas_absensi: '09:00',
                    },
                    would_be_status: 'hadir',
                    would_be_status_label: 'Hadir',
                    scan_time_label: '10:11',
                },
            });
        });

        expect(await screen.findByText(/Konfirmasi Absensi/i)).toBeInTheDocument();
        expect(screen.queryByText(/Memverifikasi scan/i)).not.toBeInTheDocument();
        expect(resumeSpy).not.toHaveBeenCalled();

        await act(async () => {
            screen.getByRole('button', { name: /Konfirmasi & Simpan/i }).click();
        });
        expect(api.post).toHaveBeenCalledTimes(2);
        await waitFor(() => {
            expect(screen.queryByText(/Memproses scan/i)).not.toBeInTheDocument();
        });

        await act(async () => {
            saveDeferred.resolve({
                data: {
                    attendance: {
                        id: 1002,
                        nama: 'Siti Aminah',
                        nim: '20210002',
                        status_label: 'Hadir',
                        check_in_time: '28 Mei 2026, 10:11:00',
                        event_id: 11,
                    },
                },
            });
        });

        await waitFor(() => {
            expect(screen.queryByText(/Konfirmasi Absensi/i)).not.toBeInTheDocument();
        });
        expect(resumeSpy).toHaveBeenCalledTimes(1);
    });
});
