import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { subscribe, dismiss } from '@/lib/toast';
import { cn } from '@/lib/cn';
import { toastSlide } from '@/design/motion';

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

/* Pill-radius toast cards in tinted soft fills, hairline border, no
   shadow — matches Meta's flat decorative card style. */
const TONE = {
    success: 'border-[color:var(--success-border)] bg-[color:var(--success-bg)] text-[color:var(--success-fg)]',
    error:   'border-[color:var(--danger-border)]  bg-[color:var(--danger-bg)]  text-[color:var(--danger-fg)]',
    info:    'border-[color:var(--info-border)]    bg-[color:var(--info-bg)]    text-[color:var(--info-fg)]',
    warning: 'border-[color:var(--warning-border)] bg-[color:var(--warning-bg)] text-[color:var(--warning-fg)]',
};

export function ToastViewport() {
    const [items, setItems] = useState([]);

    useEffect(() => subscribe(setItems), []);

    return (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-3 sm:top-4 sm:right-4 sm:left-auto sm:justify-end">
            <div className="flex w-full max-w-sm flex-col gap-2">
                <AnimatePresence initial={false}>
                    {items.map((t) => {
                        const Icon = ICONS[t.type] ?? Info;
                        return (
                            <motion.div
                                key={t.id}
                                {...toastSlide}
                                layout
                                className={cn(
                                    'pointer-events-auto flex items-start gap-3 rounded-[var(--radius-xl)] border px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur',
                                    TONE[t.type] ?? TONE.info,
                                )}
                            >
                                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {t.title && <div className="text-sm font-bold leading-[1.43] [letter-spacing:-0.14px]">{t.title}</div>}
                                    <div className="text-sm leading-[1.43] [letter-spacing:-0.14px]">{t.message}</div>
                                </div>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] opacity-70 transition hover:opacity-100"
                                    aria-label="Tutup"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
