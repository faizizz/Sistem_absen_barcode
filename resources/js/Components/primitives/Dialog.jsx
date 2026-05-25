import { Dialog as HUIDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }) {
    const sizeMap = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

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
                    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" aria-hidden="true" />
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
                                'relative w-full overflow-hidden bg-[color:var(--surface-raised)] shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)] rounded-t-[var(--radius-xl)]',
                                sizeMap[size] ?? sizeMap.md,
                            )}
                        >
                            <header className="flex items-start justify-between gap-4 border-b border-[color:var(--border-subtle)] px-6 py-4">
                                <div>
                                    {title && (
                                        <DialogTitle className="text-base font-semibold tracking-tight text-[color:var(--text-primary)]">
                                            {title}
                                        </DialogTitle>
                                    )}
                                    {description && (
                                        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-[var(--radius-sm)] p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-glass)] hover:text-[color:var(--text-primary)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>
                            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto app-scrollbar">{children}</div>
                            {footer && (
                                <footer className="flex justify-end gap-2 border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-6 py-3">
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
