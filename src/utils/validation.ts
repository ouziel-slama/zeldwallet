/**
 * Validation Utilities
 * 
 * Functions for validating Bitcoin addresses, mnemonics, and other data.
 */

import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { AddressPurpose, AddressType, NetworkType } from '../types';

/**
 * Validate a BIP39 mnemonic phrase
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}

/**
 * Validate that a mnemonic has the correct number of words
 */
export function isValidMnemonicLength(mnemonic: string): boolean {
  const wordCount = mnemonic.trim().split(/\s+/).length;
  return wordCount === 12 || wordCount === 24;
}

/**
 * Basic Bitcoin address format validation
 * Note: This is a basic check, not cryptographic validation
 */
export function isValidBitcoinAddress(address: string, network: NetworkType = 'mainnet'): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // P2PKH (Legacy) - starts with 1 (mainnet) or m/n (testnet)
  const p2pkhRegex = network === 'mainnet'
    ? /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/
    : /^[mn][1-9A-HJ-NP-Za-km-z]{25,34}$/;
  
  // P2SH (including nested SegWit) - starts with 3 (mainnet) or 2 (testnet)
  const p2shRegex = network === 'mainnet'
    ? /^3[1-9A-HJ-NP-Za-km-z]{25,34}$/
    : /^2[1-9A-HJ-NP-Za-km-z]{25,34}$/;
  
  // Bech32 (Native SegWit) - starts with bc1q (mainnet) or tb1q (testnet)
  const bech32Regex = network === 'mainnet'
    ? /^bc1q[0-9a-z]{38,59}$/
    : /^tb1q[0-9a-z]{38,59}$/;
  
  // Bech32m (Taproot) - starts with bc1p (mainnet) or tb1p (testnet)
  const bech32mRegex = network === 'mainnet'
    ? /^bc1p[0-9a-z]{58}$/
    : /^tb1p[0-9a-z]{58}$/;
  
  return (
    p2pkhRegex.test(address) ||
    p2shRegex.test(address) ||
    bech32Regex.test(address) ||
    bech32mRegex.test(address)
  );
}

/**
 * Detect the address type from a Bitcoin address
 */
export function detectAddressType(address: string, network: NetworkType = 'mainnet'): AddressType | null {
  if (!address) return null;
  
  const prefix = address.slice(0, 4).toLowerCase();
  
  // Taproot (bech32m)
  if (prefix === 'bc1p' || prefix === 'tb1p') {
    return 'p2tr';
  }
  
  // Native SegWit (bech32)
  if (prefix === 'bc1q' || prefix === 'tb1q') {
    return 'p2wpkh';
  }
  
  // P2SH (could be nested SegWit)
  if (network === 'mainnet' && address.startsWith('3')) {
    return 'p2sh-p2wpkh';
  }
  if (network === 'testnet' && address.startsWith('2')) {
    return 'p2sh-p2wpkh';
  }
  
  // Legacy P2PKH
  if (network === 'mainnet' && address.startsWith('1')) {
    return 'p2pkh';
  }
  if (network === 'testnet' && (address.startsWith('m') || address.startsWith('n'))) {
    return 'p2pkh';
  }
  
  return null;
}

/**
 * Validate address purpose
 */
export function isValidAddressPurpose(purpose: string): purpose is AddressPurpose {
  return ['payment', 'ordinals', 'stacks'].includes(purpose);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  // Add more checks if needed (uppercase, numbers, special chars)
  return { valid: true };
}

/**
 * Validate hex string
 */
export function isValidHex(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-fA-F]*$/.test(str) && str.length % 2 === 0;
}

/**
 * Validate base64 string
 */
export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Validate PSBT (basic format check)
 */
export function isValidPsbtBase64(psbt: string): boolean {
  if (!isValidBase64(psbt)) return false;
  try {
    const decoded = atob(psbt);
    // PSBT magic bytes: "psbt\xff"
    return decoded.startsWith('psbt\xff');
  } catch {
    return false;
  }
}

