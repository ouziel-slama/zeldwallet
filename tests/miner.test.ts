/**
 * Miner Preparation Tests
 *
 * Tests for the miner preparation helper functions.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import {
  addressToScriptPubKey,
  prepareMinerArgs,
  prepareSimpleHunt,
  prepareBtcSendHunt,
  prepareZeldSendHunt,
  MinerError,
  DUST,
  MIN_FEE_RESERVE,
  type UtxoInfo,
  type OrdinalsUtxo,
} from '../src/component/miner';

// Initialize ECC library for Taproot address support
beforeAll(() => {
  bitcoin.initEccLib(ecc);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

// Mainnet addresses
const PAYMENT_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const ORDINALS_ADDRESS = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297';
const RECIPIENT_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

// Testnet addresses
const TESTNET_PAYMENT = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
const TESTNET_ORDINALS = 'tb1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusqdqnud';

// Helper to create confirmed UTXO
function createUtxo(value: number, txid = 'a'.repeat(64), vout = 0): UtxoInfo {
  return {
    txid,
    vout,
    value,
    status: { confirmed: true, block_height: 800000 },
  };
}

// Helper to create confirmed UTXO with Zeld balance
function createOrdinalsUtxo(
  value: number,
  zeldBalance: number,
  txid = 'b'.repeat(64),
  vout = 0
): OrdinalsUtxo {
  return {
    txid,
    vout,
    value,
    zeldBalance,
    status: { confirmed: true, block_height: 800000 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// addressToScriptPubKey Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('addressToScriptPubKey', () => {
  it('should convert P2WPKH mainnet address to scriptPubKey', () => {
    // bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
    const scriptPubKey = addressToScriptPubKey(PAYMENT_ADDRESS, 'mainnet');
    expect(scriptPubKey).toMatch(/^[0-9a-f]+$/i);
    // P2WPKH starts with 0014 (OP_0 + 20-byte push)
    expect(scriptPubKey.startsWith('0014')).toBe(true);
    expect(scriptPubKey.length).toBe(44); // 22 bytes = 44 hex chars
  });

  it('should convert P2TR mainnet address to scriptPubKey', () => {
    // bc1p... (Taproot)
    const scriptPubKey = addressToScriptPubKey(ORDINALS_ADDRESS, 'mainnet');
    expect(scriptPubKey).toMatch(/^[0-9a-f]+$/i);
    // P2TR starts with 5120 (OP_1 + 32-byte push)
    expect(scriptPubKey.startsWith('5120')).toBe(true);
    expect(scriptPubKey.length).toBe(68); // 34 bytes = 68 hex chars
  });

  it('should convert testnet addresses correctly', () => {
    const scriptPubKey = addressToScriptPubKey(TESTNET_PAYMENT, 'testnet');
    expect(scriptPubKey).toMatch(/^[0-9a-f]+$/i);
    expect(scriptPubKey.startsWith('0014')).toBe(true);
  });

  it('should throw for invalid address', () => {
    expect(() => addressToScriptPubKey('invalid-address', 'mainnet')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareSimpleHunt Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('prepareSimpleHunt', () => {
  const minRequired = 2 * DUST; // 660 sats

  it('should select the smallest viable UTXO', () => {
    const paymentUtxos: UtxoInfo[] = [
      createUtxo(5000, 'a'.repeat(64), 0),
      createUtxo(1000, 'b'.repeat(64), 0), // Smallest viable (> 660)
      createUtxo(10000, 'c'.repeat(64), 0),
    ];

    const result = prepareSimpleHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      6,
      true,
      'mainnet'
    );

    expect(result.inputs).toHaveLength(1);
    expect(result.inputs[0].txid).toBe('b'.repeat(64));
    expect(result.inputs[0].amount).toBe(1000);
  });

  it('should skip UTXOs that are too small', () => {
    const paymentUtxos: UtxoInfo[] = [
      createUtxo(500, 'a'.repeat(64), 0), // Too small (< 660)
      createUtxo(600, 'b'.repeat(64), 0), // Too small (< 660)
      createUtxo(1000, 'c'.repeat(64), 0), // Viable (> 660)
    ];

    const result = prepareSimpleHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      6,
      true,
      'mainnet'
    );

    expect(result.inputs).toHaveLength(1);
    expect(result.inputs[0].txid).toBe('c'.repeat(64));
  });

  it('should create correct outputs', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    const result = prepareSimpleHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      7,
      false,
      'mainnet'
    );

    expect(result.outputs).toHaveLength(2);

    // First output: Ordinals with DUST
    expect(result.outputs[0].address).toBe(ORDINALS_ADDRESS);
    expect(result.outputs[0].amount).toBe(DUST);
    expect(result.outputs[0].change).toBe(false);

    // Second output: Payment change
    expect(result.outputs[1].address).toBe(PAYMENT_ADDRESS);
    expect(result.outputs[1].amount).toBeUndefined();
    expect(result.outputs[1].change).toBe(true);
  });

  it('should pass through targetZeros and useGpu', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    const result = prepareSimpleHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      8,
      false,
      'mainnet'
    );

    expect(result.targetZeros).toBe(8);
    expect(result.useGpu).toBe(false);
  });

  it('should not include distribution for simple hunt', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    const result = prepareSimpleHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      6,
      true,
      'mainnet'
    );

    expect(result.distribution).toBeUndefined();
  });

  it('should throw MinerError when no viable UTXO exists', () => {
    const paymentUtxos: UtxoInfo[] = [
      createUtxo(500), // Too small (< 660)
      createUtxo(300), // Too small (< 660)
    ];

    expect(() =>
      prepareSimpleHunt(PAYMENT_ADDRESS, paymentUtxos, ORDINALS_ADDRESS, 6, true, 'mainnet')
    ).toThrow(MinerError);
  });

  it('should throw MinerError for empty UTXO list', () => {
    expect(() =>
      prepareSimpleHunt(PAYMENT_ADDRESS, [], ORDINALS_ADDRESS, 6, true, 'mainnet')
    ).toThrow(MinerError);
  });

  it('should skip unconfirmed UTXOs', () => {
    const unconfirmedUtxo: UtxoInfo = {
      txid: 'a'.repeat(64),
      vout: 0,
      value: 10000,
      status: { confirmed: false },
    };
    const paymentUtxos: UtxoInfo[] = [unconfirmedUtxo];

    expect(() =>
      prepareSimpleHunt(PAYMENT_ADDRESS, paymentUtxos, ORDINALS_ADDRESS, 6, true, 'mainnet')
    ).toThrow(MinerError);
  });

  it('should generate valid scriptPubKey in input', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    const result = prepareSimpleHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      6,
      true,
      'mainnet'
    );

    expect(result.inputs[0].scriptPubKey).toMatch(/^[0-9a-f]+$/i);
    expect(result.inputs[0].scriptPubKey.startsWith('0014')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareBtcSendHunt Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('prepareBtcSendHunt', () => {
  it('should select enough UTXOs to cover amount + DUST + MIN_FEE_RESERVE', () => {
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 50000 }; // 50000 sats
    const minRequired = 50000 + DUST + MIN_FEE_RESERVE; // 51830 sats

    const paymentUtxos: UtxoInfo[] = [
      createUtxo(30000, 'a'.repeat(64), 0),
      createUtxo(25000, 'b'.repeat(64), 0),
      createUtxo(10000, 'c'.repeat(64), 0),
    ];

    const result = prepareBtcSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      btcOutput,
      6,
      true,
      'mainnet'
    );

    // Should select the two largest (30000 + 25000 = 55000 >= 51830)
    expect(result.inputs).toHaveLength(2);
    expect(result.inputs[0].txid).toBe('a'.repeat(64)); // Largest first
    expect(result.inputs[1].txid).toBe('b'.repeat(64));
  });

  it('should use greedy selection (largest first)', () => {
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 10000 };
    const minRequired = 10000 + DUST + MIN_FEE_RESERVE; // 11830 sats

    const paymentUtxos: UtxoInfo[] = [
      createUtxo(5000, 'a'.repeat(64), 0),
      createUtxo(20000, 'b'.repeat(64), 0), // Largest, covers everything
      createUtxo(3000, 'c'.repeat(64), 0),
    ];

    const result = prepareBtcSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      btcOutput,
      6,
      true,
      'mainnet'
    );

    expect(result.inputs).toHaveLength(1);
    expect(result.inputs[0].txid).toBe('b'.repeat(64));
  });

  it('should create correct outputs', () => {
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 50000 };
    const paymentUtxos: UtxoInfo[] = [createUtxo(100000)];

    const result = prepareBtcSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      btcOutput,
      6,
      true,
      'mainnet'
    );

    expect(result.outputs).toHaveLength(3);

    // Output 1: Ordinals with DUST
    expect(result.outputs[0].address).toBe(ORDINALS_ADDRESS);
    expect(result.outputs[0].amount).toBe(DUST);
    expect(result.outputs[0].change).toBe(false);

    // Output 2: BTC recipient
    expect(result.outputs[1].address).toBe(RECIPIENT_ADDRESS);
    expect(result.outputs[1].amount).toBe(50000);
    expect(result.outputs[1].change).toBe(false);

    // Output 3: BTC change
    expect(result.outputs[2].address).toBe(PAYMENT_ADDRESS);
    expect(result.outputs[2].change).toBe(true);
  });

  it('should not include distribution', () => {
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 50000 };
    const paymentUtxos: UtxoInfo[] = [createUtxo(100000)];

    const result = prepareBtcSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      btcOutput,
      6,
      true,
      'mainnet'
    );

    expect(result.distribution).toBeUndefined();
  });

  it('should throw MinerError when not enough funds', () => {
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 100000 };
    const paymentUtxos: UtxoInfo[] = [
      createUtxo(30000),
      createUtxo(20000),
    ]; // Total: 50000, need > 101830

    expect(() =>
      prepareBtcSendHunt(
        PAYMENT_ADDRESS,
        paymentUtxos,
        ORDINALS_ADDRESS,
        btcOutput,
        6,
        true,
        'mainnet'
      )
    ).toThrow(MinerError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareZeldSendHunt Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('prepareZeldSendHunt', () => {
  const minBtcRequired = 2 * DUST + MIN_FEE_RESERVE; // 2160 sats

  it('should select ordinals UTXOs to cover Zeld amount', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 500_00000000 }; // 500 Zeld
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(1000, 300_00000000, 'a'.repeat(64), 0),
      createOrdinalsUtxo(1000, 400_00000000, 'b'.repeat(64), 0), // Largest Zeld
      createOrdinalsUtxo(1000, 100_00000000, 'c'.repeat(64), 0),
    ];
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    const result = prepareZeldSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      zeldOutput,
      6,
      true,
      'mainnet'
    );

    // Should select b (400) and a (300) to cover 500
    expect(result.inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('should add payment UTXOs if ordinals BTC is insufficient', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 }; // 100 Zeld
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(500, 200_00000000, 'a'.repeat(64), 0), // 500 sats BTC, 200 Zeld
    ];
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000, 'p'.repeat(64), 0)];

    const result = prepareZeldSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      zeldOutput,
      6,
      true,
      'mainnet'
    );

    // Should include both ordinals UTXO and payment UTXO
    const txids = result.inputs.map((i) => i.txid);
    expect(txids).toContain('a'.repeat(64));
    expect(txids).toContain('p'.repeat(64));
  });

  it('should create correct outputs with 3 destinations', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 };
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(3000, 200_00000000),
    ];
    const paymentUtxos: UtxoInfo[] = [];

    const result = prepareZeldSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      zeldOutput,
      6,
      true,
      'mainnet'
    );

    expect(result.outputs).toHaveLength(3);

    // Output 1: Ordinals (Zeld change)
    expect(result.outputs[0].address).toBe(ORDINALS_ADDRESS);
    expect(result.outputs[0].amount).toBe(DUST);
    expect(result.outputs[0].change).toBe(false);

    // Output 2: Zeld recipient
    expect(result.outputs[1].address).toBe(RECIPIENT_ADDRESS);
    expect(result.outputs[1].amount).toBe(DUST);
    expect(result.outputs[1].change).toBe(false);

    // Output 3: BTC change
    expect(result.outputs[2].address).toBe(PAYMENT_ADDRESS);
    expect(result.outputs[2].change).toBe(true);
  });

  it('should calculate correct distribution', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 }; // 100 Zeld
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(3000, 350_00000000), // 350 Zeld
    ];
    const paymentUtxos: UtxoInfo[] = [];

    const result = prepareZeldSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      zeldOutput,
      6,
      true,
      'mainnet'
    );

    expect(result.distribution).toBeDefined();
    expect(result.distribution).toHaveLength(3);
    // change_zeld = 350 - 100 = 250
    expect(result.distribution![0]).toBe(BigInt(250_00000000));
    // zeld_output.amount = 100
    expect(result.distribution![1]).toBe(BigInt(100_00000000));
    // BTC change output receives 0 Zeld
    expect(result.distribution![2]).toBe(0n);
  });

  it('should throw MinerError when not enough Zeld', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 1000_00000000 }; // 1000 Zeld
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(3000, 100_00000000), // Only 100 Zeld
    ];
    const paymentUtxos: UtxoInfo[] = [createUtxo(10000)];

    expect(() =>
      prepareZeldSendHunt(
        PAYMENT_ADDRESS,
        paymentUtxos,
        ORDINALS_ADDRESS,
        ordinalsUtxos,
        zeldOutput,
        6,
        true,
        'mainnet'
      )
    ).toThrow(MinerError);
  });

  it('should throw MinerError when not enough BTC', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 };
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(100, 200_00000000), // 100 sats only
    ];
    const paymentUtxos: UtxoInfo[] = []; // No payment UTXOs

    expect(() =>
      prepareZeldSendHunt(
        PAYMENT_ADDRESS,
        paymentUtxos,
        ORDINALS_ADDRESS,
        ordinalsUtxos,
        zeldOutput,
        6,
        true,
        'mainnet'
      )
    ).toThrow(MinerError);
  });

  it('should use remaining ordinals UTXOs before payment UTXOs for BTC', () => {
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 };
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(500, 200_00000000, 'a'.repeat(64), 0), // Selected for Zeld
      createOrdinalsUtxo(2000, 0, 'b'.repeat(64), 0), // No Zeld, but has BTC
    ];
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000, 'p'.repeat(64), 0)];

    const result = prepareZeldSendHunt(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      zeldOutput,
      6,
      true,
      'mainnet'
    );

    // Should include ordinals UTXOs first
    const txids = result.inputs.map((i) => i.txid);
    expect(txids).toContain('a'.repeat(64));
    expect(txids).toContain('b'.repeat(64));
    // Total BTC: 500 + 2000 = 2500 >= 2160, so no need for payment UTXO
    expect(txids).not.toContain('p'.repeat(64));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prepareMinerArgs (Main Entry Point) Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('prepareMinerArgs', () => {
  it('should dispatch to prepareSimpleHunt when no outputs provided', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];
    const ordinalsUtxos: OrdinalsUtxo[] = [];

    const result = prepareMinerArgs(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      6,
      true,
      undefined,
      undefined,
      'mainnet'
    );

    expect(result.outputs).toHaveLength(2);
    expect(result.distribution).toBeUndefined();
  });

  it('should dispatch to prepareBtcSendHunt when btcOutput provided', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(100000)];
    const ordinalsUtxos: OrdinalsUtxo[] = [];
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 50000 };

    const result = prepareMinerArgs(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      6,
      true,
      btcOutput,
      undefined,
      'mainnet'
    );

    expect(result.outputs).toHaveLength(3);
    expect(result.outputs[1].amount).toBe(50000);
    expect(result.distribution).toBeUndefined();
  });

  it('should dispatch to prepareZeldSendHunt when zeldOutput provided', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(3000, 500_00000000),
    ];
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 };

    const result = prepareMinerArgs(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      6,
      true,
      undefined,
      zeldOutput,
      'mainnet'
    );

    expect(result.outputs).toHaveLength(3);
    expect(result.distribution).toBeDefined();
    expect(result.distribution).toHaveLength(3);
  });

  it('should prioritize zeldOutput over btcOutput if both provided', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];
    const ordinalsUtxos: OrdinalsUtxo[] = [
      createOrdinalsUtxo(3000, 500_00000000),
    ];
    const btcOutput = { address: RECIPIENT_ADDRESS, amount: 50000 };
    const zeldOutput = { address: RECIPIENT_ADDRESS, amount: 100_00000000 };

    const result = prepareMinerArgs(
      PAYMENT_ADDRESS,
      paymentUtxos,
      ORDINALS_ADDRESS,
      ordinalsUtxos,
      6,
      true,
      btcOutput,
      zeldOutput,
      'mainnet'
    );

    // Zeld output takes priority, so distribution should be set
    expect(result.distribution).toBeDefined();
  });

  it('should throw for invalid targetZeros (too low)', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    expect(() =>
      prepareMinerArgs(
        PAYMENT_ADDRESS,
        paymentUtxos,
        ORDINALS_ADDRESS,
        [],
        5, // Invalid: < 6
        true,
        undefined,
        undefined,
        'mainnet'
      )
    ).toThrow(MinerError);
  });

  it('should throw for invalid targetZeros (too high)', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    expect(() =>
      prepareMinerArgs(
        PAYMENT_ADDRESS,
        paymentUtxos,
        ORDINALS_ADDRESS,
        [],
        11, // Invalid: > 10
        true,
        undefined,
        undefined,
        'mainnet'
      )
    ).toThrow(MinerError);
  });

  it('should work with testnet network', () => {
    const paymentUtxos: UtxoInfo[] = [createUtxo(5000)];

    const result = prepareMinerArgs(
      TESTNET_PAYMENT,
      paymentUtxos,
      TESTNET_ORDINALS,
      [],
      6,
      true,
      undefined,
      undefined,
      'testnet'
    );

    expect(result.inputs[0].scriptPubKey).toMatch(/^0014/); // P2WPKH prefix
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('DUST should be 330 sats', () => {
    expect(DUST).toBe(330);
  });

  it('MIN_FEE_RESERVE should be 1500 sats', () => {
    expect(MIN_FEE_RESERVE).toBe(1500);
  });
});

