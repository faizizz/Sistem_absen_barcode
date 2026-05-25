let counter = 0;
const listeners = new Set();
const toasts = [];

function emit() {
    listeners.forEach((cb) => cb([...toasts]));
}

function add(type, message, opts = {}) {
    const id = ++counter;
    const toast = {
        id,
        type,
        message,
        title: opts.title,
        duration: opts.duration ?? (type === 'error' ? 6000 : 4000),
    };
    toasts.push(toast);
    emit();

    if (toast.duration > 0) {
        setTimeout(() => dismiss(id), toast.duration);
    }
    return id;
}

export function dismiss(id) {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
        toasts.splice(idx, 1);
        emit();
    }
}

export const toast = {
    success: (message, opts) => add('success', message, opts),
    error: (message, opts) => add('error', message, opts),
    info: (message, opts) => add('info', message, opts),
    warning: (message, opts) => add('warning', message, opts),
};

export function subscribe(cb) {
    listeners.add(cb);
    cb([...toasts]);
    return () => listeners.delete(cb);
}
