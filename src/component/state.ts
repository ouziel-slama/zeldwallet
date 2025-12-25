import type { NetworkType, AddressInfo } from '../types';
import { DEFAULT_PROVIDER } from './constants';
import type { SupportedWalletId, WalletOptionState } from './wallets';

export type ComponentStatus = 'loading' | 'generating' | 'recovering' | 'locked' | 'ready' | 'error';

export type BalanceState = {
  btcSats: number;
  zeldBalance: number;
  /** BTC balance in sats for payment address only */
  btcPaymentSats?: number;
  loading: boolean;
  error?: string;
};

/** Mining progress stats */
export type MiningStats = {
  hashRate: number;
  hashesProcessed: bigint;
  elapsedMs: number;
};

/** Mining result after successful hunt */
export type MiningResult = {
  txid: string;
  psbt: string;
  nonce: bigint;
  attempts: bigint;
  duration: number;
};

/** Mining status */
export type MiningStatus = 'idle' | 'mining' | 'paused' | 'found' | 'signing' | 'broadcast' | 'error';

/** Hunting section state */
export type HuntingState = {
  sendBtcChecked: boolean;
  sendZeldChecked: boolean;
  zeroCount: number;
  useGpu: boolean;
  recipientAddress: string;
  amount: string;
  addressError?: string;
  amountError?: string;
  // Mining state
  miningStatus: MiningStatus;
  miningStats?: MiningStats;
  miningResult?: MiningResult;
  miningError?: string;
  broadcastTxid?: string;
};

export type ComponentState = {
  status: ComponentStatus;
  addresses?: AddressInfo[];
  message?: string;
  passwordError?: string;
  hasPassword?: boolean;
  showSetPasswordForm?: boolean;
  setPasswordError?: string;
  hasBackup?: boolean;
  showBackupForm?: boolean;
  backupError?: string;
  backupValue?: string;
  walletKind: 'zeld' | 'external';
  activeWalletId: SupportedWalletId;
  activeWalletName: string;
  walletPickerOpen: boolean;
  walletOptions: WalletOptionState[];
  externalNetwork?: NetworkType;
  balance?: BalanceState;
  hunting?: HuntingState;
};

export const createInitialHuntingState = (): HuntingState => ({
  sendBtcChecked: false,
  sendZeldChecked: false,
  zeroCount: 6,
  useGpu: true,
  recipientAddress: '',
  amount: '',
  miningStatus: 'idle',
});

export const createInitialState = (walletOptions: WalletOptionState[] = []): ComponentState => ({
  status: 'loading',
  walletKind: 'zeld',
  activeWalletId: 'zeld',
  activeWalletName: DEFAULT_PROVIDER.name,
  walletPickerOpen: false,
  walletOptions,
  hunting: createInitialHuntingState(),
});

