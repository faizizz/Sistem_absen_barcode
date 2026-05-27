import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';

/**
 * Select — visually matched to the Input control.
 *
 * Trigger:
 *   - 44px tall, hairline 1px, 8px radius, body-md typography
 *   - on focus the border swaps to fb-blue 2px (text-input-focused)
 *   - inset padding compensates so the box doesn't shift size
 *
 * Popup:
 *   - canvas surface, hairline border, 8px radius, level-2 shadow
 *   - active option uses surface-soft background
 *   - selected option carries cobalt check icon (matches `radio-option-selected`
 *     cobalt-on-canvas signaling)
 */
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
                        'flex w-full h-11 items-center justify-between rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--canvas)] px-3 py-3 text-left text-base [letter-spacing:-0.16px] text-[color:var(--ink)] transition-colors',
                        'focus:outline-none data-[focus]:border-[color:var(--fb-blue)] data-[focus]:border-2 data-[focus]:px-[11px] data-[focus]:py-[11px]',
                        'disabled:opacity-60',
                    )}
                >
                    <span className={cn(!selected && 'text-[color:var(--steel)]')}>
                        {selected ? optionLabel(selected) : placeholder}
                    </span>
                    <ChevronDown className="h-4 w-4 text-[color:var(--steel)]" />
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
                        className="z-[100] max-h-72 w-[var(--button-width)] overflow-auto rounded-[var(--radius-lg)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] p-1.5 shadow-[var(--shadow-md)] focus:outline-none app-scrollbar"
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
                                            'flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm [letter-spacing:-0.14px]',
                                            optDisabled
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'cursor-pointer',
                                            focus && !optDisabled && 'bg-[color:var(--surface-soft)] text-[color:var(--ink-deep)]',
                                            isSel && 'font-bold text-[color:var(--ink-deep)]',
                                        )
                                    }
                                >
                                    {({ selected: isSel }) => (
                                        <>
                                            <span>{optionLabel(opt)}</span>
                                            {isSel && <Check className="h-4 w-4 text-[color:var(--primary)]" />}
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
