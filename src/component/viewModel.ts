import type { NetworkType } from '../types';
import { formatBtc, formatZeld, truncateAddress } from './balance';
import { BITCOIN_ICON, DUST, MIN_FEE_RESERVE, ORDINALS_ICON } from './constants';
import type { LocaleStrings, TextDirection } from './i18n';
import type { ComponentState, FeeMode } from './state';
import { FALLBACK_ICON, type SupportedWalletId } from './wallets';

export type RenderTemplateProps = {
  state: ComponentState;
  network: NetworkType;
  dir: TextDirection;
  strings: LocaleStrings;
  showPasswordWarning: boolean;
  showBackupWarning: boolean;
  readyWithSecurity: boolean;
};

export type ActionKind = 'new-backup' | 'change-password';

export type ActionView = {
  kind: ActionKind;
  label: string;
  icon: string;
  className: string;
};

export type InlineWarningView = {
  type: 'password' | 'backup';
  tooltip: string;
  ariaLabel: string;
  actions: ActionView[];
};

export type StatusView = { variant: 'loading' | 'error'; message: string };

export type LockedView = {
  lockedLabel: string;
  lockedHint: string;
  passwordPlaceholder: string;
  submitLabel: string;
  error?: string;
};

export type SetPasswordFormView = {
  passwordPlaceholder: string;
  confirmPlaceholder: string;
  submitLabel: string;
  cancelLabel: string;
  error?: string;
};

export type BackupFormView = {
  passwordPlaceholder: string;
  submitLabel: string;
  cancelLabel: string;
  error?: string;
};

export type BackupResultView = {
  value: string;
  title: string;
  hint: string;
  copyLabel: string;
  downloadLabel: string;
  cancelLabel: string;
};

export type BalanceType = 'btc' | 'zeld';

export type ReadyRowView = {
  label: string;
  icon?: string;
  tooltip?: string;
  value?: string;
  truncatedValue?: string;
  copyValue?: string;
  copyLabel: string;
  balanceType: BalanceType;
};

export type BalanceView = {
  btcFormatted: string;
  zeldFormatted: string;
  loading: boolean;
  error?: string;
};

export type ReadyView = {
  readyLabel: string;
  readyHint: string;
  rows: ReadyRowView[];
  networkLabel: string;
  network: NetworkType;
  balance?: BalanceView;
};

export type WalletOptionView = {
  id: SupportedWalletId;
  name: string;
  description: string;
  icon: string;
  installed: boolean;
  installUrl?: string;
  connectDisabled: boolean;
  connectLabel: string;
  installLabel: string;
  installedLabel: string;
};

export type WalletSwitcherView = {
  networkLabel: string;
  networkName: string;
  network: NetworkType;
  toggleLabel: string;
  open: boolean;
  options: WalletOptionView[];
};

/** Mining progress view */
export type MiningProgressView = {
  hashRateLabel: string;
  hashRateFormatted: string;
  attemptsLabel: string;
  attemptsFormatted: string;
  elapsedLabel: string;
  elapsedFormatted: string;
  stopLabel: string;
  resumeLabel: string;
  isPaused: boolean;
};

/** Mining result view */
export type MiningResultView = {
  congratsMessage: string;
  txidLabel: string;
  txid: string;
  psbt?: string;
  copyPsbtLabel: string;
  signAndBroadcastLabel: string;
  mempoolUrl?: string;
  viewOnMempoolLabel: string;
  retryLabel: string;
  cancelLabel: string;
  showSignButton: boolean;
  showMempoolLink: boolean;
};

/** Input row for confirmation dialog */
export type ConfirmDialogInputView = {
  txid: string;
  vout: number;
  address: string;
  addressTruncated: string;
  valueFormatted: string;
  valueSats: number;
};

/** Output row for confirmation dialog */
export type ConfirmDialogOutputView = {
  address: string;
  addressTruncated: string;
  valueFormatted: string;
  valueSats: number;
  isChange: boolean;
  /** Whether this is an OP_RETURN output */
  isOpReturn: boolean;
  /** Formatted OP_RETURN display string (e.g., "OP_RETURN: 12345" or "OP_RETURN: ZELD [600, 300, 100]") */
  opReturnDisplay?: string;
};

/** Confirmation dialog view */
export type ConfirmDialogView = {
  visible: boolean;
  title: string;
  inputsLabel: string;
  outputsLabel: string;
  feeLabel: string;
  totalLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  changeLabel: string;
  inputs: ConfirmDialogInputView[];
  outputs: ConfirmDialogOutputView[];
  feeFormatted: string;
  feeSats: number;
  totalInputFormatted: string;
  totalOutputFormatted: string;
};

/** Fee option for the selector */
export type FeeOptionView = {
  mode: FeeMode;
  label: string;
  rate: number;
  rateFormatted: string;
  selected: boolean;
};

export type HuntingView = {
  visible: boolean;
  sendBtcLabel: string;
  sendBtcChecked: boolean;
  sendBtcEnabled: boolean;
  sendZeldLabel: string;
  sendZeldChecked: boolean;
  sendZeldEnabled: boolean;
  zeroCountLabel: string;
  zeroCount: number;
  useGpuLabel: string;
  useGpu: boolean;
  huntLabel: string;
  huntEnabled: boolean;
  huntDisabledReason?: string;
  showSendFields: boolean;
  sendType: 'btc' | 'zeld' | null;
  addressPlaceholder: string;
  amountPlaceholder: string;
  recipientAddress: string;
  amount: string;
  addressError?: string;
  amountError?: string;
  // Fee selection
  feeLabel: string;
  feeUnitLabel: string;
  feeMode: FeeMode;
  feeOptions: FeeOptionView[];
  customFeeRate: string;
  customFeePlaceholder: string;
  showCustomFeeInput: boolean;
  feeLoading: boolean;
  feeError?: string;
  feeExpanded: boolean;
  currentFeeDisplay: string;
  // Mining state
  isMining: boolean;
  miningProgress?: MiningProgressView;
  miningResult?: MiningResultView;
  miningError?: string;
  miningStatusMessage?: string;
  // Labels for error state
  retryLabel: string;
  cancelLabel: string;
  // Confirmation dialog
  confirmDialog?: ConfirmDialogView;
};

export type WalletViewModel = {
  title: string;
  titleIcon: string;
  header: {
    actions: ActionView[];
    warnings: InlineWarningView[];
  };
  labels: {
    showPassword: string;
    hidePassword: string;
  };
  status?: StatusView;
  locked?: LockedView;
  setPasswordForm?: SetPasswordFormView;
  backupForm?: BackupFormView;
  backupResult?: BackupResultView;
  ready?: ReadyView;
  hunting?: HuntingView;
  walletSwitcher: WalletSwitcherView;
};

const sanitizeWalletIcon = (icon?: string): string => {
  if (!icon) return FALLBACK_ICON;
  const trimmed = icon.trim();
  const isDataUrl = /^data:image\//i.test(trimmed);
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  const isInlineSvg = /^<svg[\s\S]*<\/svg>$/i.test(trimmed);

  if (isInlineSvg) return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;

  if (isDataUrl) {
    const [prefix, rawBody] = trimmed.split(/,(.+)/);
    if (!rawBody) return FALLBACK_ICON;
    const alreadyEncoded = /%3Csvg/i.test(rawBody);
    const hasUnsafeChars = /[<">\s]/.test(rawBody);
    if (alreadyEncoded || !hasUnsafeChars) return trimmed;
    return `${prefix},${encodeURIComponent(rawBody)}`;
  }

  if (isHttpUrl) return trimmed;

  return FALLBACK_ICON;
};

const makeAction = (kind: ActionKind, strings: LocaleStrings): ActionView =>
  kind === 'new-backup'
    ? {
        kind,
        label: strings.newBackupHint,
        icon: '🛟',
        className: 'zeldwallet-icon-button zeldwallet-backup-button zeldwallet-new-backup-button',
      }
    : {
        kind,
        label: strings.changePasswordHint,
        icon: '🔑',
        className: 'zeldwallet-icon-button zeldwallet-change-password-button',
      };

export const buildViewModel = ({
  state,
  network,
  strings,
  showBackupWarning,
  showPasswordWarning,
  readyWithSecurity,
}: RenderTemplateProps): WalletViewModel => {
  const isExternal = state.walletKind === 'external';
  const warnings: InlineWarningView[] = [];
  if (showPasswordWarning && !isExternal) {
    warnings.push({
      type: 'password',
      tooltip: strings.setPasswordHint,
      ariaLabel: strings.noPasswordTitle,
      actions: [makeAction('change-password', strings)],
    });
  } else if (showBackupWarning && !isExternal) {
    warnings.push({
      type: 'backup',
      tooltip: strings.backupHint,
      ariaLabel: strings.noBackupTitle,
      actions: [makeAction('new-backup', strings), makeAction('change-password', strings)],
    });
  }

  const actions =
    readyWithSecurity && !isExternal ? [makeAction('new-backup', strings), makeAction('change-password', strings)] : [];

  const status: StatusView | undefined =
    state.status === 'loading'
      ? { variant: 'loading', message: strings.loading }
      : state.status === 'generating'
        ? { variant: 'loading', message: strings.generatingAddress }
        : state.status === 'recovering'
          ? { variant: 'loading', message: strings.recoveringWallet }
          : state.status === 'error'
            ? { variant: 'error', message: state.message ?? strings.error }
            : undefined;

  const locked: LockedView | undefined =
    state.status === 'locked' && !isExternal
      ? {
          lockedLabel: strings.locked,
          lockedHint: strings.lockedHint,
          passwordPlaceholder: strings.passwordPlaceholder,
          submitLabel: strings.connect,
          error: state.passwordError,
        }
      : undefined;

  const setPasswordForm: SetPasswordFormView | undefined = state.showSetPasswordForm
    ? {
        passwordPlaceholder: strings.setPasswordPlaceholder,
        confirmPlaceholder: strings.setPasswordConfirmPlaceholder,
        submitLabel: strings.setPasswordSubmit,
        cancelLabel: strings.setPasswordCancel,
        error: state.setPasswordError,
      }
    : undefined;

  const backupForm: BackupFormView | undefined = state.showBackupForm && !isExternal
    ? {
        passwordPlaceholder: strings.backupPasswordPlaceholder,
        submitLabel: strings.backupSubmit,
        cancelLabel: strings.backupCancel,
        error: state.backupError,
      }
    : undefined;

  const backupResult: BackupResultView | undefined =
    state.status === 'ready' && state.backupValue && !isExternal
      ? {
          value: state.backupValue,
          title: strings.backupGenerated,
          hint: strings.backupCopyHelp,
          copyLabel: strings.copy,
          downloadLabel: strings.download,
          cancelLabel: strings.backupCancel,
        }
      : undefined;

  const addresses = state.addresses ?? [];
  const payment = addresses.find((a) => a.purpose === 'payment');
  const ordinals = addresses.find((a) => a.purpose === 'ordinals');

  // Format balance for display
  const balanceView: BalanceView | undefined = state.balance
    ? {
        btcFormatted: formatBtc(state.balance.btcSats),
        zeldFormatted: formatZeld(state.balance.zeldBalance),
        loading: state.balance.loading,
        error: state.balance.error,
      }
    : undefined;

  const walletDescriptions: Record<SupportedWalletId, string> = {
    zeld: strings.walletDescriptionZeld,
    xverse: strings.walletDescriptionXverse,
    leather: strings.walletDescriptionLeather,
    magicEden: strings.walletDescriptionMagicEden,
  };

  const networkName = network === 'testnet' ? strings.networkTestnet : strings.networkMainnet;

  const ready: ReadyView | undefined =
    state.status === 'ready'
      ? {
          readyLabel: strings.ready,
          readyHint: strings.readyHint,
          rows: [
            {
              label: strings.paymentLabel,
              icon: BITCOIN_ICON,
              tooltip: strings.paymentTooltip,
              value: payment?.address ?? strings.noAddresses,
              truncatedValue: payment?.address ? truncateAddress(payment.address) : strings.noAddresses,
              copyValue: payment?.address,
              copyLabel: strings.copy,
              balanceType: 'btc',
            },
            {
              label: strings.ordinalsLabel,
              icon: ORDINALS_ICON,
              tooltip: strings.ordinalsTooltip,
              value: ordinals?.address ?? strings.noAddresses,
              truncatedValue: ordinals?.address ? truncateAddress(ordinals.address) : strings.noAddresses,
              copyValue: ordinals?.address,
              copyLabel: strings.copy,
              balanceType: 'zeld',
            },
          ],
          networkLabel: strings.networkLabel,
          network,
          balance: balanceView,
        }
      : undefined;

  const options = (state.walletOptions ?? []).map((opt) => ({
    ...opt,
    description: walletDescriptions[opt.id] ?? opt.description,
    icon: sanitizeWalletIcon(opt.icon),
  }));

  const filteredOptions = options.filter((opt) => opt.id !== state.activeWalletId);

  const walletSwitcher: WalletSwitcherView = {
    networkLabel: strings.networkLabel,
    networkName,
    network,
    toggleLabel: strings.walletToggleLabel,
    open: state.walletPickerOpen,
    options: filteredOptions.map((opt) => ({
      ...opt,
      connectDisabled: !opt.installed,
      connectLabel: strings.walletConnect.replace('{wallet}', opt.name),
      installLabel: strings.walletInstall,
      installedLabel: strings.walletInstalled,
    })),
  };

  const activeOption = options.find((opt) => opt.id === state.activeWalletId);
  const titleIcon = sanitizeWalletIcon(activeOption?.icon);

  // Build hunting view
  const hunting = buildHuntingView(state, strings);

  return {
    title: state.activeWalletName || strings.title,
    titleIcon,
    header: { actions, warnings },
    labels: { showPassword: strings.showPassword, hidePassword: strings.hidePassword },
    status,
    locked,
    setPasswordForm,
    backupForm,
    backupResult,
    ready,
    hunting,
    walletSwitcher,
  };
};

/**
 * Gets the display string for the current fee selection.
 */
function getCurrentFeeDisplay(
  hunting: NonNullable<ComponentState['hunting']>,
  feeModeLabels: Record<FeeMode, string>
): string {
  const recommendedFees = hunting.recommendedFees ?? { slow: 6, medium: 12, fast: 24 };
  const mode = hunting.feeMode;
  const label = feeModeLabels[mode];
  
  if (mode === 'custom') {
    const rate = parseFloat(hunting.customFeeRate.trim()) || 0;
    return rate > 0 ? `${label} (${rate})` : label;
  }
  
  const rate = recommendedFees[mode];
  return `${label} (${rate})`;
}

/**
 * Builds the hunting section view model.
 */
function buildHuntingView(state: ComponentState, strings: LocaleStrings): HuntingView | undefined {
  // Only show hunting section when wallet is ready
  if (state.status !== 'ready') {
    return undefined;
  }

  const hunting = state.hunting;
  if (!hunting) {
    return undefined;
  }

  const btcPaymentSats = state.balance?.btcPaymentSats ?? state.balance?.btcSats ?? 0;
  const btcTotalSats = state.balance?.btcSats ?? 0;
  const zeldBalance = state.balance?.zeldBalance ?? 0;

  // Thresholds
  const simpleHuntThreshold = DUST + MIN_FEE_RESERVE; // 1830 sats
  const zeldHuntThreshold = 2 * DUST + MIN_FEE_RESERVE; // 2160 sats

  // Enable conditions for checkboxes
  const sendBtcEnabled = btcPaymentSats >= simpleHuntThreshold;
  const sendZeldEnabled = zeldBalance > 0 && btcTotalSats >= zeldHuntThreshold;

  // Determine which send fields to show
  const showSendFields = hunting.sendBtcChecked || hunting.sendZeldChecked;
  const sendType = hunting.sendBtcChecked ? 'btc' : hunting.sendZeldChecked ? 'zeld' : null;

  // Calculate hunt button enabled state and reason
  const { huntEnabled, huntDisabledReason } = computeHuntEnabled(
    hunting,
    btcPaymentSats,
    btcTotalSats,
    zeldBalance,
    strings
  );

  // Build mining state views
  const isMining = hunting.miningStatus !== 'idle';
  const miningProgress = buildMiningProgressView(hunting, strings);
  const miningResult = buildMiningResultView(hunting, strings);
  
  // Status message
  let miningStatusMessage: string | undefined;
  switch (hunting.miningStatus) {
    case 'mining':
      miningStatusMessage = strings.miningStatusMining;
      break;
    case 'paused':
      miningStatusMessage = strings.miningStatusPaused;
      break;
    case 'found':
      miningStatusMessage = strings.miningStatusFound;
      break;
    case 'signing':
      miningStatusMessage = strings.miningStatusSigning;
      break;
    case 'broadcast':
      miningStatusMessage = strings.miningStatusBroadcast;
      break;
    case 'error':
      miningStatusMessage = strings.miningStatusError;
      break;
  }

  // Build fee options
  const recommendedFees = hunting.recommendedFees ?? { slow: 6, medium: 12, fast: 24 };
  const feeModeLabels: Record<FeeMode, string> = {
    slow: strings.feeModeSlow,
    medium: strings.feeModeMedium,
    fast: strings.feeModeFast,
    custom: strings.feeModeCustom,
  };

  const feeOptions: FeeOptionView[] = (['slow', 'medium', 'fast', 'custom'] as FeeMode[]).map((mode) => {
    const rate = mode === 'custom'
      ? (parseFloat(hunting.customFeeRate.trim()) || 0)
      : recommendedFees[mode];
    return {
      mode,
      label: feeModeLabels[mode],
      rate,
      rateFormatted: mode === 'custom' && !hunting.customFeeRate.trim() ? '—' : `${rate}`,
      selected: hunting.feeMode === mode,
    };
  });

  return {
    visible: true,
    sendBtcLabel: strings.huntingSendBtc,
    sendBtcChecked: hunting.sendBtcChecked,
    sendBtcEnabled,
    sendZeldLabel: strings.huntingSendZeld,
    sendZeldChecked: hunting.sendZeldChecked,
    sendZeldEnabled,
    zeroCountLabel: strings.huntingZeroCount,
    zeroCount: hunting.zeroCount,
    useGpuLabel: strings.huntingUseGpu,
    useGpu: hunting.useGpu,
    huntLabel: strings.huntingHunt,
    huntEnabled: huntEnabled && !isMining,
    huntDisabledReason: isMining ? strings.miningStatusMining : huntDisabledReason,
    showSendFields,
    sendType,
    addressPlaceholder: strings.huntingAddressPlaceholder,
    amountPlaceholder: sendType === 'zeld' ? strings.huntingAmountPlaceholderZeld : strings.huntingAmountPlaceholder,
    recipientAddress: hunting.recipientAddress,
    amount: hunting.amount,
    addressError: hunting.addressError,
    amountError: hunting.amountError,
    // Fee selection
    feeLabel: strings.feeLabel,
    feeUnitLabel: strings.feeUnitLabel,
    feeMode: hunting.feeMode,
    feeOptions,
    customFeeRate: hunting.customFeeRate,
    customFeePlaceholder: strings.feeCustomPlaceholder,
    showCustomFeeInput: hunting.feeMode === 'custom',
    feeLoading: hunting.feeLoading ?? false,
    feeError: hunting.feeError,
    feeExpanded: hunting.feeExpanded ?? false,
    currentFeeDisplay: getCurrentFeeDisplay(hunting, feeModeLabels),
    isMining,
    miningProgress,
    miningResult,
    miningError: hunting.miningError,
    miningStatusMessage,
    retryLabel: strings.miningRetry,
    cancelLabel: strings.miningCancel,
    confirmDialog: buildConfirmDialogView(hunting, strings),
  };
}

/**
 * Builds the confirmation dialog view model.
 */
function buildConfirmDialogView(
  hunting: NonNullable<ComponentState['hunting']>,
  strings: LocaleStrings
): ConfirmDialogView | undefined {
  if (!hunting.showConfirmDialog || !hunting.parsedTransaction) {
    return undefined;
  }

  const tx = hunting.parsedTransaction;

  const inputs: ConfirmDialogInputView[] = tx.inputs.map((input) => ({
    txid: input.txid,
    vout: input.vout,
    address: input.address,
    addressTruncated: truncateAddress(input.address),
    valueFormatted: formatBtc(input.value),
    valueSats: input.value,
  }));

  const outputs: ConfirmDialogOutputView[] = tx.outputs.map((output) => {
    const isOpReturn = !!output.opReturn;
    let opReturnDisplay: string | undefined;
    
    if (output.opReturn) {
      if (output.opReturn.type === 'zeld' && output.opReturn.distribution) {
        // ZELD distribution: show amounts (last element is the nonce, so exclude it)
        const amounts = output.opReturn.distribution.slice(0, -1);
        opReturnDisplay = `OP_RETURN: ZELD [${amounts.join(', ')}]`;
      } else if (output.opReturn.type === 'nonce' && output.opReturn.nonce !== undefined) {
        // Simple nonce
        opReturnDisplay = `OP_RETURN: ${output.opReturn.nonce.toString()}`;
      } else {
        opReturnDisplay = 'OP_RETURN';
      }
    }
    
    return {
      address: output.address,
      addressTruncated: isOpReturn ? (opReturnDisplay ?? 'OP_RETURN') : truncateAddress(output.address),
      valueFormatted: formatBtc(output.value),
      valueSats: output.value,
      isChange: output.isChange ?? false,
      isOpReturn,
      opReturnDisplay,
    };
  });

  return {
    visible: true,
    title: strings.confirmDialogTitle,
    inputsLabel: strings.confirmDialogInputsLabel,
    outputsLabel: strings.confirmDialogOutputsLabel,
    feeLabel: strings.confirmDialogFeeLabel,
    totalLabel: strings.confirmDialogTotalLabel,
    confirmLabel: strings.confirmDialogConfirm,
    cancelLabel: strings.confirmDialogCancel,
    changeLabel: strings.confirmDialogChangeLabel,
    inputs,
    outputs,
    feeFormatted: formatBtc(tx.fee),
    feeSats: tx.fee,
    totalInputFormatted: formatBtc(tx.totalInputValue),
    totalOutputFormatted: formatBtc(tx.totalOutputValue),
  };
}

/**
 * Computes whether the Hunt button should be enabled and the reason if disabled.
 */
function computeHuntEnabled(
  hunting: NonNullable<ComponentState['hunting']>,
  btcPaymentSats: number,
  btcTotalSats: number,
  zeldBalance: number,
  strings: LocaleStrings
): { huntEnabled: boolean; huntDisabledReason?: string } {
  const simpleHuntThreshold = DUST + MIN_FEE_RESERVE; // 1830 sats
  const zeldHuntThreshold = 2 * DUST + MIN_FEE_RESERVE; // 2160 sats

  // Case 1: Simple hunt (no checkboxes checked)
  if (!hunting.sendBtcChecked && !hunting.sendZeldChecked) {
    if (btcPaymentSats < simpleHuntThreshold) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledNoBtc };
    }
    return { huntEnabled: true };
  }

  // Case 2: Send BTC checked
  if (hunting.sendBtcChecked) {
    // Need valid address
    if (!hunting.recipientAddress.trim() || hunting.addressError) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInvalidAddress };
    }
    
    // Need valid amount
    const amountSats = parseBtcAmount(hunting.amount);
    if (amountSats <= 0 || hunting.amountError) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInvalidAmount };
    }

    // Need enough BTC: amount + DUST + MIN_FEE_RESERVE
    const requiredSats = amountSats + DUST + MIN_FEE_RESERVE;
    if (btcPaymentSats < requiredSats) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInsufficientBtc };
    }

    return { huntEnabled: true };
  }

  // Case 3: Send Zeld checked
  if (hunting.sendZeldChecked) {
    // Need valid address
    if (!hunting.recipientAddress.trim() || hunting.addressError) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInvalidAddress };
    }

    // Need valid amount
    const amountZeld = parseZeldAmount(hunting.amount);
    if (amountZeld <= 0 || hunting.amountError) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInvalidAmount };
    }

    // Need enough ZELD
    if (zeldBalance < amountZeld) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInsufficientZeld };
    }

    // Need enough BTC for 2 outputs + fees
    if (btcTotalSats < zeldHuntThreshold) {
      return { huntEnabled: false, huntDisabledReason: strings.huntingDisabledInsufficientBtc };
    }

    return { huntEnabled: true };
  }

  return { huntEnabled: true };
}

/**
 * Parses a BTC amount string to satoshis.
 */
function parseBtcAmount(amount: string): number {
  const trimmed = amount.trim();
  if (!trimmed) return 0;
  const num = parseFloat(trimmed);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100_000_000);
}

/**
 * Parses a ZELD amount string to minimal units (8 decimals like BTC).
 */
function parseZeldAmount(amount: string): number {
  const trimmed = amount.trim();
  if (!trimmed) return 0;
  const num = parseFloat(trimmed);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100_000_000);
}

/**
 * Formats hash rate to human-readable string.
 */
function formatHashRate(rate: number): string {
  if (rate >= 1_000_000_000) return `${(rate / 1_000_000_000).toFixed(2)} GH/s`;
  if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(2)} MH/s`;
  if (rate >= 1_000) return `${(rate / 1_000).toFixed(2)} kH/s`;
  return `${rate.toFixed(0)} H/s`;
}

/**
 * Formats attempts count to human-readable string.
 */
function formatAttempts(attempts: bigint): string {
  if (attempts >= 1_000_000_000n) return `${(Number(attempts) / 1_000_000_000).toFixed(2)}B`;
  if (attempts >= 1_000_000n) return `${(Number(attempts) / 1_000_000).toFixed(2)}M`;
  if (attempts >= 1_000n) return `${(Number(attempts) / 1_000).toFixed(2)}K`;
  return attempts.toString();
}

/**
 * Formats elapsed time in ms to human-readable string.
 */
function formatElapsed(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Builds the mining progress view model.
 * Shows stats during mining/paused states, and also when result is found (to display final stats).
 */
function buildMiningProgressView(
  hunting: NonNullable<ComponentState['hunting']>,
  strings: LocaleStrings
): MiningProgressView | undefined {
  // Show progress during active mining or paused
  if (hunting.miningStatus === 'mining' || hunting.miningStatus === 'paused') {
    const stats = hunting.miningStats;
    return {
      hashRateLabel: strings.miningHashRate,
      hashRateFormatted: stats ? formatHashRate(stats.hashRate) : '0 H/s',
      attemptsLabel: strings.miningAttempts,
      attemptsFormatted: stats ? formatAttempts(stats.hashesProcessed) : '0',
      elapsedLabel: strings.miningElapsed,
      elapsedFormatted: stats ? formatElapsed(stats.elapsedMs) : '0s',
      stopLabel: strings.miningStop,
      resumeLabel: strings.miningResume,
      isPaused: hunting.miningStatus === 'paused',
    };
  }

  // Also show final stats when hash is found, signing, or broadcast
  // Use miningResult for attempts/duration, and miningStats for hashRate
  if (hunting.miningStatus === 'found' || hunting.miningStatus === 'signing' || hunting.miningStatus === 'broadcast') {
    const result = hunting.miningResult;
    const stats = hunting.miningStats;
    
    // Use result data if available (more accurate final values), fallback to stats
    const attempts = result?.attempts ?? stats?.hashesProcessed ?? 0n;
    const elapsedMs = result?.duration ?? stats?.elapsedMs ?? 0;
    const hashRate = stats?.hashRate ?? (elapsedMs > 0 ? Number(attempts) / (elapsedMs / 1000) : 0);
    
    return {
      hashRateLabel: strings.miningHashRate,
      hashRateFormatted: formatHashRate(hashRate),
      attemptsLabel: strings.miningAttempts,
      attemptsFormatted: formatAttempts(typeof attempts === 'bigint' ? attempts : BigInt(attempts)),
      elapsedLabel: strings.miningElapsed,
      elapsedFormatted: formatElapsed(elapsedMs),
      stopLabel: strings.miningStop,
      resumeLabel: strings.miningResume,
      isPaused: false,
    };
  }

  return undefined;
}

/**
 * Builds the mining result view model.
 */
function buildMiningResultView(
  hunting: NonNullable<ComponentState['hunting']>,
  strings: LocaleStrings
): MiningResultView | undefined {
  if (hunting.miningStatus !== 'found' && hunting.miningStatus !== 'signing' && hunting.miningStatus !== 'broadcast') {
    return undefined;
  }

  const result = hunting.miningResult;
  const txid = result?.txid ?? '';
  const psbt = result?.psbt;
  const broadcastTxid = hunting.broadcastTxid;
  const showMempoolLink = !!broadcastTxid;
  const mempoolUrl = broadcastTxid ? `https://mempool.space/tx/${broadcastTxid}` : undefined;

  return {
    congratsMessage: strings.miningCongrats,
    txidLabel: strings.miningTxidLabel,
    txid,
    psbt,
    copyPsbtLabel: strings.miningCopyPsbt,
    signAndBroadcastLabel: strings.miningSignAndBroadcast,
    mempoolUrl,
    viewOnMempoolLabel: strings.miningViewOnMempool,
    retryLabel: strings.miningRetry,
    cancelLabel: strings.miningCancel,
    showSignButton: hunting.miningStatus === 'found',
    showMempoolLink,
  };
}

