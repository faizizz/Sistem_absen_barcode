import { cn } from '@/lib/cn';

export function Skeleton({ className }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-[var(--radius-md)] bg-[color:var(--neutral-100)] dark:bg-[rgba(255,255,255,0.06)]',
                className,
            )}
        />
    );
}

export function Spinner({ size = 18, className }) {
    return (
        <svg
            className={cn('animate-spin text-[color:var(--brand-500)]', className)}
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
