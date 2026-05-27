import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@/lib/theme';
import { installFlashBridge } from '@/lib/flash';
import { ToastViewport } from '@/components/primitives/Toast';

initTheme();
installFlashBridge();

const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    title: (title) => (title ? `${title} · Sistem Absen` : 'Sistem Absen'),
    resolve: (name) => {
        return pages[`./Pages/${name}.jsx`]();
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
