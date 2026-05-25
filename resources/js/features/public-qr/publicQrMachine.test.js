import fc from 'fast-check';
import { reducer, initialState, VIEW } from './publicQrMachine.js';

/**
 * Generator for an arbitrary {@link Profile}.
 *
 * Per design.md (Data Models > Profile), a Profile has exactly the fields
 * `nama`, `nim`, `departemen`, `jabatan`, all strings.
 */
const profileArb = fc.record({
    nama: fc.string(),
    nim: fc.string(),
    departemen: fc.string(),
    jabatan: fc.string(),
});

const postSuccessActionArb = fc.oneof(
    fc.constant({ type: 'GENERATE_REQUEST' }),
    fc.record({ type: fc.constant('GENERATE_FAILURE'), message: fc.string() }),
);

const postSuccessTailArb = fc.array(postSuccessActionArb);

/**
 * Generator for any reachable Profile_Confirmation_View state.
 */
const confirmStateArb = fc.record({
    view: fc.constant(VIEW.CONFIRM),
    nim: fc.string(),
    profile: profileArb,
    qrToken: fc.constant(null),
    error: fc.option(fc.string(), { nil: null }),
    loading: fc.record({
        lookup: fc.constant(false),
        generate: fc.boolean(),
    }),
    showOneTimeWarning: fc.constant(false),
});

describe('publicQrMachine reducer', () => {
    /**
     * Property 1: Lookup success without an existing QR enters confirmation
     * and preserves the profile.
     *
     * Validates: Requirements 1.1, 1.4
     */
    it('LOOKUP_SUCCESS (hasQr=false) enters confirm view and preserves profile across the action tail', () => {
        fc.assert(
            fc.property(profileArb, postSuccessTailArb, (profile, tail) => {
                const afterSuccess = reducer(initialState, {
                    type: 'LOOKUP_SUCCESS',
                    profile,
                    hasQr: false,
                });

                expect(afterSuccess.view).toBe(VIEW.CONFIRM);
                expect(afterSuccess.profile).toEqual(profile);

                let state = afterSuccess;
                for (const action of tail) {
                    state = reducer(state, action);
                    expect(state.view).toBe(VIEW.CONFIRM);
                    expect(state.profile).toEqual(profile);
                }
            }),
            { numRuns: 100 },
        );
    });

    /**
     * Property 1b: LOOKUP_SUCCESS with hasQr=true short-circuits to the
     * already-has-QR view instead of going through confirmation. The user
     * is blocked from regenerating their QR via the public flow.
     */
    it('LOOKUP_SUCCESS (hasQr=true) routes to already_has_qr view with profile preserved', () => {
        fc.assert(
            fc.property(profileArb, (profile) => {
                const next = reducer(initialState, {
                    type: 'LOOKUP_SUCCESS',
                    profile,
                    hasQr: true,
                });

                expect(next.view).toBe(VIEW.ALREADY_HAS_QR);
                expect(next.profile).toEqual(profile);
                expect(next.qrToken).toBe(null);
                expect(next.error).toBe(null);
            }),
            { numRuns: 50 },
        );
    });

    /**
     * Property 2: Reject from confirmation resets the page.
     *
     * Validates: Requirements 3.4
     */
    it('REJECT from confirm resets profile, nim, error, qrToken, and view', () => {
        fc.assert(
            fc.property(confirmStateArb, (confirmState) => {
                const next = reducer(confirmState, { type: 'REJECT' });

                expect(next.view).toBe(VIEW.LOOKUP);
                expect(next.profile).toBe(null);
                expect(next.nim).toBe('');
                expect(next.error).toBe(null);
                expect(next.qrToken).toBe(null);
            }),
            { numRuns: 100 },
        );
    });

    /**
     * Property 3: Generate request clears errors, marks loading, and stays in confirmation.
     *
     * Validates: Requirements 4.1, 5.4
     */
    it('GENERATE_REQUEST clears error, sets loading.generate, preserves profile, and stays in confirm', () => {
        fc.assert(
            fc.property(confirmStateArb, (confirmState) => {
                const next = reducer(confirmState, { type: 'GENERATE_REQUEST' });

                expect(next.view).toBe(VIEW.CONFIRM);
                expect(next.loading.generate).toBe(true);
                expect(next.error).toBe(null);
                expect(next.profile).toEqual(confirmState.profile);
            }),
            { numRuns: 100 },
        );
    });

    /**
     * Property 4: Generate failure stays in confirmation and surfaces the message.
     *
     * Validates: Requirements 5.1, 5.2, 5.3
     */
    it('GENERATE_FAILURE stays in confirm, preserves profile, stores message, and clears loading.generate', () => {
        fc.assert(
            fc.property(confirmStateArb, fc.string(), (confirmState, message) => {
                const next = reducer(confirmState, {
                    type: 'GENERATE_FAILURE',
                    message,
                });

                expect(next.view).toBe(VIEW.CONFIRM);
                expect(next.profile).toEqual(confirmState.profile);
                expect(next.error).toBe(message);
                expect(next.loading.generate).toBe(false);
            }),
            { numRuns: 100 },
        );
    });

    /**
     * Property 4b: GENERATE_BLOCKED (server returned 409) routes to the
     * already-has-QR view, preserves profile, surfaces message, and clears
     * loading. This is the path triggered when the user attempts to
     * generate but the server says a QR already exists.
     */
    it('GENERATE_BLOCKED routes to already_has_qr, preserves profile, stores message, clears loading', () => {
        fc.assert(
            fc.property(confirmStateArb, fc.string(), (confirmState, message) => {
                const next = reducer(confirmState, {
                    type: 'GENERATE_BLOCKED',
                    message,
                });

                expect(next.view).toBe(VIEW.ALREADY_HAS_QR);
                expect(next.profile).toEqual(confirmState.profile);
                expect(next.error).toBe(message);
                expect(next.loading.generate).toBe(false);
                expect(next.qrToken).toBe(null);
            }),
            { numRuns: 100 },
        );
    });

    /**
     * Property 5: Generate success transitions to QR display and arms the
     * one-time warning popup.
     *
     * Validates: Requirements 4.3 + one-time-rule policy
     */
    it('GENERATE_SUCCESS transitions to qr view, stores token, preserves profile, clears loading and error, arms one-time warning', () => {
        fc.assert(
            fc.property(confirmStateArb, fc.string(), (confirmState, token) => {
                const next = reducer(confirmState, {
                    type: 'GENERATE_SUCCESS',
                    qrToken: token,
                });

                expect(next.view).toBe(VIEW.QR);
                expect(next.qrToken).toBe(token);
                expect(next.profile).toEqual(confirmState.profile);
                expect(next.loading.generate).toBe(false);
                expect(next.error).toBe(null);
                expect(next.showOneTimeWarning).toBe(true);
            }),
            { numRuns: 100 },
        );
    });

    /**
     * Property 5b: ACKNOWLEDGE_ONE_TIME clears the warning flag without
     * leaving the qr view. Idempotent: applying it twice has the same
     * outcome as once.
     */
    it('ACKNOWLEDGE_ONE_TIME clears showOneTimeWarning while preserving the qr view', () => {
        fc.assert(
            fc.property(profileArb, fc.string(), (profile, token) => {
                let state = reducer(initialState, {
                    type: 'LOOKUP_SUCCESS',
                    profile,
                    hasQr: false,
                });
                state = reducer(state, { type: 'GENERATE_SUCCESS', qrToken: token });
                expect(state.showOneTimeWarning).toBe(true);
                expect(state.view).toBe(VIEW.QR);

                const acked = reducer(state, { type: 'ACKNOWLEDGE_ONE_TIME' });
                expect(acked.showOneTimeWarning).toBe(false);
                expect(acked.view).toBe(VIEW.QR);
                expect(acked.qrToken).toBe(token);
                expect(acked.profile).toEqual(profile);

                const ackedTwice = reducer(acked, { type: 'ACKNOWLEDGE_ONE_TIME' });
                expect(ackedTwice).toEqual(acked);
            }),
            { numRuns: 50 },
        );
    });

    /**
     * Property 6: Reachable-state invariants hold across any action sequence.
     */
    it('reachable-state invariants hold on initialState and across any action sequence', () => {
        const actionArb = fc.oneof(
            fc.record({ type: fc.constant('NIM_CHANGED'), value: fc.string() }),
            fc.constant({ type: 'LOOKUP_REQUEST' }),
            fc.record({
                type: fc.constant('LOOKUP_SUCCESS'),
                profile: profileArb,
                hasQr: fc.boolean(),
            }),
            fc.record({ type: fc.constant('LOOKUP_FAILURE'), message: fc.string() }),
            fc.constant({ type: 'GENERATE_REQUEST' }),
            fc.record({ type: fc.constant('GENERATE_SUCCESS'), qrToken: fc.string() }),
            fc.record({ type: fc.constant('GENERATE_FAILURE'), message: fc.string() }),
            fc.record({ type: fc.constant('GENERATE_BLOCKED'), message: fc.string() }),
            fc.constant({ type: 'ACKNOWLEDGE_ONE_TIME' }),
            fc.constant({ type: 'REJECT' }),
            fc.constant({ type: 'RESET' }),
        );

        const assertInvariants = (s) => {
            if (s.view === VIEW.CONFIRM) {
                expect(s.profile).not.toBe(null);
            }
            if (s.view === VIEW.QR) {
                expect(s.profile).not.toBe(null);
                expect(s.qrToken).not.toBe(null);
            }
            if (s.view === VIEW.ALREADY_HAS_QR) {
                expect(s.profile).not.toBe(null);
            }
            if (s.view === VIEW.LOOKUP) {
                expect(s.qrToken).toBe(null);
            }
            // showOneTimeWarning can only be true when in QR view.
            if (s.showOneTimeWarning) {
                expect(s.view).toBe(VIEW.QR);
            }
        };

        assertInvariants(initialState);

        fc.assert(
            fc.property(fc.array(actionArb), (actions) => {
                let state = initialState;
                for (const action of actions) {
                    state = reducer(state, action);
                    assertInvariants(state);
                }
            }),
            { numRuns: 100 },
        );
    });
});
