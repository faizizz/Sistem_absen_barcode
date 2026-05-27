import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
    LayoutDashboard,
    CalendarDays,
    ScanLine,
    Users,
    History,
} from 'lucide-react';

const NAV = [
    { key: 'admin.dashboard',  label: 'Dashboard', icon: LayoutDashboard, href: '/kuasa/dashboard' },
    { key: 'admin.events',     label: 'Event',     icon: CalendarDays,    href: '/kuasa/events' },
    { key: 'admin.scanner',    label: 'Scanner',   icon: ScanLine,        href: '/kuasa/scanner' },
    { key: 'admin.members',    label: 'Anggota',   icon: Users,           href: '/kuasa/members' },
    { key: 'admin.audit-logs', label: 'Audit',     icon: History,         href: '/kuasa/audit-logs' },
];

/**
 * BottomNav — mobile-only tab bar.
 *
 * A thin ink-deep indicator line slides across the top edge of the active
 * tab using framer-motion layoutId. The bar surface is canvas with a
 * hairline-soft top divider — the same chrome as Meta's mobile checkout
 * sticky bar.
 */
export function BottomNav({ className }) {
    const { url } = usePage();

    function isActive(href) {
        return url === href || url.startsWith(href + '/') || url.startsWith(href + '?');
    }

    return (
        <nav
            className={cn(
                'fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] md:hidden',
                className,
            )}
            style={{
                height: 'calc(var(--shell-bottomnav-h) + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                            'relative flex h-[var(--shell-bottomnav-h)] flex-col items-center justify-center gap-1 transition-colors duration-200',
                            active ? 'text-[color:var(--ink-deep)]' : 'text-[color:var(--steel)]',
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId="bottomNavLine"
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[color:var(--ink-deep)]"
                            />
                        )}
                        <span className="relative z-10 flex flex-col items-center gap-0.5 text-[11px] font-bold leading-[1.33]">
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
