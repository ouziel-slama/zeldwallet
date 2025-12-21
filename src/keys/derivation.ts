/**
 * Key Derivation Utilities
 * 
 * BIP32/44/49/84/86 compliant key derivation paths and utilities.
 */

import type { AddressType, AddressPurpose, NetworkType } from '../types';

/** Derivation path templates for different address types */
export const DERIVATION_PATHS = {
  /** BIP44 - Legacy P2PKH (m/44'/0'/account'/change/index) */
  legacy: "m/44'/0'/0'",
  /** BIP49 - Nested SegWit P2SH-P2WPKH (m/49'/0'/account'/change/index) */
  nestedSegwit: "m/49'/0'/0'",
  /** BIP84 - Native SegWit P2WPKH (m/84'/0'/account'/change/index) */
  nativeSegwit: "m/84'/0'/0'",
  /** BIP86 - Taproot P2TR (m/86'/0'/account'/change/index) */
  taproot: "m/86'/0'/0'",
} as const;

/** Testnet derivation paths (coin type 1) */
export const TESTNET_DERIVATION_PATHS = {
  legacy: "m/44'/1'/0'",
  nestedSegwit: "m/49'/1'/0'",
  nativeSegwit: "m/84'/1'/0'",
  taproot: "m/86'/1'/0'",
} as const;

export type DerivationPathType = keyof typeof DERIVATION_PATHS;

/** Type for derivation path maps */
export type DerivationPathMap = {
  readonly legacy: string;
  readonly nestedSegwit: string;
  readonly nativeSegwit: string;
  readonly taproot: string;
};

/**
 * Get derivation paths for the specified network
 */
export function getDerivationPaths(network: NetworkType): DerivationPathMap {
  return network === 'mainnet' ? DERIVATION_PATHS : TESTNET_DERIVATION_PATHS;
}

/**
 * Map address type to derivation path type
 */
export function addressTypeToPathType(addressType: AddressType): DerivationPathType {
  switch (addressType) {
    case 'p2pkh':
      return 'legacy';
    case 'p2sh-p2wpkh':
      return 'nestedSegwit';
    case 'p2wpkh':
      return 'nativeSegwit';
    case 'p2tr':
      return 'taproot';
  }
}

/**
 * Map derivation path type to address type
 */
export function pathTypeToAddressType(pathType: DerivationPathType): AddressType {
  switch (pathType) {
    case 'legacy':
      return 'p2pkh';
    case 'nestedSegwit':
      return 'p2sh-p2wpkh';
    case 'nativeSegwit':
      return 'p2wpkh';
    case 'taproot':
      return 'p2tr';
  }
}

/**
 * Get the address type to use for a given purpose
 */
export function purposeToAddressType(purpose: AddressPurpose): AddressType {
  switch (purpose) {
    case 'payment':
      // Native SegWit for payments (lower fees)
      return 'p2wpkh';
    case 'ordinals':
      // Taproot for ordinals (required for inscriptions)
      return 'p2tr';
    case 'stacks':
      // Native SegWit for Stacks
      return 'p2wpkh';
  }
}

/**
 * Build a full derivation path
 */
export function buildDerivationPath(
  pathType: DerivationPathType,
  network: NetworkType,
  account: number = 0,
  change: 0 | 1 = 0,
  index: number = 0
): string {
  const paths = getDerivationPaths(network);
  const basePath = paths[pathType];
  
  // Replace account number in the base path
  const accountPath = basePath.replace(/\/0'$/, `/${account}'`);
  
  return `${accountPath}/${change}/${index}`;
}

/**
 * Parse a derivation path string
 */
export function parseDerivationPath(path: string): {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  index: number;
} | null {
  const regex = /^m\/(\d+)'\/(\d+)'\/(\d+)'\/(\d+)\/(\d+)$/;
  const match = path.match(regex);
  
  if (!match) return null;
  
  return {
    purpose: parseInt(match[1], 10),
    coinType: parseInt(match[2], 10),
    account: parseInt(match[3], 10),
    change: parseInt(match[4], 10),
    index: parseInt(match[5], 10),
  };
}

