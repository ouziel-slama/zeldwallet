import type { NetworkType } from '../types';
import { getStrings, type LocaleKey } from './i18n';

export const describeError = (error: unknown, locale: LocaleKey): string => {
  const strings = getStrings(locale);
  const code = (error as { code?: string })?.code;
  const expectedNetwork = (error as { expected?: NetworkType })?.expected;

  if (code === 'wrong-network') {
    const networkLabel =
      expectedNetwork === 'mainnet'
        ? 'Mainnet'
        : expectedNetwork === 'testnet'
          ? 'Testnet'
          : expectedNetwork ?? 'the right network';
    return strings.wrongNetwork.replace('{network}', String(networkLabel));
  }

  if (!error) return strings.error;
  if (error instanceof Error) return error.message || strings.error;
  if (typeof error === 'string') return error;
  return strings.error;
};

export const isPasswordRequiredError = (error: unknown, locale: LocaleKey): boolean => {
  const message = describeError(error, locale).toLowerCase();
  return message.includes('password required') || message.includes('unlock storage');
};

export const isWrongPasswordError = (error: unknown, locale: LocaleKey): boolean => {
  const message = describeError(error, locale).toLowerCase();
  return message.includes('incorrect') || message.includes('decryption failed');
};

