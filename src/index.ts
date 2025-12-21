/**
 * ZeldWallet public entrypoint.
 *
 * Exposes the main wallet class, helpers, and types.
 */
export * from './types';
export { SecureStorage } from './storage/SecureStorage';
export { KeyManager } from './keys/KeyManager';
export { ConfirmationModal } from './ui/Modal';
export { WBIPProvider, type ConfirmationHandler } from './provider/WBIPProvider';
export { ZeldWalletUI, defineZeldWalletUI } from './component/ZeldWalletUI';
export { languages, type LocaleKey, type LocaleStrings, type LanguageInfo } from './component/i18n';
export * from './react';
export { UnifiedWallet, type ExternalWalletSession } from './unifiedWallet';

import ZeldWallet from './ZeldWallet';

export { ZeldWallet };
export default ZeldWallet;

