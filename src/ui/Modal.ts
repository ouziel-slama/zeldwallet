import type { ConfirmationData, ConfirmationType } from '../types';

/**
 * Lightweight modal-based confirmation UI for browser environments.
 * Falls back to throwing when no DOM is available so callers can provide
 * their own confirmation handler in SSR or native contexts.
 */
export class ConfirmationModal {
  private container: HTMLDivElement | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  async show(type: ConfirmationType, data?: Partial<ConfirmationData>): Promise<boolean> {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Confirmation UI requires a browser DOM environment');
    }

    // Always close any existing modal before opening a new one
    this.close();

    return new Promise<boolean>((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'zeldwallet-modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'zeldwallet-modal';

      const title = document.createElement('h3');
      title.textContent = this.getTitle(type);
      modal.appendChild(title);

      const body = document.createElement('div');
      body.className = 'zeldwallet-modal-body';
      body.appendChild(this.buildSummary(type, data));
      modal.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'zeldwallet-modal-actions';
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'zw-btn zw-cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'zw-btn zw-confirm';
      confirmBtn.type = 'button';
      confirmBtn.textContent = 'Confirm';
      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      modal.appendChild(actions);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      this.container = overlay;

      const cleanup = () => {
        this.close();
      };

      const approve = () => {
        cleanup();
        resolve(true);
      };
      const reject = () => {
        cleanup();
        resolve(false);
      };

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          reject();
        }
      });
      cancelBtn.addEventListener('click', reject);
      confirmBtn.addEventListener('click', approve);

      this.keydownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          reject();
        }
      };
      document.addEventListener('keydown', this.keydownHandler);

      this.injectStyles();
    });
  }

  /**
   * Close the modal if it is open.
   */
  close(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  private buildSummary(type: ConfirmationType, data?: Partial<ConfirmationData>): HTMLElement {
    const container = document.createElement('div');
    container.className = 'zeldwallet-modal-summary';

    const rows: Array<[string, string | undefined]> = [];
    if (data?.origin) rows.push(['Origin', data.origin]);
    switch (type) {
      case 'sign_message':
        rows.push(['Message', data?.message ?? '']);
        break;
      case 'sign_psbt':
        rows.push(['PSBT', data?.psbt ? `${data.psbt.slice(0, 32)}…` : '']);
        break;
      case 'send_transfer':
        rows.push(['Recipient', data?.recipient ?? '']);
        rows.push(['Amount (sats)', data?.amount !== undefined ? String(data.amount) : '']);
        break;
      case 'connect':
      default:
        break;
    }

    if (rows.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'Confirm this action in ZeldWallet.';
      container.appendChild(p);
      return container;
    }

    for (const [label, value] of rows) {
      const row = document.createElement('div');
      row.className = 'zeldwallet-modal-row';

      const labelEl = document.createElement('span');
      labelEl.className = 'zw-label';
      labelEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = 'zw-value';
      valueEl.textContent = value ?? '';

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      container.appendChild(row);
    }

    return container;
  }

  private getTitle(type: ConfirmationType): string {
    switch (type) {
      case 'sign_message':
        return 'Sign Message';
      case 'sign_psbt':
        return 'Sign Transaction';
      case 'send_transfer':
        return 'Send Transfer';
      case 'connect':
      default:
        return 'Connect to ZeldWallet';
    }
  }

  private injectStyles(): void {
    if (document.getElementById('zeldwallet-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'zeldwallet-modal-styles';
    style.textContent = `
      .zeldwallet-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      .zeldwallet-modal {
        background: #fff;
        color: #0f172a;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
        width: min(420px, 90vw);
        padding: 20px 24px;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .zeldwallet-modal h3 {
        margin: 0 0 12px;
        font-size: 18px;
        font-weight: 700;
      }
      .zeldwallet-modal-body {
        margin-bottom: 16px;
      }
      .zeldwallet-modal-summary {
        display: grid;
        gap: 10px;
      }
      .zeldwallet-modal-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 14px;
        word-break: break-word;
      }
      .zeldwallet-modal-row .zw-label {
        font-weight: 600;
        color: #475569;
      }
      .zeldwallet-modal-row .zw-value {
        text-align: right;
        color: #0f172a;
        flex: 1;
      }
      .zeldwallet-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 4px;
      }
      .zw-btn {
        border: none;
        border-radius: 8px;
        padding: 10px 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .zw-cancel {
        background: #e2e8f0;
        color: #0f172a;
      }
      .zw-confirm {
        background: #2563eb;
        color: #fff;
      }
      .zw-btn:focus {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
      }
    `;

    document.head.appendChild(style);
  }
}


