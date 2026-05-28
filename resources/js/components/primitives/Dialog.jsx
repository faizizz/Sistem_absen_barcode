import { Dialog as HUIDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Dialog — Meta-style modal.
 * Rounds to 24px (`--radius-2xl`) on desktop and 24px top-only on the
 * mobile bottom sheet variant. Surface is canvas; backdrop is the
 * `rgba(10,19,23,0.55)` ink translucent overlay called out in DESIGN.md.
 */
export function Dialog({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closable = true,
}) {
    const sizeMap = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };
    const handleClose = closable ? onClose : () => {};

    return (
        <Transition show={open} as={Fragment}>
            <HUIDialog onClose={handleClose} className="relative z-50">
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

                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 sm:scale-95 translate-y-4 sm:translate-y-0"
                        enterTo="opacity-100 sm:scale-100 translate-y-0"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 sm:scale-100"
                        leaveTo="opacity-0 sm:scale-95"
                    >
                        <DialogPanel
                            className={cn(
                                'relative w-full overflow-hidden bg-[color:var(--canvas)] shadow-[var(--shadow-md)] sm:rounded-[var(--radius-2xl)] rounded-t-[var(--radius-2xl)]',
                                sizeMap[size] ?? sizeMap.md,
                            )}
                        >
                            <header className="flex items-start justify-between gap-4 border-b border-[color:var(--hairline-soft)] px-6 py-5">
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
                                {closable && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
                                        aria-label="Tutup"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </header>
                            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto app-scrollbar">{children}</div>
                            {footer && (
                                <footer className="flex flex-wrap justify-end gap-2 border-t border-[color:var(--hairline-soft)] bg-[color:var(--surface-soft)] px-6 py-4">
                                    {footer}
                                </footer>
                            )}
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </HUIDialog>
        </Transition>
    );
}
