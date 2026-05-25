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
    { key: 'admin.dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/kuasa/dashboard' },
    { key: 'admin.events', label: 'Event', icon: CalendarDays, href: '/kuasa/events' },
    { key: 'admin.scanner', label: 'Scanner', icon: ScanLine, href: '/kuasa/scanner' },
    { key: 'admin.members', label: 'Anggota', icon: Users, href: '/kuasa/members' },
    { key: 'admin.audit-logs', label: 'Audit', icon: History, href: '/kuasa/audit-logs' },
];

export function BottomNav({ className }) {
    const { url } = usePage();

    function isActive(href) {
        return url === href || url.startsWith(href + '/') || url.startsWith(href + '?');
    }

    return (
        <nav
            className={cn(
                'fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] md:hidden',
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
                            'relative flex h-[var(--shell-bottomnav-h)] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-200',
                            active
                                ? 'text-[color:var(--accent-700)] dark:text-[color:var(--accent-200)]'
                                : 'text-[color:var(--text-muted)]',
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId="bottomNavBar"
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[color:var(--accent-600)]"
                            />
                        )}
                        <motion.div
                            animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                        >
                            <Icon className="h-5 w-5" />
                        </motion.div>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
