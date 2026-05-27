import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';

export function QrDisplayView({ qrToken, profile, onReset }) {
    const qrRef = useRef(null);

    function handleDownload() {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-absen-${profile?.nim ?? 'unknown'}.png`;
        a.click();
    }

    async function handleShare() {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas || !navigator.canShare) {
            handleDownload();
            return;
        }
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `qr-absen-${profile?.nim}.png`, { type: 'image/png' });
            try {
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'QR Absen' });
                } else {
                    handleDownload();
                }
            } catch { /* ignored */ }
        });
    }

    return (
        <section className="flex flex-col items-center gap-5 rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-5 sm:p-7">
            <div className="text-center">
                <Badge tone="success" size="md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Aktif & Permanen
                </Badge>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">{profile.nama}</h2>
                <p className="text-sm text-[color:var(--text-secondary)]">
                    NIM {profile.nim} · {profile.departemen}
                </p>
            </div>

            <div
                ref={qrRef}
                className="rounded-[var(--radius-xl)] border border-[color:var(--border-subtle)] bg-white p-5"
            >
                <QRCodeCanvas value={qrToken} size={280} level="H" marginSize={4} />
            </div>

            <p className="text-center text-xs text-[color:var(--text-muted)]">
                Tunjukkan QR ke admin scanner saat kegiatan.
            </p>

            <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button onClick={handleDownload} variant="outline" size="lg" className="flex-1" leftIcon={<Download className="h-4 w-4" />}>
                    Unduh PNG
                </Button>
                <Button onClick={handleShare} variant="outline" size="lg" className="flex-1">
                    Simpan ke Foto
                </Button>
            </div>

            <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-[22px] py-[10px] text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--ink-deep)] hover:bg-[color:var(--surface-soft)]"
            >
                <RefreshCw className="h-3.5 w-3.5" />
                Ganti NIM
            </button>
        </section>
    );
}

export default QrDisplayView;
