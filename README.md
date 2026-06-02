# GenPay

A clean, buildable non-custodial wallet base using React and TypeScript.

## What this base does

- Creates wallet secret material locally in the browser.
- Derives a deterministic public wallet id from the local secret.
- Encrypts the local wallet secret with a user password before writing it to browser storage.
- Restores the encrypted wallet with the password.
- Keeps all wallet logic in `src/wallet.ts` and UI in `.tsx` files.

## Security model

GenPay is non-custodial: plaintext secret material is generated, encrypted, decrypted, and used only in the browser. No backend, analytics, or crash reporting integration is included. The app only stores encrypted wallet data under `localStorage` key `genpay.encryptedWallet.v1`.

This is a starter base. Add audited wallet/key derivation, real chain adapters, secure device storage, transaction signing, and professional security review before handling real funds.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run dev
```
