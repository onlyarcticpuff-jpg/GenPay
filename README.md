# GenPayFrontend Wallet App

GenPayFrontend is a non-custodial crypto wallet base built with TypeScript across the stack.

## What is included

- **Web wallet:** React + TypeScript UI in `apps/web` with `.tsx` screens and local wallet actions.
- **Mobile wallet:** React Native + TypeScript app in `apps/mobile` with `.tsx` UI for on-device wallet creation and transfer previews.
- **Wallet logic:** Shared TypeScript crypto logic in `packages/wallet-core`, including mnemonic generation/import, address validation, balance lookup, transaction building, keystore helpers, and message signing.
- **Backend/indexer/API:** TypeScript Express API in `apps/api` for health checks, supported networks, balance lookup, and a minimal latest-block transaction indexer.

## Security model

GenPayFrontend is designed as a non-custodial base:

1. Recovery phrases and private keys are generated and used on the client.
2. Backend services index public chain data only.
3. The API rejects request bodies or query parameters that include mnemonic, seed phrase, private key, decrypted keystore, phrase, or password fields.
4. The API logger redacts authorization headers, cookies, token-like headers, request bodies, and query strings so accidental secrets are not emitted in backend logs.
5. The web and mobile clients do not write mnemonic, private key, decrypted keystore, or seed phrase values to browser storage or analytics/crash-reporting SDKs.
6. Production apps should add audited secure storage, biometric unlock, phishing protection, transaction simulation, and hardware wallet support before handling real funds.

## Development

```bash
npm install
npm run typecheck
npm test
npm run dev:web
npm run dev:mobile
npm run dev:api
```

## Project layout

```text
apps/
  api/      TypeScript backend/indexer/API
  mobile/   React Native + TypeScript wallet app
  web/      React + TypeScript wallet app
packages/
  wallet-core/ Shared non-custodial wallet and crypto helpers
```
