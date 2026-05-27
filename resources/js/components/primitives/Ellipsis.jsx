import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Ellipsis — reusable text-truncation primitive.
 *
 * Truncates child content via Tailwind's `truncate` (single-line) or
 * `line-clamp-{n}` (multi-line) utilities, and reveals the full content
 * inside a portaled tooltip on hover/focus when the text is actually
 * truncated. Tooltip is non-interactive (`pointer-events: none`).
 *
 * Why a portal?
 *   The tooltip would be clipped by ancestor `overflow-hidden` containers
 *   (cards, table cells, sticky CTAs) if rendered in-place. Mounting under
 *   `document.body` and positioning with `getBoundingClientRect()` keeps it
 *   visible regardless of ancestor overflow.
 *
 * Why detect overflow?
 *   Always-visible tooltips on non-truncated text feel intrusive. We compare
 *   `scrollWidth/Width` (1-line) or `scrollHeight/Height` (multi-line) and
 *   skip the tooltip when content fits.
 *
 * Props match the contract documented in
 * `.kiro/plans/ellipsis/plan.md`.
 */
export function Ellipsis({
    as: Component = 'span',
    lines = 1,
    showTooltip = true,
    tooltipClassName,
    className,
    children,
    ...rest
}) {
    const contentRef = useRef(null);
    const [overflowing, setOverflowing] = useState(false);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, placeAbove: true });
    const tooltipId = useId();

    const showTimerRef = useRef(null);
    const hideTimerRef = useRef(null);

    // Multi-line clamp uses inline style because Tailwind only ships
    // line-clamp utilities for 1..6, and even those are sometimes purged
    // when used dynamically. Inline `WebkitLineClamp` works everywhere.
    const truncationStyle =
        lines > 1
            ? {
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: lines,
                  overflow: 'hidden',
              }
            : undefined;

    const truncationClass = lines === 1 ? 'truncate' : '';

    /**
     * Measure overflow now and on every resize.
     */
    useEffect(() => {
        const node = contentRef.current;
        if (!node) return;

        function evaluate() {
            const isMulti = lines > 1;
            // Tiny tolerance (1px) avoids false positives from sub-pixel rounding.
            const overflows = isMulti
                ? node.scrollHeight - node.clientHeight > 1
                : node.scrollWidth - node.clientWidth > 1;
            setOverflowing(overflows);
        }

        evaluate();

        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(evaluate);
            ro.observe(node);
        }
        window.addEventListener('resize', evaluate);

        return () => {
            ro?.disconnect();
            window.removeEventListener('resize', evaluate);
        };
    }, [lines, children]);

    useEffect(() => {
        return () => {
            if (showTimerRef.current) clearTimeout(showTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    function computePosition() {
        const node = contentRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        // Default: above. Flip below when too close to viewport top.
        const placeAbove = rect.top > 80;
        setPosition({
            top: placeAbove ? rect.top - 8 : rect.bottom + 8,
            left: rect.left + rect.width / 2,
            placeAbove,
        });
    }

    function scheduleShow() {
        if (!showTooltip || !overflowing) return;
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        if (open) return;
        showTimerRef.current = setTimeout(() => {
            computePosition();
            setOpen(true);
        }, 200);
    }

    function scheduleHide() {
        if (showTimerRef.current) {
            clearTimeout(showTimerRef.current);
            showTimerRef.current = null;
        }
        hideTimerRef.current = setTimeout(() => setOpen(false), 100);
    }

    function handleFocus() {
        if (!showTooltip || !overflowing) return;
        computePosition();
        setOpen(true);
    }

    return (
        <>
            <Component
                ref={contentRef}
                className={cn(truncationClass, className)}
                style={truncationStyle}
                onMouseEnter={scheduleShow}
                onMouseLeave={scheduleHide}
                onFocus={handleFocus}
                onBlur={() => setOpen(false)}
                aria-describedby={open ? tooltipId : undefined}
                {...rest}
            >
                {children}
            </Component>

            {showTooltip && typeof document !== 'undefined'
                ? createPortal(
                      <AnimatePresence>
                          {open && overflowing && (
                              <motion.div
                                  id={tooltipId}
                                  role="tooltip"
                                  initial={{
                                      opacity: 0,
                                      y: position.placeAbove ? 4 : -4,
                                  }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{
                                      opacity: 0,
                                      y: position.placeAbove ? 4 : -4,
                                  }}
                                  transition={{
                                      duration: 0.15,
                                      ease: [0.25, 1, 0.5, 1],
                                  }}
                                  style={{
                                      position: 'fixed',
                                      top: position.top,
                                      left: position.left,
                                      transform: position.placeAbove
                                          ? 'translate(-50%, -100%)'
                                          : 'translate(-50%, 0)',
                                      pointerEvents: 'none',
                                      zIndex: 60,
                                  }}
                                  className={cn(
                                      'max-w-sm break-words rounded-[var(--radius-lg)] border border-[color:var(--hairline-soft)] bg-[color:var(--canvas)] px-3 py-2 text-sm text-[color:var(--ink-deep)] shadow-[var(--shadow-md)]',
                                      tooltipClassName,
                                  )}
                              >
                                  {children}
                              </motion.div>
                          )}
                      </AnimatePresence>,
                      document.body,
                  )
                : null}
        </>
    );
}
