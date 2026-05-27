import { Link, router } from '@inertiajs/react';
import { cn } from '@/lib/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination — Meta pill-button layout.
 *
 * Mobile: compact "Prev · Halaman X dari Y · Next" + jump-to-page select.
 *   Prev/Next buttons mirror `button-secondary` (transparent + border-2
 *   ink-deep) with the disabled state thinning to a hairline-soft border.
 *
 * Desktop: full numeric strip rendered as `button-pill-tab` chips.
 *   - Active page = `button-pill-tab-active` (ink-deep fill, no border).
 *   - Inactive    = `button-pill-tab` (canvas, hairline border).
 *   Both use `body-sm-bold` typography (14px / 700 / -0.14px).
 */
export function Pagination({ links, className }) {
    if (!links || links.length <= 3) return null;

    const prev = links[0];
    const next = links[links.length - 1];
    const middle = links.slice(1, -1);

    const numericPages = middle
        .filter((l) => l.url && /^\d+$/.test(stripLabel(l.label)))
        .map((l) => ({
            page: parseInt(stripLabel(l.label), 10),
            url: l.url,
            active: l.active,
        }));

    const totalPages = numericPages.length
        ? Math.max(...numericPages.map((p) => p.page))
        : 0;
    const currentPage =
        numericPages.find((p) => p.active)?.page ??
        derivePageFromUrl(prev?.url, +1) ??
        1;

    function jumpTo(e) {
        const target = e.target.value;
        if (target) router.visit(target, { preserveScroll: true });
    }

    return (
        <nav
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2',
                className,
            )}
            aria-label="Pagination"
        >
            {/* Mobile compact row */}
            <div className="flex items-center justify-between gap-2 sm:hidden">
                <PageLink link={prev} ariaLabel="Halaman sebelumnya" className="min-w-[7.5rem]">
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                </PageLink>

                <p className="px-2 text-center text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--charcoal)]">
                    Halaman{' '}
                    <span className="text-[color:var(--ink-deep)]">{currentPage}</span>{' '}
                    dari{' '}
                    <span className="text-[color:var(--ink-deep)]">{totalPages || currentPage}</span>
                </p>

                <PageLink link={next} ariaLabel="Halaman berikutnya" className="min-w-[7.5rem] justify-end">
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                </PageLink>
            </div>

            {/* Mobile jump-to-page */}
            {numericPages.length > 1 && (
                <label className="flex items-center gap-2 text-sm text-[color:var(--steel)] sm:hidden">
                    <span className="shrink-0 [letter-spacing:-0.14px]">Ke halaman</span>
                    <select
                        value={numericPages.find((p) => p.active)?.url ?? ''}
                        onChange={jumpTo}
                        className="h-11 flex-1 rounded-[var(--radius-pill)] border border-[color:var(--hairline)] bg-[color:var(--canvas)] px-4 text-base [letter-spacing:-0.16px] text-[color:var(--ink)] focus:border-[color:var(--fb-blue)] focus:outline-none"
                        aria-label="Lompat ke halaman"
                    >
                        {numericPages.map((p) => (
                            <option key={p.page} value={p.url}>
                                Halaman {p.page}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {/* Desktop full numeric pill strip */}
            <div className="hidden flex-wrap items-center justify-center gap-1.5 sm:flex">
                {links.map((link, idx) => {
                    const label = stripLabel(link.label);
                    const isPrev = idx === 0;
                    const isNext = idx === links.length - 1;
                    const content = isPrev ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : isNext ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        label
                    );

                    /* `button-pill-tab` fingerprint: 14px / 700 / -0.14px,
                       8px 16px padding, 1px hairline border, pill radius. */
                    const base =
                        'inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-pill)] border px-4 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] transition-colors';
                    const active = link.active
                        ? 'border-transparent bg-[color:var(--ink-deep)] text-[color:var(--canvas)]'
                        : 'border-[color:var(--hairline)] bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-soft)]';

                    if (!link.url) {
                        return (
                            <span
                                key={idx}
                                className={cn(base, 'cursor-not-allowed border-[color:var(--hairline-soft)] text-[color:var(--stone)]')}
                            >
                                {content}
                            </span>
                        );
                    }
                    return (
                        <Link key={idx} href={link.url} preserveScroll className={cn(base, active)}>
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

/* PageLink — `button-secondary` mobile chrome (transparent + border-2 ink). */
function PageLink({ link, children, ariaLabel, className }) {
    const base =
        'inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-pill)] border-2 px-7 text-sm font-bold leading-[1.43] [letter-spacing:-0.14px] transition-colors';
    const enabled =
        'border-[color:var(--ink-deep)] bg-transparent text-[color:var(--ink-deep)] active:bg-[color:var(--ink-deep)] active:text-[color:var(--canvas)]';
    const disabled =
        'cursor-not-allowed border-[color:var(--hairline-soft)] bg-transparent text-[color:var(--stone)]';

    if (!link?.url) {
        return (
            <span aria-disabled="true" className={cn(base, disabled, className)}>
                {children}
            </span>
        );
    }
    return (
        <Link
            href={link.url}
            preserveScroll
            className={cn(base, enabled, className)}
            aria-label={ariaLabel}
        >
            {children}
        </Link>
    );
}

function stripLabel(label) {
    return String(label ?? '')
        .replace('&laquo;', '')
        .replace('&raquo;', '')
        .replace('Previous', '')
        .replace('Next', '')
        .trim();
}

function derivePageFromUrl(url, delta) {
    if (!url) return null;
    try {
        const u = new URL(url, 'http://localhost');
        const p = parseInt(u.searchParams.get('page') ?? '', 10);
        if (Number.isNaN(p)) return null;
        return p + delta;
    } catch {
        return null;
    }
}
