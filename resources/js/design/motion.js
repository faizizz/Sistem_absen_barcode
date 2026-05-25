export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
};

export const dialogTransition = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
};

export const sheetUp = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', stiffness: 320, damping: 32 },
};

export const sheetSide = {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { type: 'spring', stiffness: 320, damping: 32 },
};

export const toastSlide = {
    initial: { y: -12, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -8, opacity: 0 },
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
};

export const listStagger = {
    animate: {
        transition: { staggerChildren: 0.03 },
    },
};

export const listItem = {
    initial: { y: 6, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.18, ease: [0.25, 1, 0.5, 1] },
};

export const scanFlash = {
    initial: { opacity: 0 },
    animate: { opacity: [0, 0.65, 0] },
    transition: { duration: 0.35, times: [0, 0.4, 1] },
};
