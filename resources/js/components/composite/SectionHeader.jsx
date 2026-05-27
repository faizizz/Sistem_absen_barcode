import { cn } from '@/lib/cn';

/**
 * SectionHeader — Meta editorial three-tier rhythm.
 *
 * Hierarchy (DESIGN.md §Typography):
 *   eyebrow     : `caption-bold`  (12px / 700 / 1.33)  uppercase, steel
 *   title       : `heading-lg`    (36px / 500 / 1.28)  display face
 *   description : `subtitle-md`   (18px / 400 / 1.44)  charcoal
 *   action      : flex pill cluster on the right
 *
 * The 500-weight display + 400-weight subtitle pairing is the brand's
 * signature visual rhythm called out in Principles.
 */
export function SectionHeader({ eyebrow, title, description, action, className }) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="meta-eyebrow">
                        {eyebrow}
                    </p>
                )}
                {title && (
                    <h1 className="mt-2 meta-heading-lg text-[color:var(--ink-deep)]">
                        {title}
                    </h1>
                )}
                {description && (
                    <p className="mt-3 max-w-2xl text-lg leading-[1.44] text-[color:var(--charcoal)]">{description}</p>
                )}
            </div>
            {action && <div className="flex flex-wrap gap-2">{action}</div>}
        </div>
    );
}
