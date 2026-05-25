import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';

/**
 * Integration tests for `Page.jsx` view transitions and API calls.
 *
 * Validates: Requirements 1.1, 1.2, 3.2, 3.4, 4.3, 5.1, 5.2, 5.3, 5.4,
 *            6.4, 6.5, 9.1, 9.2
 *
 * @see .kiro/specs/public-qr-profile-confirmation/design.md
 * @see .kiro/specs/public-qr-profile-confirmation/requirements.md
 */

// ---------------------------------------------------------------------------
// Module-level mocks. These are hoisted to the top of the file by Vitest and
// apply to the static `import Page from './Page'` below. The PublicShell
// availability guard (Req 6.5) is exercised separately via vi.resetModules +
// vi.doMock + dynamic import in its own describe block.
// ---------------------------------------------------------------------------

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
}));

vi.mock('@/lib/api', () => ({
    api: { post: vi.fn() },
}));

vi.mock('@/lib/toast', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

// Default mock for PublicShell — a transparent wrapper that lets us assert
// the `Page` rendered tree includes the shell (Req 6.4) without dragging in
// the real layout's theme/header/footer DOM.
vi.mock('@/layouts/PublicShell', () => ({
    PublicShell: ({ children }) => (
        <div data-testid="public-shell">{children}</div>
    ),
}));

import Page from './Page';
import { api } from '@/lib/api';

const sampleProfile = {
    nama: 'Budi Santoso',
    nim: '20210001',
    departemen: 'Teknik Informatika',
    jabatan: 'Anggota',
};

const sampleQr = { qr_code: 'sample-qr-token-xyz' };

beforeEach(() => {
    vi.clearAllMocks();
});

/**
 * Type a NIM into the lookup form's input and submit it.
 *
 * The Field primitive renders a real `<label htmlFor="nim">NIM Mahasiswa</label>`
 * tied to the Input's `id="nim"`, so `getByLabelText` is the most stable
 * way to reach the NIM input without coupling to layout markup.
 */
function fillNimAndSubmit(nim = sampleProfile.nim) {
    const input = screen.getByLabelText(/NIM Mahasiswa/i);
    fireEvent.change(input, { target: { value: nim } });
    const submitBtn = screen.getByRole('button', { name: /Cari Profil/i });
    fireEvent.click(submitBtn);
}

describe('Page — view transitions and API calls', () => {
    it('submitting the lookup form calls api.post(/lookup-nim, { nim }) (Req 9.1)', async () => {
        api.post.mockResolvedValueOnce({ data: sampleProfile });

        render(<Page />);
        fillNimAndSubmit('20210001');

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/lookup-nim', {
                nim: '20210001',
            });
        });
    });

    it('on /lookup-nim success, the NIM input is no longer in the document and ProfileConfirmationView is rendered (Reqs 1.1, 1.2)', async () => {
        api.post.mockResolvedValueOnce({ data: sampleProfile });

        render(<Page />);
        fillNimAndSubmit();

        // Wait for the confirmation view's heading to appear.
        const heading = await screen.findByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent(sampleProfile.nama);

        // ProfileConfirmationView markers are present.
        expect(screen.getByText('Profil Ditemukan')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /buat QR/i }),
        ).toBeInTheDocument();

        // The NIM input has been unmounted (form view is sibling-switched out).
        expect(screen.queryByLabelText(/NIM Mahasiswa/i)).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Cari Profil/i }),
        ).not.toBeInTheDocument();
    });

    it('clicking Confirm calls api.post(/generate-qr, { nim: profile.nim }) (Reqs 3.2, 9.2)', async () => {
        api.post.mockResolvedValueOnce({ data: sampleProfile });
        api.post.mockResolvedValueOnce({ data: sampleQr });

        render(<Page />);
        fillNimAndSubmit();

        const confirm = await screen.findByRole('button', { name: /buat QR/i });
        fireEvent.click(confirm);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/generate-qr', {
                nim: sampleProfile.nim,
            });
        });
    });

    it('on /generate-qr success, the page transitions to QrDisplayView (Req 4.3)', async () => {
        api.post.mockResolvedValueOnce({ data: sampleProfile });
        api.post.mockResolvedValueOnce({ data: sampleQr });

        render(<Page />);
        fillNimAndSubmit();

        const confirm = await screen.findByRole('button', { name: /buat QR/i });
        fireEvent.click(confirm);

        // QrDisplayView fingerprints: "Aktif & Permanen" status badge and
        // the "Unduh PNG" download button. Both are unique to that view.
        expect(
            await screen.findByText(/Aktif & Permanen/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Unduh PNG/i }),
        ).toBeInTheDocument();

        // Profile_Confirmation_View has been unmounted.
        expect(screen.queryByText('Profil Ditemukan')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /buat QR/i }),
        ).not.toBeInTheDocument();
    });

    it('on /generate-qr non-2xx, ProfileConfirmationView remains with profile preserved and error surfaced; retrying clears the prior error before the next request (Reqs 5.1, 5.2, 5.3, 5.4)', async () => {
        // 1) Lookup succeeds.
        api.post.mockResolvedValueOnce({ data: sampleProfile });
        // 2) First /generate-qr fails with a server-provided message.
        api.post.mockRejectedValueOnce({
            response: { data: { message: 'Server error.' } },
        });
        // 3) Retry: never resolves, so we can assert the error was cleared
        //    *before* the next request settles (Req 5.4).
        let resolveRetry;
        api.post.mockImplementationOnce(
            () =>
                new Promise((res) => {
                    resolveRetry = res;
                }),
        );

        render(<Page />);
        fillNimAndSubmit();

        const confirm = await screen.findByRole('button', { name: /buat QR/i });
        fireEvent.click(confirm);

        // After failure: still in confirm view, profile preserved, alert visible.
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Server error.');
        expect(screen.getByText('Profil Ditemukan')).toBeInTheDocument();
        expect(screen.getByText(sampleProfile.nama)).toBeInTheDocument();
        expect(screen.getByText(/NIM\s+20210001/)).toBeInTheDocument();
        // QrDisplayView did NOT mount.
        expect(screen.queryByText(/Aktif & Permanen/i)).not.toBeInTheDocument();

        // Retry: clicking Confirm again must clear the displayed error
        // *before* the new request settles. The retry mock returns a
        // never-resolving promise, so any cleared-alert assertion can only
        // succeed if the reducer cleared `error` synchronously on
        // GENERATE_REQUEST.
        const confirmAgain = screen.getByRole('button', { name: /buat QR/i });
        fireEvent.click(confirmAgain);

        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        // Profile is still preserved during the in-flight retry.
        expect(screen.getByText(sampleProfile.nama)).toBeInTheDocument();
        expect(screen.getByText('Profil Ditemukan')).toBeInTheDocument();

        // Settle the pending retry so React doesn't warn about unhandled promises.
        resolveRetry({ data: sampleQr });
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(3);
        });
    });

    it('clicking Reject restores the lookup form with cleared nim and error (Req 3.4)', async () => {
        api.post.mockResolvedValueOnce({ data: sampleProfile });

        render(<Page />);
        fillNimAndSubmit('20210001');

        const reject = await screen.findByRole('button', {
            name: /bukan saya|ganti NIM/i,
        });
        fireEvent.click(reject);

        // Back at Lookup_Form_View with an empty NIM input.
        const input = await screen.findByLabelText(/NIM Mahasiswa/i);
        expect(input).toHaveValue('');

        // Confirmation surface is gone.
        expect(screen.queryByText('Profil Ditemukan')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /buat QR/i }),
        ).not.toBeInTheDocument();

        // No error is carried over from the previous flow.
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('on lookup with has_qr=true, the page renders the AlreadyHasQrView blocking screen instead of confirmation (one-time-rule)', async () => {
        api.post.mockResolvedValueOnce({
            data: { ...sampleProfile, has_qr: true },
        });

        render(<Page />);
        fillNimAndSubmit('20210001');

        // Blocking view fingerprints.
        expect(await screen.findByText(/QR Sudah Aktif/i)).toBeInTheDocument();
        expect(
            screen.getByText(/hanya bisa dibuat satu kali/i),
        ).toBeInTheDocument();

        // Profile is preserved on the blocking screen.
        expect(screen.getByText(sampleProfile.nama)).toBeInTheDocument();

        // Confirmation surface and Confirm button must NOT mount.
        expect(screen.queryByText('Profil Ditemukan')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /buat QR/i }),
        ).not.toBeInTheDocument();
    });

    it('on /generate-qr 409, the page transitions to AlreadyHasQrView with the server message surfaced', async () => {
        // Lookup says no QR yet, so we enter confirm normally.
        api.post.mockResolvedValueOnce({
            data: { ...sampleProfile, has_qr: false },
        });
        // Then generate-qr returns 409 — server says QR already exists.
        api.post.mockRejectedValueOnce({
            response: {
                status: 409,
                data: { message: 'QR untuk NIM ini sudah pernah dibuat.' },
            },
        });

        render(<Page />);
        fillNimAndSubmit();

        const confirm = await screen.findByRole('button', { name: /buat QR/i });
        fireEvent.click(confirm);

        // We should land on the blocking screen, NOT the QR display nor a
        // retryable confirmation error.
        expect(await screen.findByText(/QR Sudah Aktif/i)).toBeInTheDocument();

        // Server-supplied message is visible as an alert.
        const alerts = await screen.findAllByRole('alert');
        const matched = alerts.find((el) =>
            /QR untuk NIM ini sudah pernah dibuat/i.test(el.textContent ?? ''),
        );
        expect(matched).toBeTruthy();

        // Confirm button is gone (we left CONFIRM).
        expect(
            screen.queryByRole('button', { name: /buat QR/i }),
        ).not.toBeInTheDocument();
        // QR display view must NOT mount on 409.
        expect(screen.queryByText(/Aktif & Permanen/i)).not.toBeInTheDocument();
    });

    it('after a successful first-time generate, the one-time warning dialog renders and acknowledging it dismisses the dialog while preserving the QR display', async () => {
        api.post.mockResolvedValueOnce({
            data: { ...sampleProfile, has_qr: false },
        });
        api.post.mockResolvedValueOnce({ data: sampleQr });

        render(<Page />);
        fillNimAndSubmit();

        const confirm = await screen.findByRole('button', { name: /buat QR/i });
        fireEvent.click(confirm);

        // QR display rendered.
        expect(
            await screen.findByText(/Aktif & Permanen/i),
        ).toBeInTheDocument();

        // One-time warning dialog must mount alongside the QR display.
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent(/QR hanya bisa dibuat sekali/i);

        // Acknowledge button dismisses the dialog without leaving the QR view.
        const acknowledge = within(dialog).getByRole('button', {
            name: /Saya Mengerti/i,
        });
        fireEvent.click(acknowledge);

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        // QR view still rendered after acknowledging.
        expect(screen.getByText(/Aktif & Permanen/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Unduh PNG/i }),
        ).toBeInTheDocument();
    });

    it('rendered tree includes the PublicShell wrapper (Req 6.4)', () => {
        render(<Page />);

        const shell = screen.getByTestId('public-shell');
        expect(shell).toBeInTheDocument();

        // The lookup form (initial view) is rendered *inside* the shell.
        const input = screen.getByLabelText(/NIM Mahasiswa/i);
        expect(shell).toContainElement(input);
    });
});

/**
 * Validates: Requirement 6.5
 *
 * If `PublicShell` resolves to undefined at render time, `Page` must
 * short-circuit and render nothing — including no Profile_Confirmation_View
 * markers like "Profil Ditemukan".
 *
 * We use vi.resetModules + vi.doMock + dynamic import so the file-level
 * vi.mock for `@/layouts/PublicShell` is overridden for this single test.
 */
describe('Page — PublicShell unavailability guard (Req 6.5)', () => {
    afterEach(() => {
        vi.doUnmock('@/layouts/PublicShell');
        vi.resetModules();
    });

    it('renders nothing and "Profil Ditemukan" is absent', async () => {
        vi.resetModules();
        vi.doMock('@/layouts/PublicShell', () => ({ PublicShell: undefined }));
        // Re-declare sibling mocks for the freshly imported module graph.
        vi.doMock('@inertiajs/react', () => ({ Head: () => null }));
        vi.doMock('@/lib/api', () => ({ api: { post: vi.fn() } }));
        vi.doMock('@/lib/toast', () => ({
            toast: { error: vi.fn(), success: vi.fn() },
        }));

        const { default: PageNoShell } = await import('./Page');

        const { container } = render(<PageNoShell />);

        // Page returned null — the RTL container has no rendered children.
        expect(container.firstChild).toBeNull();

        // None of the confirmation surface leaks through.
        expect(screen.queryByText('Profil Ditemukan')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { level: 2 }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText(/NIM Mahasiswa/i),
        ).not.toBeInTheDocument();

        cleanup();
    });
});
