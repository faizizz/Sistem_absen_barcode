import { useEffect, useState } from 'react';
import { ChevronsDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ScrollToBottomButton — DESIGN.md `button-icon-circular` chrome.
 *
 * Spec mapping:
 *   - background `{colors.canvas}`, icon `{colors.ink}`, rounded `{rounded.circle}`
 *   - 40×40px on desktop; bumps to 44×44 on mobile per DESIGN.md
 *     "Touch Targets" (icon buttons hit AAA on touch surfaces).
 *   - level-2 sticky-panel shadow lifts the FAB off the canvas because it
 *     IS a sticky-bar utility (per the elevation rules).
 *
 * It appears only when the host page is longer than the viewport and the
 * user has scrolled past `threshold`; bumps higher when stickyCta is true
 * so it never overlaps the page-action CTA.
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
            const docH = Math.max(
                document.documentElement.scrollHeight,
                document.body?.scrollHeight ?? 0,
            );

            const scrollable = docH - viewportH > threshold;
            if (!scrollable) {
                setShow(false);
                return;
            }

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
                /* Canvas + ink icon, perfect circle, AA-on-desktop / AAA-on-mobile size. */
                'fixed right-4 z-40 flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-full',
                'bg-[color:var(--canvas)] text-[color:var(--ink)] border border-[color:var(--hairline-soft)] shadow-[var(--shadow-md)]',
                'transition-all duration-200 ease-out hover:bg-[color:var(--surface-soft)] active:scale-95',
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
