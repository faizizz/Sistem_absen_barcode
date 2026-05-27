import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

/**
 * Dropdown — Headless UI Menu wrapped in the project's Button trigger and
 * Select-style popup chrome.
 *
 * Designed as the desktop counterpart to the bottom-Sheet "page actions"
 * pattern: on viewports where there is room in the page header we surface
 * actions inline behind a single labeled chevron-trigger; mobile keeps the
 * existing fixed-bottom CTA + Sheet so thumb reach stays optimal.
 *
 * Items use the same shape as the Sheet button list, so callers can keep a
 * single `actions` array as the source of truth and feed both surfaces
 * without duplicating handler logic.
 *
 * Item shape:
 *   {
 *     key?:      string,        // optional react key
 *     label:     string,
 *     icon?:     LucideIcon,    // component (not element); auto-sized
 *     onClick?:  () => void,
 *     href?:     string,        // if present, renders as Inertia <Link>
 *     disabled?: boolean,
 *     title?:    string,        // native tooltip; useful for disabled hints
 *     variant?:  'default' | 'primary' | 'danger',
 *   }
 */
export function Dropdown({
    label,
    icon: TriggerIcon = MoreHorizontal,
    chevron = true,
    items = [],
    align = 'end',
    triggerVariant = 'primary',
    triggerSize = 'md',
    triggerClassName,
    className,
}) {
    return (
        <Menu as="div" className={cn('relative inline-block', className)}>
            <MenuButton
                as={Button}
                variant={triggerVariant}
                size={triggerSize}
                leftIcon={TriggerIcon ? <TriggerIcon className="h-4 w-4" /> : undefined}
                rightIcon={chevron ? <ChevronDown className="h-4 w-4" /> : undefined}
                className={triggerClassName}
            >
                {label}
            </MenuButton>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <MenuItems
                    portal
                    anchor={{
                        to: align === 'end' ? 'bottom end' : 'bottom start',
                        gap: '8px',
                    }}
                    modal={false}
                    className="z-[100] min-w-[14rem] overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] p-1.5 shadow-[var(--shadow-md)] focus:outline-none"
                >
                    {items.map((item, idx) => (
                        <DropdownEntry key={item.key ?? idx} item={item} />
                    ))}
                </MenuItems>
            </Transition>
        </Menu>
    );
}

function DropdownEntry({ item }) {
    const {
        label,
        icon: Icon,
        onClick,
        href,
        disabled,
        title,
        variant = 'default',
    } = item;

    return (
        <MenuItem disabled={disabled}>
            {({ focus, disabled: isDisabled }) => {
                const className = cn(
                    'flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium [letter-spacing:-0.14px] transition-colors',
                    variant === 'danger' && 'text-[color:var(--danger-fg)]',
                    variant === 'primary' && 'text-[color:var(--ink-deep)] font-bold',
                    variant === 'default' && 'text-[color:var(--ink)]',
                    focus &&
                        !isDisabled &&
                        variant === 'danger' &&
                        'bg-[color:var(--danger-bg)]',
                    focus &&
                        !isDisabled &&
                        variant !== 'danger' &&
                        'bg-[color:var(--surface-soft)] text-[color:var(--ink-deep)]',
                    isDisabled && 'cursor-not-allowed opacity-50',
                );

                const inner = (
                    <>
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <span>{label}</span>
                    </>
                );

                if (href && !isDisabled) {
                    return (
                        <Link href={href} className={className} title={title}>
                            {inner}
                        </Link>
                    );
                }

                return (
                    <button
                        type="button"
                        onClick={onClick}
                        disabled={isDisabled}
                        title={title}
                        className={className}
                    >
                        {inner}
                    </button>
                );
            }}
        </MenuItem>
    );
}
