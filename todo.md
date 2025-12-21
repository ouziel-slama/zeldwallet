## ZeldWallet UI Web Component Plan

Goal: add a native web component (`zeld-wallet-ui` extending `HTMLElement`) that auto-connects to ZeldWallet and displays payment + ordinals addresses with i18n and overridable CSS classes prefixed with `zeldwallet-`. If a wallet exists but is password-protected, render a password input + “Connect” button to unlock; keep the flow silent only for passwordless wallets and clearly surface errors on bad passwords.

### File and API placement
- [x] Create `src/component/ZeldWalletUI.ts` (class extending `HTMLElement`, written in TypeScript).
- [x] Add a lightweight i18n helper in `src/component/i18n.ts` (string dictionaries + type-safe lookup).
- [x] Export the component and a `defineZeldWalletUI(tagName?: string)` helper from `src/index.ts`.
- [x] Optionally auto-define the element when running in a browser if `customElements` exists and the tag is unused.

### Behavior (MVP)
- [x] On `connectedCallback`, instantiate or reuse `ZeldWallet`:
  - [x] If a wallet exists, call `unlock()` without password; if it throws a password-required error, transition to a “locked” state with a password form.
  - [x] If not, call `create()` without password to keep the flow silent.
  - [x] Register the WBIP provider if not already registered (reuse icon/name defaults).
- [x] Fetch addresses via `getAddresses(['payment', 'ordinals'])` and render them when unlocked.
- [x] Locked path: render password input + “Connect” button; on submit, attempt `unlock(password)`; show inline error on failure and retryable state.
- [x] Expose observed attributes/properties for:
  - [x] `lang` (default `en`, fallback to English strings).
  - [x] `network` (`mainnet`/`testnet`), with a setter that calls `setNetwork` when unlocked.
  - [x] `autoconnect` flag (default true) to control the silent connect.
- [x] Handle states: loading, locked (with form), ready, error (render minimal user-friendly messages).

### Rendering and styling
- [x] Render a small card with two rows: payment and ordinals addresses, plus copy buttons (optional in MVP).
- [x] Use only CSS classes prefixed with `zeldwallet-`; document them:
  - [x] Container: `zeldwallet-card`
  - [x] Header: `zeldwallet-header`
  - [x] Row wrapper: `zeldwallet-row`
  - [x] Label: `zeldwallet-label`
  - [x] Value: `zeldwallet-value`
  - [x] Status messages: `zeldwallet-status`, `zeldwallet-status--error`, `zeldwallet-status--loading`
- [x] Password form classes: `zeldwallet-password-form`, `zeldwallet-password-input`, `zeldwallet-password-button`, `zeldwallet-password-error`.
- [x] Include minimal default styles in a `<style>` block inside the shadow root; allow style overrides via external CSS (no `!important`).

### i18n
- [x] Provide dictionaries for `en` and `fr` (at least): titles, labels, loading/error copy, password form strings (placeholder, button label, wrong password, locked state).
- [x] Runtime language selection via `lang` attribute/property; default to `en`, fallback chain `lang` -> `lang.split('-')[0]` -> `en`.
- [x] Expose a `setLocale(lang: string)` method for programmatic control.

### Build and examples
- [x] Wire component into the library build (ensure tree-shakeable import and working in ES/UMD outputs).
- [x]  add `examples/web-component.html` showing `<zeld-wallet-ui></zeld-wallet-ui>` usage with custom CSS overrides and `lang` switch.
- [x] Document CSS classes and props in `README.md` (new “Web Component” section), including password-flow classes and states.

### Testing
- [x] Add jsdom-based tests to cover:
  - [x] Element definition + connected lifecycle.
  - [x] Auto-create/unlock wallet and address rendering (mock storage to keep deterministic).
  - [x] i18n language switching.
  - [x] CSS class presence in the shadow DOM.
- [x] Add a smoke test that ensures `defineZeldWalletUI` is idempotent.

### Risks / considerations
- [x] Silent create/unlock must not break environments where a password-protected wallet already exists (surface a clear “locked” state with password form and errors).
- [x] Avoid leaking provider grants across page reloads; reuse existing WBIP registration when present.
- [x] Keep bundle size low; avoid new heavy deps for i18n.

