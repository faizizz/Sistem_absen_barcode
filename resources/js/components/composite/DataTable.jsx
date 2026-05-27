import { cn } from '@/lib/cn';

/**
 * DataTable — desktop hairline table + mobile card list.
 *
 * Styled to DESIGN.md `tech-specs-table` rules:
 *   - canvas surface, 16px radius, hairline-soft cell separators
 *   - label cells: `body-sm-bold` (14 / 700 / -0.14px) in ink
 *   - value cells: `body-sm`      (14 / 400 / -0.14px) in charcoal
 *   - column heads: `caption-bold` (12 / 700 / 1.33) uppercase steel
 *   - hover row tint: surface-soft
 *
 * Mobile fallback uses `feature-icon-row` chrome (canvas, 16px radius,
 * hairline border) so each row reads like a small product feature card.
 */
export function DataTable({ columns, rows, rowKey = 'id', emptyState, className, mobileItem }) {
    const isEmpty = !rows || rows.length === 0;
    const actionsCol = columns.find((c) => c.key === 'actions');
    const dataCols = columns.filter((c) => c.key !== 'actions');

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {/* Desktop table */}
            <div className="hidden md:block">
                <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)]">
                    <div className="overflow-x-auto app-scrollbar">
                        <table className="min-w-full">
                            <thead className="bg-[color:var(--surface-soft)] border-b border-[color:var(--hairline-soft)]">
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={cn(
                                                'px-5 py-3.5 text-left text-xs font-bold uppercase leading-[1.33] tracking-[0.14em] text-[color:var(--steel)]',
                                                col.align === 'right' && 'text-right',
                                                col.align === 'center' && 'text-center',
                                                col.className,
                                            )}
                                            style={col.width ? { width: col.width } : undefined}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--hairline-soft)]">
                                {isEmpty ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-5 py-10">
                                            {emptyState}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, idx) => (
                                        <tr
                                            key={row[rowKey] ?? idx}
                                            className="transition-colors hover:bg-[color:var(--surface-soft)]"
                                        >
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        'px-5 py-4 align-middle text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--ink)]',
                                                        col.align === 'right' && 'text-right',
                                                        col.align === 'center' && 'text-center',
                                                        col.cellClassName,
                                                    )}
                                                >
                                                    {col.render ? col.render(row, idx) : row[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
                {isEmpty ? (
                    emptyState
                ) : (
                    <div className="space-y-3">
                        {rows.map((row, idx) => (
                            <div
                                key={row[rowKey] ?? idx}
                                className="rounded-[var(--radius-xl)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] p-5"
                            >
                                {mobileItem ? (
                                    mobileItem(row, idx)
                                ) : (
                                    <>
                                        <dl className="space-y-2.5">
                                            {dataCols.map((col) => (
                                                <div key={col.key} className="flex items-start justify-between gap-3">
                                                    <dt className="text-xs font-bold uppercase leading-[1.33] tracking-[0.14em] text-[color:var(--steel)]">
                                                        {col.label}
                                                    </dt>
                                                    <dd className="text-right text-sm leading-[1.43] [letter-spacing:-0.14px] text-[color:var(--ink)]">
                                                        {col.render ? col.render(row, idx) : row[col.key]}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {actionsCol && (
                                            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[color:var(--hairline-soft)] pt-3">
                                                {actionsCol.render ? actionsCol.render(row, idx) : null}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
