import { ZeldWallet } from './ZeldWallet';
import type { AddressInfo, NetworkType, SignInputOptions } from './types';

export type ExternalWalletSession = {
  id: string;
  name: string;
  network: NetworkType;
  addresses: AddressInfo[];
  /**
   * Sign an arbitrary message with the connected wallet.
   */
  signMessage: (message: string, address: string, protocol?: 'ecdsa' | 'bip322-simple') => Promise<string>;
  /**
   * Optional PSBT signing hook. Falls back to ZeldWallet when omitted.
   */
  signPsbt?: (psbtBase64: string, inputs: SignInputOptions[]) => Promise<string>;
};

class UnifiedWalletBridge {
  private external?: ExternalWalletSession;

  useExternal(session: ExternalWalletSession): void {
    this.external = session;
  }

  reset(): void {
    this.external = undefined;
  }

  isExternalActive(): boolean {
    return !!this.external;
  }

  getActiveName(): string {
    return this.external?.name ?? 'ZeldWallet';
  }

  getNetwork(): NetworkType {
    return this.external?.network ?? ZeldWallet.getNetwork();
  }

  getAddresses(purposes: Array<'payment' | 'ordinals' | 'stacks'>): AddressInfo[] {
    if (this.external) {
      return this.external.addresses.filter((entry) => purposes.includes(entry.purpose));
    }
    return ZeldWallet.getAddresses(purposes);
  }

  async signMessage(message: string, address: string, protocol: 'ecdsa' | 'bip322-simple' = 'ecdsa'): Promise<string> {
    console.log('[UnifiedWallet.signMessage] external session:', {
      hasExternal: !!this.external,
      externalId: this.external?.id,
      externalName: this.external?.name,
      hasSignMessage: typeof this.external?.signMessage === 'function',
    });
    if (this.external) {
      console.log('[UnifiedWallet.signMessage] Calling external signMessage with:', { message, address, protocol });
      return this.external.signMessage(message, address, protocol);
    }
    console.log('[UnifiedWallet.signMessage] Falling back to ZeldWallet.signMessage');
    return ZeldWallet.signMessage(message, address, protocol);
  }

  async signPsbt(psbtBase64: string, inputs: SignInputOptions[]): Promise<string> {
    if (this.external?.signPsbt) {
      return this.external.signPsbt(psbtBase64, inputs);
    }
    return ZeldWallet.signPsbt(psbtBase64, inputs);
  }
}

export const UnifiedWallet = new UnifiedWalletBridge();

export type { UnifiedWalletBridge };

