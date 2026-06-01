import { describe, expect, it } from 'vitest';
import {
  accountFromMnemonic,
  buildNativeTransfer,
  createRandomAccount,
  normalizeAddress,
} from './index.js';

const phrase = 'test test test test test test test test test test test junk';

describe('wallet-core', () => {
  it('creates a random non-custodial account with a recovery phrase', () => {
    const account = createRandomAccount();

    expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(account.phrase?.split(' ')).toHaveLength(12);
  });

  it('derives the canonical first test account from a mnemonic', () => {
    const account = accountFromMnemonic(phrase);

    expect(account.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('normalizes addresses and builds native transfers', () => {
    const to = normalizeAddress('0x000000000000000000000000000000000000dEaD');
    const tx = buildNativeTransfer({ to, amount: '0.01' });

    expect(tx.to).toBe('0x000000000000000000000000000000000000dEaD');
    expect(tx.value?.toString()).toBe('10000000000000000');
  });
});
