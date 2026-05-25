import { cn } from '@/lib/cn';

export function DataTable({ columns, rows, rowKey = 'id', emptyState, className, mobileItem }) {
    const isEmpty = !rows || rows.length === 0;
    const actionsCol = columns.find((c) => c.key === 'actions');
    const dataCols = columns.filter((c) => c.key !== 'actions');

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {/* Desktop table */}
            <div className="hidden md:block">
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)]">
                    <div className="overflow-x-auto app-scrollbar">
                        <table className="min-w-full text-sm">
                            <thead className="bg-[color:var(--surface-base)] border-b border-[color:var(--border-subtle)]">
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={cn(
                                                'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]',
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
                            <tbody className="divide-y divide-[color:var(--border-subtle)]">
                                {isEmpty ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-8">
                                            {emptyState}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, idx) => (
                                        <tr
                                            key={row[rowKey] ?? idx}
                                            className="transition-colors hover:bg-[color:var(--surface-base)]"
                                        >
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        'px-4 py-3 text-sm align-middle text-[color:var(--text-primary)]',
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
                    <div className="space-y-2.5">
                        {rows.map((row, idx) => (
                            <div
                                key={row[rowKey] ?? idx}
                                className="rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-4"
                            >
                                {mobileItem ? (
                                    mobileItem(row, idx)
                                ) : (
                                    <>
                                        <dl className="space-y-1.5 text-sm">
                                            {dataCols.map((col) => (
                                                <div key={col.key} className="flex items-start justify-between gap-3">
                                                    <dt className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                                                        {col.label}
                                                    </dt>
                                                    <dd className="text-right text-[color:var(--text-primary)]">
                                                        {col.render ? col.render(row, idx) : row[col.key]}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {actionsCol && (
                                            <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-[color:var(--border-subtle)] pt-3">
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
