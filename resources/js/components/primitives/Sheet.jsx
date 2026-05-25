import { Dialog as HUIDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Sheet({ open, onClose, title, description, children, side = 'right' }) {
    const sideClasses = {
        right: {
            container: 'justify-end',
            panel: 'h-full w-full sm:max-w-md rounded-l-[var(--radius-xl)] sm:rounded-l-[var(--radius-2xl)] sm:rounded-r-none',
            enterFrom: 'translate-x-full',
            enterTo: 'translate-x-0',
            leaveFrom: 'translate-x-0',
            leaveTo: 'translate-x-full',
        },
        bottom: {
            container: 'items-end justify-center',
            panel: 'w-full max-h-[85vh] rounded-t-[var(--radius-2xl)]',
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
                    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" aria-hidden="true" />
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
                                'relative flex flex-col bg-[color:var(--surface-raised)] shadow-[var(--shadow-lg)]',
                                cfg.panel,
                            )}
                        >
                            <header className="flex items-start justify-between gap-4 border-b border-[color:var(--border-subtle)] px-5 py-4">
                                <div>
                                    {title && (
                                        <DialogTitle className="text-base font-semibold tracking-tight">
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
                            <div className="flex-1 overflow-y-auto app-scrollbar px-5 py-4">{children}</div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </HUIDialog>
        </Transition>
    );
}
