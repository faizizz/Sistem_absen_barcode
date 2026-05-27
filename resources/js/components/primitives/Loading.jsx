import { cn } from '@/lib/cn';

/**
 * Skeleton — uses the surface-soft → hairline-soft shimmer scale.
 * Default radius is 8px (input-like), override via className.
 */
export function Skeleton({ className }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--surface-soft)] dark:bg-[rgba(255,255,255,0.06)]',
                className,
            )}
        />
    );
}

/**
 * Spinner — cobalt brand color. Stroke width tuned for crisp rendering
 * at 18px and below (matches Meta's button-md icon scale).
 */
export function Spinner({ size = 18, className }) {
    return (
        <svg
            className={cn('animate-spin text-[color:var(--primary)]', className)}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}
