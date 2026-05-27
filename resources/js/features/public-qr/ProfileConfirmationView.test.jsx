import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProfileConfirmationView } from './ProfileConfirmationView';

/**
 * Example tests for ProfileConfirmationView identity rendering and
 * Bahasa Indonesia copy.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 7.3
 *
 * @see .kiro/specs/public-qr-profile-confirmation/design.md
 */

const sampleProfile = {
    nama: 'Budi Santoso',
    nim: '20210001',
    departemen: 'Teknik Informatika',
    jabatan: 'Anggota',
};

function renderView(overrides = {}) {
    const props = {
        profile: sampleProfile,
        loading: false,
        error: null,
        onConfirm: () => {},
        onReject: () => {},
        ...overrides,
    };
    return render(<ProfileConfirmationView {...props} />);
}

describe('ProfileConfirmationView — identity rendering and Bahasa Indonesia copy', () => {
    it('renders profile.nama in a level-2 heading with text-3xl class (Req 2.1)', () => {
        renderView();

        const heading = screen.getByRole('heading', { level: 2 });

        expect(heading).toHaveTextContent('Budi Santoso');
        expect(heading).toHaveClass('text-3xl');
    });

    it('renders "NIM <profile.nim>" directly below the heading inside the gradient header (Req 2.2)', () => {
        renderView();

        const heading = screen.getByRole('heading', { level: 2 });
        const identityBlock = heading.parentElement;
        const nimLine = identityBlock.querySelector('p');

        expect(nimLine).toHaveTextContent('NIM 20210001');
        expect(heading.parentElement).toBe(nimLine.parentElement);
    });

    it('renders departemen and jabatan as plain bold text inside compact detail rows (Reqs 2.3, 7.3)', () => {
        renderView();

        const departemen = screen.getByText('Teknik Informatika');
        const jabatan = screen.getByText('Anggota');

        expect(departemen).toBeInTheDocument();
        expect(jabatan).toBeInTheDocument();
        // Values render as plain bold paragraphs — no pill background —
        // so long department names flow naturally without awkward bg artifacts.
        expect(departemen.tagName).toBe('P');
        expect(jabatan.tagName).toBe('P');
        expect(departemen).toHaveClass('font-semibold');
        expect(jabatan).toHaveClass('font-semibold');
        expect(departemen).toHaveClass('text-base');
        expect(jabatan).toHaveClass('text-base');
        expect(screen.getByText('Departemen')).toBeInTheDocument();
        expect(screen.getByText('Jabatan')).toBeInTheDocument();
    });

    it('renders the "Profil Ditemukan" status badge as a rounded pill in the gradient header (Req 2.4)', () => {
        renderView();

        const status = screen.getByText('Profil Ditemukan');

        expect(status).toBeInTheDocument();
        // In the redesigned gradient header the status pill carries
        // white-on-translucent styling rather than the success-* tokens,
        // but it remains a rounded pill labelled "Profil Ditemukan" with
        // a verification glyph — the contract for Req 2.4.
        expect(status).toHaveClass('rounded-full');
        expect(status.querySelector('svg')).toBeInTheDocument();
    });

    it('matches snapshot of visible Bahasa Indonesia copy (Req 2.5)', () => {
        const { container } = renderView();

        // textContent concatenates inline text across elements without
        // whitespace between siblings, so the snapshot reflects that.
        // Normalize internal whitespace runs to a single space so the
        // snapshot is stable across formatters.
        const visibleCopy = container.textContent.replace(/\s+/g, ' ').trim();

        expect(visibleCopy).toMatchInlineSnapshot(
            `"Profil DitemukanBudi SantosoNIM 20210001Pastikan data ini benar sebelum membuat QR permanen.DepartemenTeknik InformatikaJabatanAnggotaBuat QR Code SayaBukan saya, ganti NIM"`,
        );

        // Also assert each Bahasa Indonesia string appears verbatim, so a
        // future regression that changes copy fails with a clearer message
        // than the snapshot diff alone.
        expect(visibleCopy).toContain('Profil Ditemukan');
        expect(visibleCopy).toContain('Budi Santoso');
        expect(visibleCopy).toContain('NIM 20210001');
        expect(visibleCopy).toContain('Pastikan data ini benar sebelum membuat QR permanen.');
        expect(visibleCopy).toContain('Teknik Informatika');
        expect(visibleCopy).toContain('Anggota');
        expect(visibleCopy).toContain('Buat QR Code Saya');
        expect(visibleCopy).toContain('Bukan saya, ganti NIM');
    });
});

/**
 * Example tests for ProfileConfirmationView accessibility.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 *
 * @see .kiro/specs/public-qr-profile-confirmation/design.md
 */
describe('ProfileConfirmationView — accessibility', () => {
    it('exposes profile.nama via a level-2 heading (Req 8.1)', () => {
        renderView();

        const heading = screen.getByRole('heading', { level: 2 });

        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent(sampleProfile.nama);
    });

    it('Confirm button accessible name matches /buat QR/i (Req 8.2)', () => {
        renderView();

        const confirm = screen.getByRole('button', { name: /buat QR/i });

        expect(confirm).toBeInTheDocument();
    });

    it('Reject button accessible name matches /bukan saya|ganti NIM/i (Req 8.3)', () => {
        renderView();

        const reject = screen.getByRole('button', {
            name: /bukan saya|ganti NIM/i,
        });

        expect(reject).toBeInTheDocument();
    });

    it('moves keyboard focus to the heading or Confirm button on mount (Req 8.4)', () => {
        renderView();

        const heading = screen.getByRole('heading', { level: 2 });
        const confirm = screen.getByRole('button', { name: /buat QR/i });

        // Per Requirement 8.4, focus is acceptable on either the heading
        // (containing the user's nama) or the Confirm_Action.
        expect([heading, confirm]).toContain(document.activeElement);
    });
});

/**
 * Example tests for ProfileConfirmationView loading and error states,
 * DOM order, primary variant signature, and click handlers.
 *
 * Validates: Requirements 3.1, 3.3, 3.5, 4.1, 4.2, 5.3
 *
 * @see .kiro/specs/public-qr-profile-confirmation/design.md
 */
describe('ProfileConfirmationView — loading, error, order, and click handlers', () => {
    it('disables Confirm and shows the loader icon when loading=true (Reqs 4.1, 3.5)', () => {
        renderView({ loading: true });

        const confirm = screen.getByRole('button', { name: /buat QR/i });

        expect(confirm).toBeDisabled();
        // The Button primitive renders a Loader2 spinner (an <svg>) when
        // loading=true. Asserting the presence of an svg child is a stable
        // fingerprint without coupling to lucide's internal class names.
        expect(confirm.querySelector('svg')).toBeInTheDocument();
    });

    it('disables Reject when loading=true (Req 4.2)', () => {
        renderView({ loading: true });

        const reject = screen.getByRole('button', {
            name: /bukan saya|ganti NIM/i,
        });

        expect(reject).toBeDisabled();
    });

    it('renders a role="alert" element with the error text when error is non-null (Req 5.3)', () => {
        const message = 'Gagal membuat QR. Coba lagi.';
        renderView({ error: message });

        const alert = screen.getByRole('alert');

        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(message);
    });

    it('places Confirm before Reject in DOM order with primary variant signature (Reqs 3.1, 3.5)', () => {
        renderView();

        const buttons = screen.getAllByRole('button');
        const confirm = screen.getByRole('button', { name: /buat QR/i });
        const reject = screen.getByRole('button', {
            name: /bukan saya|ganti NIM/i,
        });

        const confirmIndex = buttons.indexOf(confirm);
        const rejectIndex = buttons.indexOf(reject);

        expect(confirmIndex).toBeGreaterThanOrEqual(0);
        expect(rejectIndex).toBeGreaterThanOrEqual(0);
        expect(confirmIndex).toBeLessThan(rejectIndex);

        // The Button primitive's primary variant maps to the Meta
        // ink-button token. Asserting that fingerprint confirms
        // variant="primary" without coupling to every utility.
        expect(confirm).toHaveClass('bg-[color:var(--ink-button)]');
        // And Reject (variant="ghost") should NOT carry the primary
        // signature, keeping it visually subordinate (Req 3.3).
        expect(reject).not.toHaveClass('bg-[color:var(--ink-button)]');
    });

    it('invokes onConfirm exactly once when Confirm is clicked (Req 3.1)', () => {
        const onConfirm = vi.fn();
        const onReject = vi.fn();
        renderView({ onConfirm, onReject });

        const confirm = screen.getByRole('button', { name: /buat QR/i });
        fireEvent.click(confirm);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onReject).not.toHaveBeenCalled();
    });

    it('invokes onReject exactly once when Reject is clicked (Req 3.3)', () => {
        const onConfirm = vi.fn();
        const onReject = vi.fn();
        renderView({ onConfirm, onReject });

        const reject = screen.getByRole('button', {
            name: /bukan saya|ganti NIM/i,
        });
        fireEvent.click(reject);

        expect(onReject).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});

/**
 * Example tests for ProfileConfirmationView mobile-first layout, button
 * sizing, and theme byte-identity.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 7.1, 7.2
 *
 * @see .kiro/specs/public-qr-profile-confirmation/design.md
 */
describe('ProfileConfirmationView — mobile-first layout and styling', () => {
    it('action container stacks vertically on mobile and switches to row on sm+ (Reqs 6.1, 7.1)', () => {
        renderView();

        const confirm = screen.getByRole('button', { name: /buat QR/i });
        // The Confirm button's parent is the action row container, which
        // owns the responsive layout utilities.
        const actionContainer = confirm.parentElement;

        expect(actionContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });

    it('Confirm button carries w-full sm:flex-1 and size="lg" (h-12) (Reqs 6.2, 6.3)', () => {
        renderView();

        const confirm = screen.getByRole('button', { name: /buat QR/i });

        // Full-width on mobile, then expands to own the action row from sm and up.
        expect(confirm).toHaveClass('w-full', 'sm:flex-1');
        // The Button primitive maps size="lg" to a token-class containing
        // h-12, satisfying the ≥ 44 CSS px touch-target requirement.
        expect(confirm).toHaveClass('h-12');
    });

    it('produces byte-identical markup under data-theme="light" and data-theme="dark" (Req 7.2)', () => {
        // Theming is delivered via CSS custom properties bound to
        // [data-theme="..."] selectors on the document root, so the JSX
        // must produce the exact same markup regardless of theme.
        const root = document.documentElement;
        const previousTheme = root.dataset.theme;

        try {
            root.dataset.theme = 'light';
            const { container: lightContainer } = renderView();
            const lightHtml = lightContainer.innerHTML;
            cleanup();

            root.dataset.theme = 'dark';
            const { container: darkContainer } = renderView();
            const darkHtml = darkContainer.innerHTML;

            expect(darkHtml).toBe(lightHtml);
        } finally {
            if (previousTheme === undefined) {
                delete root.dataset.theme;
            } else {
                root.dataset.theme = previousTheme;
            }
        }
    });
});
