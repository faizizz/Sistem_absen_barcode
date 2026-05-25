import { useEffect, useState } from 'react';
import { ChevronsDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Floating "scroll to bottom" action button.
 *
 * Appears only when:
 *   1. The page actually has more content than the viewport,
 *   2. The user has scrolled at least `threshold` px from the top, AND
 *   3. The user is not already near the bottom (≥ `threshold` px away).
 *
 * Layout:
 *   - On mobile we sit above the BottomNav and the iOS safe-area inset.
 *   - On md and up the BottomNav is hidden so we just clear the viewport edge.
 *   - When `stickyCta` is true, additional vertical clearance is added so
 *     the FAB never overlaps a page-level sticky action button. Pages that
 *     mount a sticky CTA (Dashboard, Events list, Members list, Event Show)
 *     pass this flag through AdminShell.
 *
 * Props:
 *   threshold (number): how close to the top/bottom (in px) we still
 *                        consider a no-op. Default 120.
 *   stickyCta (bool):   true when the host page already has a sticky
 *                        bottom action button so we need to bump up.
 *   className (string): extra classes for positioning overrides.
 */
export function ScrollToBottomButton({
    threshold = 120,
    stickyCta = false,
    className,
}) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        function evaluate() {
            if (typeof window === 'undefined') return;

            const viewportH = window.innerHeight;
            // Use the larger of body/document scrollHeight to handle browsers
            // that sometimes report only one or the other reliably.
            const docH = Math.max(
                document.documentElement.scrollHeight,
                document.body?.scrollHeight ?? 0,
            );

            // Page must be longer than viewport before the button is useful.
            const scrollable = docH - viewportH > threshold;
            if (!scrollable) {
                setShow(false);
                return;
            }

            // Hide while the user is still at (or very near) the top — the
            // button is only useful once they've started scrolling down.
            if (window.scrollY < threshold) {
                setShow(false);
                return;
            }

            const distanceFromBottom = docH - (window.scrollY + viewportH);
            setShow(distanceFromBottom > threshold);
        }

        evaluate();
        window.addEventListener('scroll', evaluate, { passive: true });
        window.addEventListener('resize', evaluate);
        // Watch for content changes (Inertia partial reloads, dynamic data,
        // collapsing/expanding cards) that change scrollHeight.
        const obs = new MutationObserver(evaluate);
        obs.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
        });

        return () => {
            window.removeEventListener('scroll', evaluate);
            window.removeEventListener('resize', evaluate);
            obs.disconnect();
        };
    }, [threshold]);

    function scrollToBottom() {
        const docH = Math.max(
            document.documentElement.scrollHeight,
            document.body?.scrollHeight ?? 0,
        );
        window.scrollTo({ top: docH, behavior: 'smooth' });
    }

    if (!show) return null;

    return (
        <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Gulir ke bawah"
            className={cn(
                // Mobile: sit above the bottom nav (h-14 ≈ 60px) plus safe-area.
                // When the page also has a sticky CTA we add ~64px more so the
                // FAB clears it. md+ has no bottom nav so we just bump for the
                // floating CTA at bottom-4 right-6 (h-12 ≈ 48px) when present.
                'fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full',
                'bg-[color:var(--brand-600)] text-white shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-md',
                'transition-all duration-200 ease-out hover:bg-[color:var(--brand-700)] active:scale-95',
                stickyCta
                    ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+136px)] md:bottom-24 md:right-6'
                    : 'bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] md:bottom-6 md:right-6',
                className,
            )}
        >
            <ChevronsDown className="h-5 w-5" />
        </button>
    );
}

export default ScrollToBottomButton;
