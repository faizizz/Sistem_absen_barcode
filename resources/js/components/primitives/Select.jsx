import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';

export function Select({
    value,
    onChange,
    options,
    placeholder = 'Pilih…',
    className,
    disabled,
    optionLabel = (o) => (typeof o === 'string' ? o : o?.label),
    optionValue = (o) => (typeof o === 'string' ? o : o?.value),
    optionDisabled = (o) => (typeof o === 'string' ? false : Boolean(o?.disabled)),
}) {
    const selected = options.find((o) => optionValue(o) === value);

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={cn('relative', className)}>
                <ListboxButton
                    className={cn(
                        'flex w-full min-h-11 items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--border-default)] bg-[color:var(--surface-raised)] px-4 py-2.5 text-left text-sm text-[color:var(--text-primary)] transition-shadow focus:outline-none focus:border-[color:var(--brand-500)] focus:shadow-[var(--shadow-focus-ring)] disabled:opacity-60',
                    )}
                >
                    <span className={cn(!selected && 'text-[color:var(--text-muted)]')}>
                        {selected ? optionLabel(selected) : placeholder}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-[color:var(--text-muted)]" />
                </ListboxButton>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <ListboxOptions
                        portal
                        anchor={{ to: 'bottom start', gap: '6px' }}
                        modal={false}
                        className="z-[100] max-h-72 w-[var(--button-width)] overflow-auto rounded-[var(--radius-md)] border border-[color:var(--border-default)] bg-[color:var(--surface-raised)] p-1 shadow-[var(--shadow-lg)] focus:outline-none app-scrollbar"
                    >
                        {options.map((opt) => {
                            const v = optionValue(opt);
                            const isDisabled = optionDisabled(opt);
                            return (
                                <ListboxOption
                                    key={v ?? optionLabel(opt)}
                                    value={v}
                                    disabled={isDisabled}
                                    className={({ focus, selected: isSel, disabled: optDisabled }) =>
                                        cn(
                                            'flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm',
                                            optDisabled
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'cursor-pointer',
                                            focus && !optDisabled && 'bg-[color:var(--surface-base)] text-[color:var(--text-primary)] dark:bg-[rgba(255,255,255,0.06)]',
                                            isSel && 'font-semibold',
                                        )
                                    }
                                >
                                    {({ selected: isSel }) => (
                                        <>
                                            <span>{optionLabel(opt)}</span>
                                            {isSel && <Check className="h-4 w-4 text-[color:var(--brand-600)]" />}
                                        </>
                                    )}
                                </ListboxOption>
                            );
                        })}
                    </ListboxOptions>
                </Transition>
            </div>
        </Listbox>
    );
}
