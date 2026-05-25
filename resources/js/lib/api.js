import axios from 'axios';
import { toast } from '@/lib/toast';

/**
 * Shared axios instance for the SPA.
 *
 * CSRF strategy: we rely entirely on Laravel's XSRF-TOKEN cookie, which
 * Laravel sets/refreshes on every response that touches the session.
 * Axios automatically reads it and forwards it as the `X-XSRF-TOKEN`
 * header when `withCredentials` is enabled.
 *
 * We intentionally do NOT also send `X-CSRF-TOKEN` from the
 * <meta name="csrf-token"> tag: that tag is rendered once at page load
 * and goes stale after the session rotates (login, expiry, etc.).
 * Laravel's VerifyCsrfToken checks `X-CSRF-TOKEN` before falling back to
 * the cookie-based header, so a stale meta value causes 419 mismatches
 * on long-lived pages like the scanner.
 */
export const api = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Track if we've already kicked off a redirect so multiple in-flight 401/419s
// don't stack toasts or fight each other for window.location.
let sessionLost = false;

/**
 * Graceful handler for an expired/missing session.
 *
 * Triggered by:
 *   - 419 Page Expired   → CSRF cookie gone or rotated past validity
 *   - 401 Unauthenticated → session expired entirely
 *
 * Shows a toast then redirects to the login page after a short delay so
 * the user can read the message.
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 419 || status === 401) {
            // Mark the error so call sites can skip their own toast/UI.
            if (error) error.sessionExpired = true;

            if (!sessionLost) {
                sessionLost = true;
                toast.error('Sesi berakhir. Silakan login ulang.');
                setTimeout(() => {
                    window.location.href = '/kuasa';
                }, 1500);
            }
        }

        return Promise.reject(error);
    },
);
