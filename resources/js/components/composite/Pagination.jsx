import { Link, router } from '@inertiajs/react';
import { cn } from '@/lib/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination strip with two layouts:
 *   - Mobile (< sm): compact "Prev · Halaman X dari Y · Next" plus a
 *     jump-to-page <select>. Number buttons are hidden so the strip never
 *     wraps regardless of total pages.
 *   - sm and above: full numeric strip exactly as before.
 *
 * Both layouts are driven by the same Laravel `links` array. Laravel's
 * paginator emits an array of { url, label, active } shaped like:
 *   [ {previous}, {1}, {2}, ..., {n}, {next} ]
 * Sometimes with `...` separators (label="...") that have a null url.
 */
export function Pagination({ links, className }) {
    if (!links || links.length <= 3) return null;

    // Strip Previous/Next entries (always at the ends in Laravel's payload).
    const prev = links[0];
    const next = links[links.length - 1];
    const middle = links.slice(1, -1);

    // Numeric pages only (drop "..." separators which have no url).
    const numericPages = middle
        .filter((l) => l.url && /^\d+$/.test(stripLabel(l.label)))
        .map((l) => ({
            page: parseInt(stripLabel(l.label), 10),
            url: l.url,
            active: l.active,
        }));

    // Pick the largest visible page number as a stand-in for "total pages".
    // Fall back to `numericPages.length` for tiny ranges.
    const totalPages = numericPages.length
        ? Math.max(...numericPages.map((p) => p.page))
        : 0;
    const currentPage =
        numericPages.find((p) => p.active)?.page ??
        // If active page got truncated out of the visible window, derive it
        // from prev.url (?page=N-1) → +1, falling back to 1.
        derivePageFromUrl(prev?.url, +1) ??
        1;

    function jumpTo(e) {
        const target = e.target.value;
        if (target) router.visit(target, { preserveScroll: true });
    }

    return (
        <nav
            className={cn(
                'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-1.5',
                className,
            )}
            aria-label="Pagination"
        >
            {/* Mobile compact row: Prev · Halaman X dari Y · Next */}
            <div className="flex items-center justify-between gap-2 sm:hidden">
                <PageLink
                    link={prev}
                    ariaLabel="Halaman sebelumnya"
                    className="min-w-[7.5rem]"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                </PageLink>

                <p className="px-2 text-center text-xs font-medium text-[color:var(--text-secondary)]">
                    Halaman{' '}
                    <span className="font-semibold text-[color:var(--text-primary)]">
                        {currentPage}
                    </span>{' '}
                    dari{' '}
                    <span className="font-semibold text-[color:var(--text-primary)]">
                        {totalPages || currentPage}
                    </span>
                </p>

                <PageLink
                    link={next}
                    ariaLabel="Halaman berikutnya"
                    className="min-w-[7.5rem] justify-end"
                >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                </PageLink>
            </div>

            {/* Mobile jump-to-page (only when there's something to jump to). */}
            {numericPages.length > 1 && (
                <label className="flex items-center gap-2 text-xs text-[color:var(--text-muted)] sm:hidden">
                    <span className="shrink-0">Ke halaman</span>
                    <select
                        value={
                            numericPages.find((p) => p.active)?.url ?? ''
                        }
                        onChange={jumpTo}
                        className="h-10 flex-1 rounded-[var(--radius-sm)] border border-[color:var(--border-default)] bg-[color:var(--surface-raised)] px-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--brand-400)] focus:outline-none"
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

            {/* Desktop full numeric strip — unchanged behaviour. */}
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

                    const base =
                        'inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] border px-3 text-sm transition-colors';
                    const active = link.active
                        ? 'border-[color:var(--brand-500)] bg-[color:var(--brand-500)] text-white'
                        : 'border-[color:var(--border-default)] bg-[color:var(--surface-raised)] text-[color:var(--text-primary)] hover:border-[color:var(--brand-400)] hover:bg-[color:var(--surface-base)] hover:text-[color:var(--brand-700)] dark:hover:bg-[rgba(255,255,255,0.06)]';

                    if (!link.url) {
                        return (
                            <span
                                key={idx}
                                className={cn(
                                    base,
                                    'cursor-not-allowed border-[color:var(--border-subtle)] text-[color:var(--text-muted)]',
                                )}
                            >
                                {content}
                            </span>
                        );
                    }
                    return (
                        <Link
                            key={idx}
                            href={link.url}
                            preserveScroll
                            className={cn(base, active)}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

/**
 * Mobile Prev/Next button. Renders as a Link when the URL is present,
 * otherwise a disabled-looking span so the layout stays stable at the
 * first/last page.
 */
function PageLink({ link, children, ariaLabel, className }) {
    const base =
        'inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors';
    const enabled =
        'border-[color:var(--border-default)] bg-[color:var(--surface-raised)] text-[color:var(--text-primary)] hover:border-[color:var(--brand-400)] hover:bg-[color:var(--surface-base)] hover:text-[color:var(--brand-700)] dark:hover:bg-[rgba(255,255,255,0.06)]';
    const disabled =
        'cursor-not-allowed border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] text-[color:var(--text-muted)] opacity-60';

    if (!link?.url) {
        return (
            <span
                aria-disabled="true"
                className={cn(base, disabled, className)}
            >
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

/**
 * Try to recover the active page number from a sibling Laravel page URL
 * (e.g. ?page=4) by adding `delta`. Used as a fallback when the active
 * page itself isn't in the visible numeric window.
 */
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
