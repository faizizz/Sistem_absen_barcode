import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/primitives/Button';
import { BottomNav } from '@/components/BottomNav';
import { ScrollToBottomButton } from '@/components/primitives/ScrollToBottomButton';
import { toggleTheme } from '@/lib/theme';
import {
    LayoutDashboard,
    CalendarDays,
    ScanLine,
    Users,
    History,
    LogOut,
    Menu,
    X,
    Moon,
    Sun,
    QrCode,
} from 'lucide-react';

const NAV = [
    { key: 'admin.dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/kuasa/dashboard' },
    { key: 'admin.events', label: 'Event', icon: CalendarDays, href: '/kuasa/events' },
    { key: 'admin.scanner', label: 'Scanner', icon: ScanLine, href: '/kuasa/scanner' },
    { key: 'admin.members', label: 'Anggota', icon: Users, href: '/kuasa/members' },
    { key: 'admin.audit-logs', label: 'Audit', icon: History, href: '/kuasa/audit-logs' },
];

export function AdminShell({ children, title, eyebrow, description, actions, fullBleed, stickyCta = false }) {
    const { url, props } = usePage();
    const admin = props.auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setThemeState] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.dataset.theme : 'light',
    );

    const isActive = (href) => url === href || url.startsWith(href + '/') || url.startsWith(href + '?');

    function onToggleTheme() {
        toggleTheme();
        setThemeState(document.documentElement.dataset.theme);
    }

    function logout() {
        router.post('/logout');
    }

    return (
        <div
            className={cn(
                'bg-[color:var(--surface-base)] text-[color:var(--text-primary)]',
                fullBleed ? 'flex min-h-screen flex-col' : 'min-h-screen',
            )}
        >
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-[var(--shell-sidebar-w)] flex-col border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] md:flex">
                <div className="flex h-[var(--shell-topbar-h)] items-center gap-2.5 border-b border-[color:var(--border-subtle)] px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--brand-600)] text-white">
                        <QrCode className="h-4 w-4" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold tracking-tight">Sistem Absen</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 app-scrollbar">
                    <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                        Navigasi
                    </p>
                    <ul className="space-y-0.5">
                        {NAV.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'group relative flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 text-sm font-medium transition-colors',
                                            active
                                                ? 'border-[color:var(--accent-200)] bg-[color:var(--accent-50)] text-[color:var(--accent-900)] dark:border-[rgba(147,181,228,0.28)] dark:bg-[rgba(147,181,228,0.12)] dark:text-[color:var(--accent-100)]'
                                                : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-base)] hover:text-[color:var(--text-primary)]',
                                        )}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId="sidebarActiveBar"
                                                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                                                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-[color:var(--accent-600)]"
                                            />
                                        )}
                                        <Icon
                                            className={cn(
                                                'h-4 w-4 transition-colors',
                                                active
                                                    ? 'text-[color:var(--accent-800)] dark:text-[color:var(--accent-200)]'
                                                    : 'text-[color:var(--text-muted)] group-hover:text-[color:var(--accent-600)]',
                                            )}
                                        />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="border-t border-[color:var(--border-subtle)] p-3">
                    <div className="rounded-[var(--radius-md)] bg-[color:var(--surface-base)] p-3">
                        <p className="truncate text-xs font-semibold text-[color:var(--text-primary)]">
                            {admin?.login_code ?? 'admin'}
                        </p>
                        <p className="text-[11px] text-[color:var(--text-muted)]">Admin · {admin?.role ?? 'admin'}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                            <Button size="xs" variant="ghost" onClick={onToggleTheme} className="flex-1">
                                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                                {theme === 'dark' ? 'Terang' : 'Gelap'}
                            </Button>
                            <Button size="xs" variant="dangerSoft" onClick={logout}>
                                <LogOut className="h-3.5 w-3.5" />
                                Keluar
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                            className="absolute inset-0 bg-black/55"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.9 }}
                            className="relative mr-auto flex h-full w-72 flex-col bg-[color:var(--surface-raised)] shadow-[var(--shadow-lg)]"
                        >
                            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--brand-600)] text-white">
                                        <QrCode className="h-4 w-4" />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-sm font-semibold">Sistem Absen</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-[var(--radius-md)] p-2 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-base)]"
                                    aria-label="Tutup menu"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <nav className="flex-1 overflow-y-auto px-3 py-3">
                                <ul className="space-y-1">
                                    {NAV.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <li key={item.key}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-3 py-3 text-sm font-medium',
                                                        active
                                                            ? 'border-[color:var(--accent-200)] bg-[color:var(--accent-50)] text-[color:var(--accent-900)] dark:border-[rgba(147,181,228,0.28)] dark:bg-[rgba(147,181,228,0.12)] dark:text-[color:var(--accent-100)]'
                                                            : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-base)]',
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    {item.label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                            <div className="border-t border-[color:var(--border-subtle)] p-3 space-y-2">
                                <p className="truncate text-xs text-[color:var(--text-muted)]">{admin?.login_code}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={onToggleTheme} className="flex-1">
                                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                        Tema
                                    </Button>
                                    <Button size="sm" variant="dangerSoft" onClick={logout} className="flex-1">
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </Button>
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className={cn('md:pl-[var(--shell-sidebar-w)]', fullBleed && 'flex flex-1 flex-col')}>
                {/* Mobile top bar */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] px-4 md:hidden">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-[var(--radius-md)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-base)]"
                        aria-label="Buka menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-600)] text-white">
                            <QrCode className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-semibold tracking-tight">Sistem Absen</p>
                    </div>
                    <button
                        onClick={onToggleTheme}
                        className="rounded-[var(--radius-md)] p-2 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-base)]"
                        aria-label="Ganti tema"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </header>

                {/* Page content */}
                <main
                    className={cn(
                        'relative',
                        fullBleed
                            ? 'flex-1 p-0 pb-16 md:pb-0'
                            : 'px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pt-8',
                    )}
                >
                    {fullBleed ? (
                        children
                    ) : (
                        <motion.div
                            key={url}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                        >
                            {(eyebrow || title || description || actions) && (
                                <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="min-w-0">
                                        {eyebrow && (
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                                {eyebrow}
                                            </p>
                                        )}
                                        {title && (
                                            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight leading-tight sm:text-[28px]">
                                                {title}
                                            </h1>
                                        )}
                                        {description && (
                                            <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-secondary)]">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    {actions && (
                                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
                                            {actions}
                                        </div>
                                    )}
                                </div>
                            )}
                            {children}
                        </motion.div>
                    )}
                </main>

                <BottomNav />
            </div>
            {!fullBleed && <ScrollToBottomButton stickyCta={stickyCta} />}
        </div>
    );
}
