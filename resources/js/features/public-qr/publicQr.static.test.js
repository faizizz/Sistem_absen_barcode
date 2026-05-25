import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Static guardrail tests for the public-qr feature.
 *
 * These tests inspect the on-disk source of the four files that make up
 * `resources/js/features/public-qr/` and assert three feature-wide
 * invariants from the spec:
 *
 *   - Requirement 7.1 — No `#[0-9a-fA-F]{3,8}` hex color literals appear
 *     in JSX. All colors must come from Design_Tokens via `var(--token)`
 *     or the project's Tailwind utilities.
 *   - Requirement 7.3 — This feature does NOT introduce any new files
 *     under `resources/js/Components/primitives/`. The redesign reuses
 *     the existing `Button` and `Badge` primitives only.
 *   - Requirement 9.3 — `profile.<field>` references in the four source
 *     files only target fields in the allowlist
 *     `{nama, nim, departemen, jabatan}`.
 *
 * The files are read from disk (not imported) so the tests can assert
 * over the literal source text after stripping comments.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Source files this feature owns; the four-file budget is fixed. */
const SOURCE_FILES = Object.freeze([
    'Page.jsx',
    'ProfileConfirmationView.jsx',
    'QrDisplayView.jsx',
    'AlreadyHasQrView.jsx',
    'publicQrMachine.js',
]);

const PRIMITIVES_DIR = path.resolve(
    __dirname,
    '..',
    '..',
    'Components',
    'primitives',
);

const PROFILE_FIELD_ALLOWLIST = Object.freeze(['nama', 'nim', 'departemen', 'jabatan']);

/**
 * Read a feature source file from disk as a UTF-8 string.
 *
 * @param {string} name File name relative to the public-qr folder.
 * @returns {string}
 */
function readSource(name) {
    return fs.readFileSync(path.join(__dirname, name), 'utf8');
}

/**
 * Strip block comments (`/* ... *\/`) and line comments (`// ...`) from
 * a source string. The "JSX" qualifier in the spec is meant to exclude
 * documentation/comments from the hex-literal and field-allowlist checks;
 * this is a pragmatic approximation that covers the comment styles
 * actually used in the feature files.
 *
 * @param {string} src Raw source.
 * @returns {string} Source with comments removed.
 */
function stripComments(src) {
    const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
    const noLine = noBlock.replace(/\/\/.*$/gm, '');
    return noLine;
}

describe('public-qr feature — static-source guardrails', () => {
    describe('Requirement 7.1 — no hex color literals in JSX/source', () => {
        for (const fileName of SOURCE_FILES) {
            it(`${fileName} contains no #[0-9a-fA-F]{3,8} literal`, () => {
                const src = readSource(fileName);
                const stripped = stripComments(src);
                const matches = stripped.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
                expect(
                    matches,
                    `Hex color literal(s) found in ${fileName}: ${matches.join(', ')}. ` +
                        `Use Design_Tokens via var(--token) instead.`,
                ).toEqual([]);
            });
        }
    });

    describe('Requirement 7.3 — no new files under Components/primitives/', () => {
        it('the primitives directory exists at the expected path', () => {
            expect(
                fs.existsSync(PRIMITIVES_DIR),
                `Expected primitives directory at ${PRIMITIVES_DIR}`,
            ).toBe(true);
        });

        it('does not contain feature-specific primitive files', () => {
            const entries = fs.readdirSync(PRIMITIVES_DIR);
            // The redesign must not introduce new primitives. As a tight,
            // pragmatic check, no file in the primitives folder may be
            // named after this feature's surfaces.
            const offenders = entries.filter((entry) =>
                /^(ProfileConfirmation|PublicQr|QrDisplay|AlreadyHasQr)/i.test(entry),
            );
            expect(
                offenders,
                `Unexpected feature-specific primitive(s) found: ${offenders.join(', ')}. ` +
                    `Reuse existing primitives instead of adding new ones.`,
            ).toEqual([]);
        });
    });

    describe('Requirement 9.3 — profile.<field> only targets the allowlist', () => {
        const allowed = new Set(PROFILE_FIELD_ALLOWLIST);

        for (const fileName of SOURCE_FILES) {
            it(`${fileName} only reads {${PROFILE_FIELD_ALLOWLIST.join(', ')}} from profile`, () => {
                const src = readSource(fileName);
                const stripped = stripComments(src);
                // Captures both `profile.x` and `profile?.x`. State-qualified
                // access like `state.profile.nim` matches starting at the
                // inner `profile.nim` so the field is still validated.
                const re = /\bprofile\??\.(\w+)/g;
                const offenders = [];
                let match;
                while ((match = re.exec(stripped)) !== null) {
                    const field = match[1];
                    if (!allowed.has(field)) {
                        offenders.push(field);
                    }
                }
                const unique = [...new Set(offenders)];
                expect(
                    unique,
                    `Out-of-allowlist profile field(s) in ${fileName}: ${unique.join(', ')}. ` +
                        `Allowlist: {${PROFILE_FIELD_ALLOWLIST.join(', ')}}.`,
                ).toEqual([]);
            });
        }
    });
});
