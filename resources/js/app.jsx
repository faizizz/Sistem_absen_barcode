import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@/lib/theme';
import { installFlashBridge } from '@/lib/flash';
import { ToastViewport } from '@/components/primitives/Toast';

initTheme();
installFlashBridge();

createInertiaApp({
    title: (title) => (title ? `${title} · Sistem Absen` : 'Sistem Absen'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                <ToastViewport />
            </>,
        );
    },
    progress: {
        color: 'var(--brand-500)',
        showSpinner: false,
    },
});
