import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/primitives/Button';
import { BottomNav } from '@/components/BottomNav';
import { ScrollToBottomButton } from '@/components/primitives/ScrollToBottomButton';
import { Ellipsis } from '@/components/primitives/Ellipsis';
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
    ShieldCheck,
} from 'lucide-react';

const NAV = [
    { key: 'admin.dashboard',  label: 'Dashboard', icon: LayoutDashboard, href: '/kuasa/dashboard' },
    { key: 'admin.events',     label: 'Event',     icon: CalendarDays,    href: '/kuasa/events' },
    { key: 'admin.scanner',    label: 'Scanner',   icon: ScanLine,        href: '/kuasa/scanner' },
    { key: 'admin.members',    label: 'Anggota',   icon: Users,           href: '/kuasa/members' },
    { key: 'admin.admins',     label: 'Admin',     icon: ShieldCheck,     href: '/kuasa/admins' },
    { key: 'admin.audit-logs', label: 'Audit',     icon: History,         href: '/kuasa/audit-logs' },
];

/**
 * AdminShell — Meta-style admin chrome.
 *
 * Desktop:
 *   - Stark white sidebar with hairline-soft right divider.
 *   - Brand pill (ink-deep filled, pill radius) at the top.
 *   - Each nav row is a pill-tab. Active row uses the ink-deep filled
 *     pill (mirrors `button-pill-tab-active`). Inactive rows are flat
 *     text in steel that hover-tint to surface-soft.
 *   - Bottom user card uses a soft-tile (surface-soft, 24px radius) with
 *     a small avatar pill, theme toggle, and a critical-soft logout pill.
 *
 * Mobile:
 *   - Compressed top bar: hamburger / brand / theme.
 *   - Drawer slides in from the left at canvas, hairline-soft right edge.
 *   - Bottom tab bar (BottomNav) is rendered separately.
 *
 * Page header:
 *   - Eyebrow (caption-bold uppercase) → display heading → subtitle in
 *     charcoal — three-tier visual rhythm called out in DESIGN.md.
 */
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
                'bg-[color:var(--surface-soft)] text-[color:var(--ink-deep)]',
                fullBleed ? 'flex min-h-screen flex-col' : 'min-h-screen',
            )}
        >
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-[var(--shell-sidebar-w)] flex-col border-r border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] md:flex">
                <div className="flex h-[var(--shell-topbar-h)] items-center gap-3 border-b border-[color:var(--hairline-soft)] px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ink-deep)] text-[color:var(--canvas)]">
                        <QrCode className="h-4 w-4" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-bold tracking-tight">Sistem Absen</p>
                        <p className="text-[11px] text-[color:var(--steel)]">Konsol Admin</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-5 app-scrollbar">
                    <p className="px-3 pb-2 meta-eyebrow">Navigasi</p>
                    <ul className="space-y-1">
                        {NAV.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'group relative flex items-center gap-3 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] transition-colors',
                                            active
                                                ? 'text-[color:var(--canvas)]'
                                                : 'text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--ink-deep)]',
                                        )}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId="sidebarActivePill"
                                                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                                                className="absolute inset-0 rounded-[var(--radius-pill)] bg-[color:var(--ink-deep)]"
                                            />
                                        )}
                                        <Icon className="relative z-10 h-4 w-4" />
                                        <span className="relative z-10">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="border-t border-[color:var(--hairline-soft)] p-3">
                    <div className="rounded-[var(--radius-2xl)] bg-[color:var(--surface-soft)] p-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--ink-deep)] text-xs font-bold text-[color:var(--canvas)]">
                                {(admin?.login_code ?? 'AD').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <Ellipsis as="p" className="text-sm font-bold tracking-tight text-[color:var(--ink-deep)]">
                                    {admin?.login_code ?? 'admin'}
                                </Ellipsis>
                                <p className="text-[11px] text-[color:var(--steel)]">{admin?.role ?? 'admin'}</p>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                            <Button size="xs" variant="ghost" onClick={onToggleTheme}>
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
                            className="absolute inset-0"
                            style={{ background: 'rgba(10, 19, 23, 0.55)' }}
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.9 }}
                            className="relative mr-auto flex h-full w-72 flex-col bg-[color:var(--canvas)] shadow-[var(--shadow-lg)]"
                        >
                            <div className="flex items-center justify-between border-b border-[color:var(--hairline-soft)] px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ink-deep)] text-[color:var(--canvas)]">
                                        <QrCode className="h-4 w-4" />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-sm font-bold tracking-tight">Sistem Absen</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
                                    aria-label="Tutup menu"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <nav className="flex-1 overflow-y-auto px-3 py-4">
                                <ul className="space-y-1.5">
                                    {NAV.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <li key={item.key}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-[var(--radius-pill)] px-4 py-3 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px]',
                                                        active
                                                            ? 'bg-[color:var(--ink-deep)] text-[color:var(--canvas)]'
                                                            : 'text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]',
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
                            <div className="border-t border-[color:var(--hairline-soft)] p-4 space-y-3">
                                <Ellipsis as="p" className="text-xs text-[color:var(--steel)]">{admin?.login_code}</Ellipsis>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="ghost" onClick={onToggleTheme}>
                                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                        Tema
                                    </Button>
                                    <Button size="sm" variant="dangerSoft" onClick={logout}>
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
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[color:var(--hairline-soft)] bg-[color:var(--canvas)]/95 px-4 backdrop-blur md:hidden">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
                        aria-label="Buka menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--ink-deep)] text-[color:var(--canvas)]">
                            <QrCode className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-bold tracking-tight">Sistem Absen</p>
                    </div>
                    <button
                        onClick={onToggleTheme}
                        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]"
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
                            : 'px-4 pb-28 pt-6 sm:px-6 lg:px-12 lg:pt-10',
                    )}
                >
                    {fullBleed ? (
                        children
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                        >
                            {(eyebrow || title || description || actions) && (
                                <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="min-w-0">
                                        {eyebrow && (
                                            <p className="meta-eyebrow">
                                                {eyebrow}
                                            </p>
                                        )}
                                        {title && (
                                            <h1 className="mt-1.5 meta-heading-lg text-[color:var(--ink-deep)]">
                                                {title}
                                            </h1>
                                        )}
                                        {description && (
                                            <p className="mt-3 max-w-2xl text-lg leading-[1.44] text-[color:var(--charcoal)]">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    {actions && (
                                        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
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
