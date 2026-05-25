const STORAGE_KEY = 'absen.theme';

export function getStoredTheme() {
    if (typeof window === 'undefined') return 'light';
    try {
        return window.localStorage.getItem(STORAGE_KEY) || systemPref();
    } catch {
        return systemPref();
    }
}

function systemPref() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
    if (typeof document === 'undefined') return;
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
}

export function setTheme(theme) {
    applyTheme(theme);
    try {
        window.localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
}

export function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
    applyTheme(getStoredTheme());
}
