/**
 * Public QR page state machine — pure reducer.
 *
 * Implements the deterministic, side-effect-free state transitions for the
 * Public_QR_Page (`Page.jsx`). The reducer is the unit under test for
 * Properties 1–6 in the design; it performs no I/O and only computes the
 * next state given the current state and an action.
 *
 * View contract (extended for the one-time QR rule):
 *   - LOOKUP            : initial NIM input
 *   - CONFIRM           : profile matched, QR not yet generated
 *   - QR                : QR has just been generated in this session
 *   - ALREADY_HAS_QR    : profile matched but lookup returned has_qr=true,
 *                        OR /generate-qr returned 409 — the public flow is
 *                        blocked, the user is told to contact admin.
 *
 * Action shapes:
 *   { type: 'NIM_CHANGED',         value: string }
 *   { type: 'LOOKUP_REQUEST'  }
 *   { type: 'LOOKUP_SUCCESS',      profile: Profile, hasQr?: boolean }
 *   { type: 'LOOKUP_FAILURE',      message: string }
 *   { type: 'GENERATE_REQUEST' }
 *   { type: 'GENERATE_SUCCESS',    qrToken: string }
 *   { type: 'GENERATE_FAILURE',    message: string }
 *   { type: 'GENERATE_BLOCKED',    message: string }   // 409 from /generate-qr
 *   { type: 'ACKNOWLEDGE_ONE_TIME' }                   // dismiss the one-time popup
 *   { type: 'REJECT' }
 *   { type: 'RESET' }
 */

/** View state identifiers. */
export const VIEW = Object.freeze({
    LOOKUP: 'lookup',
    CONFIRM: 'confirm',
    QR: 'qr',
    ALREADY_HAS_QR: 'already_has_qr',
});

/**
 * Canonical initial state for the page.
 *
 * Reachable-state invariants:
 *   view==='confirm'          ⇒ profile !== null
 *   view==='qr'               ⇒ profile !== null && qrToken !== null
 *   view==='already_has_qr'   ⇒ profile !== null
 *   view==='lookup'           ⇒ qrToken === null
 *   loading.lookup and loading.generate are never both true.
 *   showOneTimeWarning===true ⇒ view==='qr'
 */
export const initialState = Object.freeze({
    view: VIEW.LOOKUP,
    nim: '',
    profile: null,
    qrToken: null,
    error: null,
    loading: Object.freeze({ lookup: false, generate: false }),
    /**
     * Set to true once on the LOOKUP→QR transition (a fresh GENERATE_SUCCESS).
     * The page renders a one-time popup gated on this flag; the user must
     * click acknowledge to clear it. ACKNOWLEDGE_ONE_TIME flips it back to
     * false, leaving the QR view intact.
     */
    showOneTimeWarning: false,
});

/**
 * Pure reducer for the Public_QR_Page state machine.
 *
 * @param {object} state  Current state, shaped like {@link initialState}.
 * @param {object} action Action object with a `type` discriminator.
 * @returns {object} Next state. Returns the input `state` unchanged for
 *                   unknown action types so the caller is robust to
 *                   forward-compatibility shims.
 */
export function reducer(state, action) {
    switch (action.type) {
        case 'NIM_CHANGED':
            // Typing a new NIM invalidates any previously looked-up profile,
            // any cached qrToken, and any prior error. View stays at lookup.
            if (state.view !== VIEW.LOOKUP) {
                return state;
            }
            return {
                ...state,
                nim: action.value,
                profile: null,
                qrToken: null,
                error: null,
            };

        case 'LOOKUP_REQUEST':
            if (state.view !== VIEW.LOOKUP) {
                return state;
            }
            return {
                ...state,
                error: null,
                loading: { ...state.loading, lookup: true },
            };

        case 'LOOKUP_SUCCESS':
            // Branch on `hasQr`: if the backend reports the profile already
            // has a QR token, the public flow is blocked and we go straight
            // to ALREADY_HAS_QR. Otherwise we enter CONFIRM as before.
            if (state.view !== VIEW.LOOKUP) {
                return state;
            }
            return {
                ...state,
                view: action.hasQr ? VIEW.ALREADY_HAS_QR : VIEW.CONFIRM,
                profile: action.profile,
                qrToken: null,
                error: null,
                loading: { ...state.loading, lookup: false },
            };

        case 'LOOKUP_FAILURE':
            if (state.view !== VIEW.LOOKUP) {
                return state;
            }
            return {
                ...state,
                profile: null,
                error: action.message,
                loading: { ...state.loading, lookup: false },
            };

        case 'GENERATE_REQUEST':
            if (state.view !== VIEW.CONFIRM) {
                return state;
            }
            return {
                ...state,
                error: null,
                loading: { ...state.loading, generate: true },
            };

        case 'GENERATE_SUCCESS':
            // QR ready: transition to qr view and arm the one-time warning
            // popup. The popup is the user's mandatory acknowledgement that
            // the QR will not be regenerable from the portal.
            if (state.view !== VIEW.CONFIRM) {
                return state;
            }
            return {
                ...state,
                view: VIEW.QR,
                qrToken: action.qrToken,
                error: null,
                loading: { ...state.loading, generate: false },
                showOneTimeWarning: true,
            };

        case 'GENERATE_FAILURE':
            if (state.view !== VIEW.CONFIRM) {
                return state;
            }
            return {
                ...state,
                error: action.message,
                loading: { ...state.loading, generate: false },
            };

        case 'GENERATE_BLOCKED':
            // Server reported QR already exists (409). Switch to the
            // already-has-QR blocking view; profile is preserved so we
            // can still render the matched identity. Loading clears.
            if (state.view !== VIEW.CONFIRM) {
                return state;
            }
            return {
                ...state,
                view: VIEW.ALREADY_HAS_QR,
                error: action.message ?? null,
                loading: { ...state.loading, generate: false },
                qrToken: null,
            };

        case 'ACKNOWLEDGE_ONE_TIME':
            // Clear the one-time popup flag without leaving the qr view.
            // Idempotent: harmless if popup is already dismissed.
            return {
                ...state,
                showOneTimeWarning: false,
            };

        case 'REJECT':
            // User rejected the matched profile or chose to leave the
            // already-has-qr screen: scrub identity-bearing fields and
            // return to lookup.
            return {
                ...state,
                view: VIEW.LOOKUP,
                profile: null,
                nim: '',
                error: null,
                qrToken: null,
                showOneTimeWarning: false,
            };

        case 'RESET':
            // Full reset to a fresh page state.
            return {
                view: VIEW.LOOKUP,
                nim: '',
                profile: null,
                qrToken: null,
                error: null,
                loading: { lookup: false, generate: false },
                showOneTimeWarning: false,
            };

        default:
            return state;
    }
}

/**
 * Selector: true when the page is in Profile_Confirmation_View.
 *
 * @param {object} state Current page state.
 * @returns {boolean}
 */
export const selectIsConfirming = (state) => state.view === VIEW.CONFIRM;
