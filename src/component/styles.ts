export const componentStyles = `
  :host {
    display: block;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #0f172a;
  }
  .zeldwallet-card {
    position: relative;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }
  .zeldwallet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .zeldwallet-title-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .zeldwallet-title-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .zeldwallet-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }
  .zeldwallet-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .zeldwallet-inline-warning {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border-radius: 10px;
    background: transparent;
    border: none;
    box-shadow: none;
    color: #9f1239;
  }
  .zeldwallet-inline-warning-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .zeldwallet-inline-warning__badge {
    position: relative;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #b91c1c;
    cursor: help;
    animation: zeldwallet-soft-pulse 3s ease-in-out infinite;
  }
  .zeldwallet-inline-warning__badge:focus-visible {
    outline: 2px solid #ef4444;
    outline-offset: 2px;
  }
  .zeldwallet-inline-warning__tooltip {
    display: none;
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #b91c1c;
    color: #fff;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.2;
    min-width: 180px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(185, 28, 28, 0.2);
    z-index: 2;
  }
  .zeldwallet-inline-warning__badge:hover .zeldwallet-inline-warning__tooltip,
  .zeldwallet-inline-warning__badge:focus-visible .zeldwallet-inline-warning__tooltip {
    display: block;
  }
  .zeldwallet-warning-action {
    border-color: #cbd5e1;
    background: rgba(239, 68, 68, 0.22);
    color: #b91c1c;
    animation: zeldwallet-warning-button-pulse 2.4s ease-in-out infinite;
  }
  .zeldwallet-warning-icon {
    display: block;
  }
  .zeldwallet-warning-action:hover {
    border-color: #ef4444;
    background: #ffe4e6;
  }
  .zeldwallet-icon-button {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-weight: 700;
    line-height: 1;
  }
  .zeldwallet-icon-button:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .zeldwallet-warning {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    align-items: center;
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
    border-radius: 10px;
    padding: 8px 10px;
  }
  .zeldwallet-warning-icon {
    font-size: 16px;
    line-height: 1;
  }
  .zeldwallet-warning-title {
    font-weight: 700;
    font-size: 13px;
  }
  .zeldwallet-set-password-button {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: white;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 700;
  }
  .zeldwallet-set-password-form {
    display: grid;
    gap: 8px;
    margin: 8px 0 4px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }
  .zeldwallet-set-password-input {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
  }
  .zeldwallet-set-password-input,
  .zeldwallet-password-input,
  .zeldwallet-backup-input {
    padding-right: 42px;
  }
  .zeldwallet-password-field {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }
  .zeldwallet-password-field input {
    width: 100%;
    flex: 1;
  }
  .zeldwallet-password-field input:-webkit-autofill,
  .zeldwallet-password-field input:-webkit-autofill:hover,
  .zeldwallet-password-field input:-webkit-autofill:focus {
    box-shadow: 0 0 0 1000px #ffffff inset;
    -webkit-text-fill-color: #0f172a;
    caret-color: #0f172a;
    border: 1px solid #cbd5e1;
    outline: none;
    border-radius: 8px;
  }
  .zeldwallet-toggle-visibility {
    position: absolute;
    right: 10px;
    border: none;
    background: transparent;
    color: #475569;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 4px;
  }
  .zeldwallet-toggle-visibility:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 6px;
  }
  .zeldwallet-set-password-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .zeldwallet-set-password-cancel {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 700;
  }
  .zeldwallet-cancel-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 8px;
  }
  .zeldwallet-cancel-icon:hover {
    border-color: #ef4444;
    background: #fef2f2;
    color: #dc2626;
  }
  .zeldwallet-status {
    margin: 6px 0;
    font-size: 13px;
    color: #334155;
  }
  .zeldwallet-status--loading {
    color: #2563eb;
  }
  .zeldwallet-status--generating {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 28px 16px;
    color: #0f172a;
    font-weight: 600;
    font-size: 1.2em;
  }
  .zeldwallet-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e5e7eb;
    border-top-color: #22c55e;
    border-radius: 50%;
    animation: zeldwallet-spin 1s linear infinite;
  }
  :host(.dark-card) .zeldwallet-spinner {
    border-color: #2f2612;
    border-top-color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-status--generating {
    color: #f4e4a6;
  }
  @keyframes zeldwallet-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .zeldwallet-status--error {
    color: #b91c1c;
  }
  .zeldwallet-ready-block {
    position: relative;
    margin: 12px 0;
  }
  .zeldwallet-ready-block::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: #e5e7eb;
    transform: translateX(-50%);
  }
  .zeldwallet-status-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 8px 12px 6px;
  }
  .zeldwallet-status-row .zeldwallet-status {
    margin: 0;
  }
  /* Desktop: hide the titles row completely */
  .zeldwallet-status-row.zeldwallet-mobile-tabs {
    display: none;
  }
  .zeldwallet-rows {
    display: grid;
    gap: 10px;
  }
  .zeldwallet-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
  }
  .zeldwallet-row-left {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding-right: 12px;
  }
  .zeldwallet-row-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
  }
  .zeldwallet-balance-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 8px;
  }
  .zeldwallet-balance-btc {
    font-size: 24px;
    font-weight: 700;
    color: #f7931a;
  }
  .zeldwallet-balance-zeld {
    font-size: 24px;
    font-weight: 700;
    color: #8b5cf6;
  }
  .zeldwallet-balance-unit {
    font-size: 14px;
    font-weight: 600;
    opacity: 0.7;
    text-transform: uppercase;
    min-width: 36px;
    text-align: left;
  }
  .zeldwallet-balance-amount {
    text-align: right;
  }
  .zeldwallet-balance-loading {
    color: #94a3b8;
    font-size: 20px;
  }
  .zeldwallet-balance-updating {
    opacity: 0.6;
  }
  .zeldwallet-balance-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top-color: #f7931a;
    border-radius: 50%;
    animation: zeldwallet-spin 1s linear infinite;
  }
  .zeldwallet-footer {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .zeldwallet-footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .zeldwallet-wallet-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    color: #0f172a;
    padding: 4px 0;
    cursor: pointer;
    font-weight: 600;
  }
  .zeldwallet-wallet-toggle:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 6px;
  }
  .zeldwallet-wallet-chevron {
    display: inline-flex;
    width: 14px;
    height: 14px;
    color: #94a3b8;
    transition: transform 0.15s ease, color 0.15s ease;
  }
  .zeldwallet-wallet-chevron svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .zeldwallet-wallet-chevron--open {
    transform: rotate(180deg);
  }
  .zeldwallet-wallet-toggle:hover .zeldwallet-wallet-chevron {
    color: #1d4ed8;
  }
  .zeldwallet-wallet-picker {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }
  .zeldwallet-wallet-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
  }
  .zeldwallet-wallet-main {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .zeldwallet-wallet-icon img {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    object-fit: cover;
    background: #ffffff;
  }
  .zeldwallet-wallet-meta {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .zeldwallet-wallet-name {
    font-weight: 700;
    color: #0f172a;
  }
  .zeldwallet-wallet-desc {
    color: #475569;
    font-size: 12px;
    line-height: 1.4;
  }
  .zeldwallet-wallet-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .zeldwallet-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    background: #e2e8f0;
    color: #0f172a;
  }
  .zeldwallet-badge--installed {
    background: #dcfce7;
    color: #15803d;
  }
  .zeldwallet-install-link {
    border: 1px solid #2563eb;
    background: #eff6ff;
    color: #1d4ed8;
    text-decoration: none;
    padding: 7px 12px;
    border-radius: 8px;
    font-weight: 700;
  }
  .zeldwallet-install-link:hover {
    background: #dbeafe;
  }
  .zeldwallet-connect-wallet {
    padding: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .zeldwallet-connect-wallet .zeldwallet-btn-icon {
    width: 18px;
    height: 18px;
  }
  .zeldwallet-connect-wallet:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .zeldwallet-label {
    font-weight: 600;
    color: #0f172a;
  }
  .zeldwallet-label-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: help;
  }
  .zeldwallet-address-icon {
    display: block;
    color: #f7931a;
  }
  .zeldwallet-row:last-child .zeldwallet-address-icon {
    color: #8b5cf6;
  }
  .zeldwallet-value {
    font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .zeldwallet-value-with-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .zeldwallet-copy {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-weight: 700;
    line-height: 1;
  }
  .zeldwallet-copy:hover:not(:disabled) {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .zeldwallet-copy-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .zeldwallet-address-copy {
    border: none;
    background: transparent;
    padding: 0;
    color: #475569;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    width: 20px;
  }
  .zeldwallet-address-copy:hover:not(:disabled) {
    border: none;
    background: transparent;
    color: #0f172a;
  }
  .zeldwallet-copied {
    background: #dcfce7;
    border-color: #22c55e;
    color: #16a34a;
  }
  .zeldwallet-copied:hover:not(:disabled) {
    background: #bbf7d0;
    border-color: #16a34a;
    color: #15803d;
  }
  .zeldwallet-btn-icon {
    display: block;
    flex-shrink: 0;
  }
  .zeldwallet-copy:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .zeldwallet-password-form {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }
  .zeldwallet-password-fields {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }
  .zeldwallet-password-input {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
  }
  .zeldwallet-password-button {
    flex-shrink: 0;
  }
  .zeldwallet-password-error {
    color: #b91c1c;
    font-size: 13px;
  }
  .zeldwallet-backup-form {
    margin: 8px 0 0;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }
  .zeldwallet-restore-form {
    margin: 8px 0 0;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .zeldwallet-restore-textarea {
    width: 100%;
    max-width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
    color: #0f172a;
    resize: vertical;
    box-sizing: border-box;
    overflow-wrap: anywhere;
  }
  .zeldwallet-restore-textarea:focus {
    outline: none;
    border-color: #f5d900;
  }
  .zeldwallet-restore-password-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    font-size: 14px;
    color: #0f172a;
    padding-right: 44px;
    box-sizing: border-box;
  }
  .zeldwallet-restore-password-input:focus {
    outline: none;
    border-color: #f5d900;
  }
  /* Restore form mode toggle */
  .zeldwallet-restore-mode-toggle {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #f1f5f9;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .zeldwallet-restore-mode-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .zeldwallet-restore-mode-btn:hover {
    color: #0f172a;
    background: rgba(255, 255, 255, 0.5);
  }
  .zeldwallet-restore-mode-btn--active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .zeldwallet-hidden {
    display: none !important;
  }
  /* Mnemonic input styles */
  .zeldwallet-restore-mnemonic-input {
    min-height: 100px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    word-spacing: 4px;
  }
  .zeldwallet-restore-new-password-input,
  .zeldwallet-restore-confirm-password-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    font-size: 14px;
    color: #0f172a;
    padding-right: 44px;
    box-sizing: border-box;
  }
  .zeldwallet-restore-new-password-input:focus,
  .zeldwallet-restore-confirm-password-input:focus {
    outline: none;
    border-color: #f5d900;
  }
  /* Advanced options section */
  .zeldwallet-restore-advanced {
    margin-top: 4px;
  }
  .zeldwallet-restore-advanced-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 0;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  .zeldwallet-restore-advanced-toggle:hover {
    color: #0f172a;
  }
  .zeldwallet-restore-advanced-toggle .zeldwallet-chevron-icon {
    transition: transform 0.2s ease;
  }
  .zeldwallet-restore-advanced--open .zeldwallet-restore-advanced-toggle .zeldwallet-chevron-icon {
    transform: rotate(180deg);
  }
  .zeldwallet-restore-advanced-content {
    display: none;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
  }
  .zeldwallet-restore-advanced--open .zeldwallet-restore-advanced-content {
    display: flex;
  }
  .zeldwallet-restore-path-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .zeldwallet-restore-path-label {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
  .zeldwallet-restore-path-input {
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 13px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    color: #0f172a;
    box-sizing: border-box;
  }
  .zeldwallet-restore-path-input:focus {
    outline: none;
    border-color: #f5d900;
    background: #ffffff;
  }
  /* Dark mode for mnemonic restore */
  :host(.dark-card) .zeldwallet-restore-mode-toggle {
    background: #1e1e28;
  }
  :host(.dark-card) .zeldwallet-restore-mode-btn {
    color: #94a3b8;
  }
  :host(.dark-card) .zeldwallet-restore-mode-btn:hover {
    color: #e8e6e3;
    background: rgba(255, 255, 255, 0.1);
  }
  :host(.dark-card) .zeldwallet-restore-mode-btn--active {
    background: #12121a;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-restore-new-password-input,
  :host(.dark-card) .zeldwallet-restore-confirm-password-input {
    background: #12121a;
    border-color: #1e1e28;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-restore-advanced-toggle {
    color: #94a3b8;
  }
  :host(.dark-card) .zeldwallet-restore-advanced-toggle:hover {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-restore-path-label {
    color: #94a3b8;
  }
  :host(.dark-card) .zeldwallet-restore-path-input {
    background: #1e1e28;
    border-color: #2a2a36;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-restore-path-input:focus {
    background: #12121a;
  }
  .zeldwallet-backup-result {
    border: none;
    background: transparent;
    color: #0f172a;
    padding: 0;
    margin-top: 12px;
    display: grid;
    gap: 8px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }
  :host(.dark-card) .zeldwallet-backup-result {
    border-bottom-color: #1e1e28;
  }
  .zeldwallet-backup-result-title {
    font-weight: 700;
  }
  .zeldwallet-backup-result-hint {
    margin: 0;
    font-size: 13px;
    color: #475569;
  }
  .zeldwallet-backup-textarea {
    width: 100%;
    max-width: 100%;
    min-height: 120px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
    color: #0f172a;
    resize: vertical;
    box-sizing: border-box;
    overflow-wrap: anywhere;
  }
  .zeldwallet-backup-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-start;
  }
  :host(.dark-card) {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-card {
    background: linear-gradient(135deg, #0f0f16 0%, #0a0a0f 70%, #0c0c12 100%);
    color: #e8e6e3;
    border-color: #1e1e28;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  }
  :host(.dark-card) .zeldwallet-footer {
    border-top-color: #1e1e28;
  }
  :host(.dark-card) .zeldwallet-ready-block::after {
    background: #1e1e28;
  }
  :host(.dark-card) .zeldwallet-status,
  :host(.dark-card) .zeldwallet-backup-result-hint {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-label,
  :host(.dark-card) .zeldwallet-backup-result-title {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-title,
  :host(.dark-card) .zeldwallet-wallet-name,
  :host(.dark-card) .zeldwallet-value {
    color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-set-password-input,
  :host(.dark-card) .zeldwallet-password-input,
  :host(.dark-card) .zeldwallet-backup-input,
  :host(.dark-card) .zeldwallet-backup-textarea {
    background: #12121a;
    border-color: #1e1e28;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-password-field input:-webkit-autofill,
  :host(.dark-card) .zeldwallet-password-field input:-webkit-autofill:hover,
  :host(.dark-card) .zeldwallet-password-field input:-webkit-autofill:focus {
    box-shadow: 0 0 0 1000px #12121a inset;
    -webkit-text-fill-color: #e8e6e3;
    caret-color: #e8e6e3;
    border: 1px solid #1e1e28;
    outline: none;
    border-radius: 8px;
  }
  :host(.dark-card) .zeldwallet-wallet-row {
    background: transparent;
    border: 1px solid #1e1e28;
  }
  :host(.dark-card) .zeldwallet-balance-btc {
    color: #f7931a;
  }
  :host(.dark-card) .zeldwallet-balance-zeld {
    color: #a78bfa;
  }
  :host(.dark-card) .zeldwallet-balance-loading {
    color: #6b7280;
  }
  :host(.dark-card) .zeldwallet-balance-spinner {
    border-color: #2f2612;
    border-top-color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-wallet-desc {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-wallet-toggle {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-wallet-icon img {
    background: #0f0f16;
    border: 1px solid #1e1e28;
  }
  :host(.dark-card) .zeldwallet-install-link,
  :host(.dark-card) .zeldwallet-copy,
  :host(.dark-card) .zeldwallet-set-password-button,
  :host(.dark-card) .zeldwallet-connect-wallet {
    background: #12121a;
    border: 1px solid #e8e6e3;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-address-copy {
    background: transparent;
    border: none;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-install-link:hover,
  :host(.dark-card) .zeldwallet-copy:hover:not(:disabled),
  :host(.dark-card) .zeldwallet-set-password-button:hover,
  :host(.dark-card) .zeldwallet-connect-wallet:hover {
    background: rgba(232, 230, 227, 0.08);
    border-color: #ffffff;
    color: #ffffff;
  }
  :host(.dark-card) .zeldwallet-address-copy:hover:not(:disabled) {
    background: transparent;
    border: none;
    color: #ffffff;
  }
  :host(.dark-card) .zeldwallet-badge {
    background: #1e1e28;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-badge--installed {
    background: #1e1e28;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-copy:disabled {
    background: #12121a;
    color: #a6a6ad;
    border-color: #2b2b36;
  }
  :host(.dark-card) .zeldwallet-copied {
    background: #12121a;
    border-color: #e8e6e3;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-copied:hover:not(:disabled) {
    background: rgba(232, 230, 227, 0.08);
    border-color: #ffffff;
    color: #ffffff;
  }
  :host(.dark-card) .zeldwallet-set-password-cancel,
  :host(.dark-card) .zeldwallet-icon-button {
    border-color: #e8e6e3;
    background: #12121a;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-set-password-form,
  :host(.dark-card) .zeldwallet-backup-form,
  :host(.dark-card) .zeldwallet-restore-form {
    border-bottom-color: #1e1e28;
  }
  :host(.dark-card) .zeldwallet-restore-textarea,
  :host(.dark-card) .zeldwallet-restore-password-input {
    background: #12121a;
    border-color: #1e1e28;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-cancel-icon:hover {
    border-color: #fca5a5;
    background: #2a0e0e;
    color: #fca5a5;
  }
  /* RTL support */
  .zeldwallet-rtl {
    direction: rtl;
    text-align: right;
  }
  .zeldwallet-rtl .zeldwallet-set-password-input,
  .zeldwallet-rtl .zeldwallet-password-input,
  .zeldwallet-rtl .zeldwallet-backup-input {
    padding-right: 12px;
    padding-left: 42px;
  }
  .zeldwallet-rtl .zeldwallet-toggle-visibility {
    right: auto;
    left: 10px;
  }
  .zeldwallet-rtl .zeldwallet-value {
    direction: ltr;
    text-align: left;
    unicode-bidi: embed;
  }
  .zeldwallet-rtl .zeldwallet-backup-textarea,
  .zeldwallet-rtl .zeldwallet-restore-textarea {
    direction: ltr;
    text-align: left;
  }
  .zeldwallet-rtl .zeldwallet-backup-actions {
    justify-content: flex-end;
  }
  .zeldwallet-network {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    text-transform: lowercase;
  }
  .zeldwallet-network-name {
    letter-spacing: 0.01em;
  }
  .zeldwallet-network-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px #dcfce7;
  }
  .zeldwallet-network--testnet .zeldwallet-network-dot {
    background: #f59e0b;
    box-shadow: 0 0 0 4px #fef3c7;
  }
  .zeldwallet-network--mainnet .zeldwallet-network-dot {
    background: #22c55e;
    box-shadow: 0 0 0 4px #dcfce7;
  }
  .zeldwallet-network--mainnet .zeldwallet-network-name,
  .zeldwallet-network--testnet .zeldwallet-network-name {
    color: #475569;
  }
  :host(.dark-card) .zeldwallet-network {
    color: #d7cbb1;
  }
  :host(.dark-card) .zeldwallet-network-dot {
    background: #d4af37;
    box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
  }
  :host(.dark-card) .zeldwallet-network--testnet .zeldwallet-network-dot {
    background: #b8960c;
    box-shadow: 0 0 0 4px rgba(184, 150, 12, 0.2);
  }
  :host(.dark-card) .zeldwallet-network--mainnet .zeldwallet-network-dot {
    background: #d4af37;
    box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
  }
  :host(.dark-card) .zeldwallet-network-name {
    color: #f4e4a6;
  }
  @keyframes zeldwallet-soft-pulse {
    0% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    100% {
      opacity: 0.8;
      transform: scale(1);
    }
  }
  @keyframes zeldwallet-warning-button-pulse {
    0% {
      background: rgba(239, 68, 68, 0.22);
    }
    60% {
      background: #ffffff;
    }
    80% {
      background: #ffffff;
    }
    100% {
      background: rgba(239, 68, 68, 0.22);
    }
  }
  /* Tooltip system for icon buttons */
  [data-tooltip] {
    position: relative;
  }
  [data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: #f8fafc;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
    white-space: normal;
    max-width: 280px;
    width: max-content;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    z-index: 10;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
    pointer-events: none;
  }
  [data-tooltip]:hover::after,
  [data-tooltip]:focus-visible::after {
    opacity: 1;
    visibility: visible;
  }
  /* Tooltip arrow */
  [data-tooltip]::before {
    content: '';
    position: absolute;
    bottom: calc(100% + 2px);
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1e293b;
    z-index: 10;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
    pointer-events: none;
  }
  [data-tooltip]:hover::before,
  [data-tooltip]:focus-visible::before {
    opacity: 1;
    visibility: visible;
  }
  /* Dark mode tooltips */
  :host(.dark-card) [data-tooltip]::after {
    background: #1b1710;
    color: #f4e4a6;
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  }
  :host(.dark-card) [data-tooltip]::before {
    border-top-color: #1b1710;
  }
  /* RTL tooltip positioning */
  .zeldwallet-rtl [data-tooltip]::after,
  .zeldwallet-rtl [data-tooltip]::before {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  /* Hunting section */
  .zeldwallet-hunting {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    overflow: visible;
  }
  .zeldwallet-hunting-send-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .zeldwallet-hunting-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 0;
  }
  .zeldwallet-hunting-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    cursor: pointer;
  }
  .zeldwallet-hunting-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #f7931a;
    cursor: pointer;
  }
  .zeldwallet-hunting-checkbox.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .zeldwallet-hunting-checkbox.disabled input[type="checkbox"] {
    cursor: not-allowed;
  }
  .zeldwallet-hunting-slider {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
  }
  .zeldwallet-hunting-slider input[type="range"] {
    width: 80px;
    height: 6px;
    accent-color: #f7931a;
    cursor: pointer;
  }
  .zeldwallet-hunting-slider-value {
    min-width: 20px;
    text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    color: #f7931a;
  }
  .zeldwallet-hunt-button-row {
    /* Takes full width to force new line, centers the button inside */
    flex: 1 1 100%;
    display: flex;
    justify-content: center;
    margin-top: 8px;
  }
  .zeldwallet-hunt-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #f7931a;
    background: linear-gradient(135deg, #f7931a 0%, #e67e00 100%);
    color: #fff;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .zeldwallet-hunt-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #e67e00 0%, #cc6e00 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(247, 147, 26, 0.3);
  }
  .zeldwallet-hunt-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .zeldwallet-hunt-button-wrapper {
    display: inline-flex;
    cursor: not-allowed;
    position: relative;
  }
  .zeldwallet-hunt-button-wrapper .zeldwallet-hunt-button {
    pointer-events: none;
  }
  /* Ensure tooltip on hunt button wrapper is visible and properly positioned */
  .zeldwallet-hunt-button-wrapper[data-tooltip]::after {
    white-space: normal;
    max-width: 220px;
    text-align: center;
    z-index: 100;
    right: 0;
    left: auto;
    transform: none;
  }
  .zeldwallet-hunt-button-wrapper[data-tooltip]::before {
    z-index: 100;
    right: 24px;
    left: auto;
    transform: none;
  }
  .zeldwallet-hunt-button .zeldwallet-btn-icon {
    width: 16px;
    height: 16px;
  }
  .zeldwallet-hunting-input {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    background: #fff;
    color: #0f172a;
    min-width: 0;
  }
  .zeldwallet-hunting-input::placeholder {
    color: #94a3b8;
  }
  .zeldwallet-hunting-input:focus {
    outline: none;
    border-color: #f7931a;
    box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.1);
  }
  .zeldwallet-hunting-input.error {
    border-color: #ef4444;
  }
  .zeldwallet-hunting-error {
    font-size: 12px;
    color: #ef4444;
    margin-top: 4px;
  }

  /* Dark mode hunting */
  :host(.dark-card) .zeldwallet-hunting {
    border-top-color: #1e1e28;
  }
  :host(.dark-card) .zeldwallet-hunting-checkbox,
  :host(.dark-card) .zeldwallet-hunting-slider {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-hunting-slider-value {
    color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-hunting-checkbox input[type="checkbox"] {
    accent-color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-hunting-slider input[type="range"] {
    accent-color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-hunt-button {
    border-color: #d4af37;
    background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
    color: #0f0f16;
  }
  :host(.dark-card) .zeldwallet-hunt-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #e8c454 0%, #d4af37 100%);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }
  :host(.dark-card) .zeldwallet-hunting-input {
    background: #12121a;
    border-color: #1e1e28;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-hunting-input::placeholder {
    color: #6b7280;
  }
  :host(.dark-card) .zeldwallet-hunting-input:focus {
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
  }

  /* Fee selector - collapsible */
  .zeldwallet-fee-selector {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .zeldwallet-fee-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    cursor: pointer;
    line-height: 1;
  }
  .zeldwallet-fee-toggle:hover:not(:disabled) {
    color: #f7931a;
  }
  .zeldwallet-fee-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .zeldwallet-fee-label {
    font-weight: 500;
    color: #0f172a;
  }
  .zeldwallet-fee-chevron {
    display: inline-flex;
    width: 12px;
    height: 12px;
    color: #0f172a;
    transition: transform 0.15s ease;
  }
  .zeldwallet-fee-chevron.open {
    transform: rotate(180deg);
  }
  .zeldwallet-fee-chevron svg {
    width: 100%;
    height: 100%;
  }
  .zeldwallet-fee-toggle:hover:not(:disabled) .zeldwallet-fee-label,
  .zeldwallet-fee-toggle:hover:not(:disabled) .zeldwallet-fee-chevron {
    color: #f7931a;
  }
  .zeldwallet-fee-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 50;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 200px;
  }
  .zeldwallet-fee-options {
    display: flex;
    gap: 4px;
    flex-wrap: nowrap;
  }
  .zeldwallet-fee-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    padding: 4px 6px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: #f8fafc;
    color: #0f172a;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s ease;
    flex: 1 1 0;
    min-width: 0;
  }
  .zeldwallet-fee-option:hover:not(:disabled) {
    border-color: #f7931a;
    background: #fff7ed;
  }
  .zeldwallet-fee-option.selected {
    border-color: #f7931a;
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    color: #ea580c;
  }
  .zeldwallet-fee-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .zeldwallet-fee-option-label {
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }
  .zeldwallet-fee-option-rate {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 700;
    color: #f7931a;
  }
  .zeldwallet-fee-option.selected .zeldwallet-fee-option-rate {
    color: #ea580c;
  }
  .zeldwallet-fee-option-unit {
    color: #64748b;
    font-weight: 400;
    font-size: 10px;
  }
  .zeldwallet-fee-custom-field {
    width: 100%;
    text-align: center;
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 4px;
    margin-top: 6px;
    box-sizing: border-box;
  }

  /* Dark mode fee selector */
  :host(.dark-card) .zeldwallet-fee-toggle {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-fee-toggle:hover:not(:disabled) {
    color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-fee-label {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-fee-chevron {
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-fee-toggle:hover:not(:disabled) .zeldwallet-fee-label,
  :host(.dark-card) .zeldwallet-fee-toggle:hover:not(:disabled) .zeldwallet-fee-chevron {
    color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-fee-dropdown {
    background: #12121a;
    border-color: #2d2d3a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  :host(.dark-card) .zeldwallet-fee-option {
    background: #1a1a24;
    border-color: #2d2d3a;
    color: #e8e6e3;
  }
  :host(.dark-card) .zeldwallet-fee-option:hover:not(:disabled) {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  }
  :host(.dark-card) .zeldwallet-fee-option.selected {
    border-color: #d4af37;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%);
    color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-fee-option-rate {
    color: #d4af37;
  }
  :host(.dark-card) .zeldwallet-fee-option.selected .zeldwallet-fee-option-rate {
    color: #e8c454;
  }
  :host(.dark-card) .zeldwallet-fee-option-unit {
    color: #e8e6e3;
  }

  /* Mining Progress */
  .zeldwallet-mining-progress {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    animation: zeldwallet-pulse 2s ease-in-out infinite;
  }

  @keyframes zeldwallet-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }

  .zeldwallet-mining-stats {
    display: flex;
    justify-content: space-around;
    gap: 8px;
  }

  .zeldwallet-mining-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .zeldwallet-mining-stat-label {
    font-size: 11px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .zeldwallet-mining-stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    font-variant-numeric: tabular-nums;
  }

  .zeldwallet-mining-final-stats {
    display: flex;
    justify-content: space-around;
    gap: 8px;
    padding: 8px 0;
    margin-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .zeldwallet-mining-actions {
    display: flex;
    justify-content: center;
  }

  .zeldwallet-mining-control {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-mining-control:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  /* Mining Result */
  .zeldwallet-mining-result {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
  }

  .zeldwallet-mining-congrats {
    font-size: 14px;
    font-weight: 600;
    color: #065f46;
    text-align: center;
  }

  .zeldwallet-mining-txid {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 12px 0;
  }

  .zeldwallet-mining-txid-value {
    font-size: 14px;
    font-family: monospace;
    color: #1f2937;
    word-break: break-all;
    text-align: center;
  }

  .zeldwallet-txid-zeros {
    color: #d4af37;
    font-weight: 600;
  }

  .zeldwallet-mining-result-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .zeldwallet-mining-broadcast {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-mining-broadcast:hover {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }

  .zeldwallet-mining-mempool-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: 1px solid #a7f3d0;
    border-radius: 6px;
    background: #fff;
    color: #059669;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-mining-mempool-link:hover {
    background: #ecfdf5;
    border-color: #059669;
  }

  .zeldwallet-mining-copy-psbt {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-mining-copy-psbt:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .zeldwallet-mining-cancel {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #6b7280;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-mining-cancel:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  /* Mining Error */
  .zeldwallet-mining-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-radius: 8px;
    border: 1px solid #fca5a5;
  }

  .zeldwallet-mining-error-message {
    font-size: 13px;
    color: #991b1b;
    text-align: center;
  }

  .zeldwallet-mining-retry {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    background: #fff;
    color: #dc2626;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-mining-retry:hover {
    background: #fef2f2;
    border-color: #dc2626;
  }

  /* Dark mode mining */
  :host(.dark-card) .zeldwallet-mining-progress {
    background: linear-gradient(135deg, #1a1a24 0%, #12121a 100%);
  }

  :host(.dark-card) .zeldwallet-mining-stat-label {
    color: #9ca3af;
  }

  :host(.dark-card) .zeldwallet-mining-stat-value {
    color: #e8e6e3;
  }

  :host(.dark-card) .zeldwallet-mining-final-stats {
    border-bottom-color: #2d2d3a;
  }

  :host(.dark-card) .zeldwallet-mining-control {
    background: #1e1e28;
    border-color: #2d2d3a;
    color: #e8e6e3;
  }

  :host(.dark-card) .zeldwallet-mining-control:hover {
    background: #2d2d3a;
    border-color: #3d3d4a;
  }

  :host(.dark-card) .zeldwallet-mining-congrats {
    color: #6ee7b7;
  }

  :host(.dark-card) .zeldwallet-mining-txid-value {
    color: #e8e6e3;
  }

  :host(.dark-card) .zeldwallet-txid-zeros {
    color: #e8c454;
  }

  :host(.dark-card) .zeldwallet-mining-broadcast {
    background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
    color: #0f0f16;
  }

  :host(.dark-card) .zeldwallet-mining-broadcast:hover {
    background: linear-gradient(135deg, #e8c454 0%, #d4af37 100%);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  :host(.dark-card) .zeldwallet-mining-mempool-link {
    background: #1e1e28;
    border-color: #059669;
    color: #6ee7b7;
  }

  :host(.dark-card) .zeldwallet-mining-mempool-link:hover {
    background: #0d3320;
  }

  :host(.dark-card) .zeldwallet-mining-copy-psbt {
    background: #1e1e28;
    border-color: #2d2d3a;
    color: #9ca3af;
  }

  :host(.dark-card) .zeldwallet-mining-copy-psbt:hover {
    background: #2d2d3a;
  }

  :host(.dark-card) .zeldwallet-mining-cancel {
    background: #1e1e28;
    border-color: #2d2d3a;
    color: #9ca3af;
  }

  :host(.dark-card) .zeldwallet-mining-cancel:hover {
    background: #2d2d3a;
  }

  :host(.dark-card) .zeldwallet-mining-error {
    background: linear-gradient(135deg, #3b1212 0%, #450a0a 100%);
    border-color: #dc2626;
  }

  :host(.dark-card) .zeldwallet-mining-error-message {
    color: #fca5a5;
  }

  :host(.dark-card) .zeldwallet-mining-retry {
    background: #1e1e28;
    border-color: #dc2626;
    color: #fca5a5;
  }

  :host(.dark-card) .zeldwallet-mining-retry:hover {
    background: #3b1212;
  }

  /* Confirmation Dialog */
  .zeldwallet-confirm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: 12px;
    padding: 16px;
  }

  .zeldwallet-confirm-dialog {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    max-width: 100%;
    width: 100%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    max-height: calc(100% - 32px);
    overflow-y: auto;
  }

  .zeldwallet-confirm-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    text-align: center;
  }

  .zeldwallet-confirm-section {
    margin-bottom: 16px;
  }

  .zeldwallet-confirm-section-header {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
  }

  .zeldwallet-confirm-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .zeldwallet-confirm-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background: #f8fafc;
    border-radius: 6px;
    gap: 12px;
  }

  .zeldwallet-confirm-address {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .zeldwallet-confirm-change {
    font-size: 10px;
    font-weight: 500;
    color: #059669;
    background: #d1fae5;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .zeldwallet-confirm-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    color: #f7931a;
    white-space: nowrap;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .zeldwallet-confirm-zeld {
    font-size: 11px;
    font-weight: 600;
    color: #d4af37;
  }

  .zeldwallet-confirm-row-opreturn .zeldwallet-confirm-address {
    font-size: 11px;
  }

  .zeldwallet-confirm-summary {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 2px solid #e2e8f0;
  }

  .zeldwallet-confirm-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }

  .zeldwallet-confirm-summary-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .zeldwallet-confirm-summary-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 14px;
    font-weight: 700;
  }

  .zeldwallet-confirm-fee {
    color: #dc2626;
  }

  .zeldwallet-confirm-mempool-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 12px 16px;
    margin-top: 16px;
    border: 1px solid #a7f3d0;
    border-radius: 8px;
    background: #fff;
    color: #059669;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-confirm-mempool-link:hover {
    background: #ecfdf5;
    border-color: #059669;
  }

  .zeldwallet-confirm-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .zeldwallet-confirm-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zeldwallet-confirm-btn-confirm {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    border: none;
    color: #fff;
  }

  .zeldwallet-confirm-btn-confirm:hover {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }

  .zeldwallet-confirm-btn-cancel {
    background: #fff;
    border: 1px solid #d1d5db;
    color: #6b7280;
  }

  .zeldwallet-confirm-btn-cancel:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  /* Dark mode confirmation dialog */
  :host(.dark-card) .zeldwallet-confirm-overlay {
    background: rgba(10, 10, 15, 0.85);
  }

  :host(.dark-card) .zeldwallet-confirm-dialog {
    background: #12121a;
    border: 1px solid #2d2d3a;
  }

  :host(.dark-card) .zeldwallet-confirm-title {
    color: #d4af37;
  }

  :host(.dark-card) .zeldwallet-confirm-section-header {
    color: #9ca3af;
    border-bottom-color: #2d2d3a;
  }

  :host(.dark-card) .zeldwallet-confirm-row {
    background: #1a1a24;
  }

  :host(.dark-card) .zeldwallet-confirm-address {
    color: #e8e6e3;
  }

  :host(.dark-card) .zeldwallet-confirm-change {
    background: #064e25;
    color: #6ee7b7;
  }

  :host(.dark-card) .zeldwallet-confirm-value {
    color: #d4af37;
  }

  :host(.dark-card) .zeldwallet-confirm-zeld {
    color: #f5d65a;
  }

  :host(.dark-card) .zeldwallet-confirm-summary {
    border-top-color: #2d2d3a;
  }

  :host(.dark-card) .zeldwallet-confirm-summary-label {
    color: #9ca3af;
  }

  :host(.dark-card) .zeldwallet-confirm-fee {
    color: #fca5a5;
  }

  :host(.dark-card) .zeldwallet-confirm-mempool-link {
    background: #1e1e28;
    border-color: #059669;
    color: #6ee7b7;
  }

  :host(.dark-card) .zeldwallet-confirm-mempool-link:hover {
    background: #0d3320;
  }

  :host(.dark-card) .zeldwallet-confirm-btn-confirm {
    background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
    color: #0f0f16;
  }

  :host(.dark-card) .zeldwallet-confirm-btn-confirm:hover {
    background: linear-gradient(135deg, #e8c454 0%, #d4af37 100%);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  :host(.dark-card) .zeldwallet-confirm-btn-cancel {
    background: #1e1e28;
    border-color: #2d2d3a;
    color: #9ca3af;
  }

  :host(.dark-card) .zeldwallet-confirm-btn-cancel:hover {
    background: #2d2d3a;
  }

  /* ======================================================
     Mobile Responsive: Tabs for Addresses/Balances columns
     ====================================================== */
  
  /* Mobile tab button base styles (hidden on desktop) */
  .zeldwallet-mobile-tab {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s ease;
  }
  
  /* On desktop: hide the button styling, show as regular text */
  @media (min-width: 481px) {
    .zeldwallet-mobile-tab {
      cursor: default;
      pointer-events: none;
    }
  }
  
  /* Mobile breakpoint: < 480px */
  @media (max-width: 480px) {
    /* Status row becomes tabs container */
    .zeldwallet-status-row.zeldwallet-mobile-tabs {
      display: flex;
      gap: 0;
      padding: 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 12px;
    }
    
    /* Tab button styling */
    .zeldwallet-mobile-tab {
      flex: 1;
      text-align: center;
      margin: 0;
      padding: 10px 8px;
      border-radius: 8px 8px 0 0;
      color: #64748b;
      position: relative;
    }
    
    .zeldwallet-mobile-tab:hover {
      color: #0f172a;
      background: rgba(0, 0, 0, 0.03);
    }
    
    .zeldwallet-mobile-tab--active {
      color: #0f172a;
      background: transparent;
    }
    
    /* On mobile: hide underline for inactive tabs, show only for active */
    .zeldwallet-mobile-tab::after {
      display: none;
    }
    
    .zeldwallet-mobile-tab--active::after {
      display: block;
      content: '';
      position: absolute;
      bottom: -1px;
      left: 10%;
      right: 10%;
      height: 2px;
      background: #f7931a;
      border-radius: 2px 2px 0 0;
    }
    
    /* Hide the vertical divider on mobile */
    .zeldwallet-ready-block::after {
      display: none;
    }
    
    /* Reduce gap between rows on mobile */
    .zeldwallet-rows {
      gap: 0;
    }
    
    /* Rows: show only the active column */
    .zeldwallet-row {
      display: block;
      padding: 0 12px;
    }
    
    /* By default, hide both columns */
    .zeldwallet-row-left.zeldwallet-mobile-col-addresses,
    .zeldwallet-row-right.zeldwallet-mobile-col-balances {
      display: none;
    }
    
    /* Show addresses column when addresses tab is active */
    [data-mobile-tab="addresses"] .zeldwallet-mobile-col-addresses {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      min-height: 32px;
    }
    
    /* Show balances column when balances tab is active */
    [data-mobile-tab="balances"] .zeldwallet-mobile-col-balances {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 8px 0;
      min-height: 32px;
    }
    
    /* Keep balance values right-aligned on mobile (like desktop) */
    [data-mobile-tab="balances"] .zeldwallet-balance-value {
      justify-content: flex-end;
    }
    
    /* Add separator between rows on mobile */
    [data-mobile-tab="balances"] .zeldwallet-row:not(:last-child),
    [data-mobile-tab="addresses"] .zeldwallet-row:not(:last-child) {
      border-bottom: 1px solid #e5e7eb;
    }
    
    /* Show label above address on mobile addresses tab */
    [data-mobile-tab="addresses"] .zeldwallet-mobile-col-addresses .zeldwallet-label {
      font-size: 12px;
      color: #64748b;
    }
    
    /* Dark mode mobile styles */
    :host(.dark-card) .zeldwallet-status-row.zeldwallet-mobile-tabs {
      border-bottom-color: #1e1e28;
    }
    
    :host(.dark-card) .zeldwallet-mobile-tab {
      color: #9ca3af;
    }
    
    :host(.dark-card) .zeldwallet-mobile-tab:hover {
      color: #e8e6e3;
      background: rgba(255, 255, 255, 0.03);
    }
    
    :host(.dark-card) .zeldwallet-mobile-tab--active {
      color: #e8e6e3;
    }
    
    :host(.dark-card) .zeldwallet-mobile-tab--active::after {
      background: #d4af37;
    }
    
    :host(.dark-card) [data-mobile-tab="balances"] .zeldwallet-row:not(:last-child),
    :host(.dark-card) [data-mobile-tab="addresses"] .zeldwallet-row:not(:last-child) {
      border-bottom-color: #1e1e28;
    }
    
    :host(.dark-card) [data-mobile-tab="addresses"] .zeldwallet-mobile-col-addresses .zeldwallet-label {
      color: #9ca3af;
    }
    
    /* Larger margin for hunt button row on mobile */
    .zeldwallet-hunt-button-row {
      margin-top: 16px;
    }
    
    /* Mining result actions: Sign and Broadcast on its own line, Cancel and Copy on second line */
    .zeldwallet-mining-broadcast {
      flex: 1 1 100%;
      justify-content: center;
    }
  }
`;

