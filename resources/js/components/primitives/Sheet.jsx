import { Dialog as HUIDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Sheet — slide-in panel (mobile bottom drawer or right-side rail).
 * Mirrors the DESIGN.md sticky-bottom-bar pattern used on PDP at < 768px.
 */
export function Sheet({ open, onClose, title, description, children, side = 'right' }) {
    const sideClasses = {
        right: {
            container: 'justify-end',
            panel: 'h-full w-full sm:max-w-md sm:rounded-l-[var(--radius-2xl)] sm:rounded-r-none',
            enterFrom: 'translate-x-full',
            enterTo: 'translate-x-0',
            leaveFrom: 'translate-x-0',
            leaveTo: 'translate-x-full',
        },
        bottom: {
            container: 'items-end justify-center',
            panel: 'w-full max-h-[85vh] rounded-t-[var(--radius-3xl)]',
            enterFrom: 'translate-y-full',
            enterTo: 'translate-y-0',
            leaveFrom: 'translate-y-0',
            leaveTo: 'translate-y-full',
        },
    };
    const cfg = sideClasses[side] ?? sideClasses.right;

    return (
        <Transition show={open} as={Fragment}>
            <HUIDialog onClose={onClose} className="relative z-50">
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="fixed inset-0 backdrop-blur-sm"
                        style={{ background: 'rgba(10, 19, 23, 0.55)' }}
                        aria-hidden="true"
                    />
                </TransitionChild>

                <div className={cn('fixed inset-0 z-50 flex', cfg.container)}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom={cfg.enterFrom}
                        enterTo={cfg.enterTo}
                        leave="ease-in duration-200"
                        leaveFrom={cfg.leaveFrom}
                        leaveTo={cfg.leaveTo}
                    >
                        <DialogPanel
                            className={cn(
                                'relative flex flex-col bg-[color:var(--canvas)] shadow-[var(--shadow-md)]',
                                cfg.panel,
                            )}
                        >
                            <header className="flex items-start justify-between gap-4 border-b border-[color:var(--hairline-soft)] px-5 py-4">
                                <div className="min-w-0">
                                    {title && (
                                        <DialogTitle className="meta-heading-sm text-[color:var(--ink-deep)]">
                                            {title}
                                        </DialogTitle>
                                    )}
                                    {description && (
                                        <p className="mt-1.5 text-base [letter-spacing:-0.16px] leading-[1.5] text-[color:var(--charcoal)]">{description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
                                    aria-label="Tutup"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>
                            <div className="flex-1 overflow-y-auto app-scrollbar px-5 py-4">{children}</div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </HUIDialog>
        </Transition>
    );
}
