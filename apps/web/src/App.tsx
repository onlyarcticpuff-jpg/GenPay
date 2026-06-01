import { useMemo, useState } from 'react';
import {
  DEFAULT_NETWORKS,
  WalletAccount,
  buildNativeTransfer,
  createRandomAccount,
  getNativeBalance,
  requestBrowserWalletAddress,
  signMessageWithMnemonic,
} from '@genpay/wallet-core';

const recoveryWarning = 'GenPay never sends your recovery phrase to a server. Store it offline before funding this wallet.';

export function App() {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [password, setPassword] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [message, setMessage] = useState('Pay with GenPay');
  const [output, setOutput] = useState('Create or connect a wallet to begin.');
  const network = useMemo(() => DEFAULT_NETWORKS[0], []);

  const createWallet = () => {
    const nextAccount = createRandomAccount();
    setAccount(nextAccount);
    setOutput(`Wallet created locally: ${nextAccount.address}`);
  };

  const connectInjectedWallet = async () => {
    const address = await requestBrowserWalletAddress();
    setAccount({ address, publicKey: 'managed-by-injected-wallet' });
    setOutput(`Connected browser wallet: ${address}`);
  };

  const checkBalance = async () => {
    if (!account) {
      setOutput('Create or connect a wallet first.');
      return;
    }

    const balance = await getNativeBalance(account.address, network);
    setOutput(`${balance.formatted} ${balance.symbol} on ${network.name}`);
  };

  const previewTransfer = () => {
    const tx = buildNativeTransfer({ to: recipient, amount });
    setOutput(JSON.stringify({ ...tx, value: tx.value?.toString() }, null, 2));
  };

  const signDemoMessage = async () => {
    if (!account?.phrase) {
      setOutput('Only locally generated wallets can sign this demo message.');
      return;
    }

    const signature = await signMessageWithMnemonic(account.phrase, message);
    setOutput(signature);
  };

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">GenPayFrontend</p>
        <h1>Non-custodial crypto wallet base</h1>
        <p>
          A TypeScript + React starter for local key generation, recovery phrase handling,
          network balance checks, transfer previews, and injected wallet connection.
        </p>
        <div className="actions">
          <button onClick={createWallet}>Create local wallet</button>
          <button className="secondary" onClick={connectInjectedWallet}>Connect browser wallet</button>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Wallet</h2>
          <p className="label">Active address</p>
          <code>{account?.address ?? 'No wallet selected'}</code>
          {account?.phrase && (
            <div className="warning">
              <strong>Recovery phrase</strong>
              <p>{recoveryWarning}</p>
              <code>{account.phrase}</code>
            </div>
          )}
          <label>
            Local password placeholder
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Used by wallet-core keystore helpers"
            />
          </label>
        </article>

        <article className="card">
          <h2>Network</h2>
          <p>{network.name}</p>
          <button onClick={checkBalance}>Check native balance</button>
        </article>

        <article className="card">
          <h2>Transfer preview</h2>
          <label>
            Recipient
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} />
          </label>
          <label>
            Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <button onClick={previewTransfer}>Build transaction</button>
        </article>

        <article className="card">
          <h2>Sign message</h2>
          <label>
            Message
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button onClick={signDemoMessage}>Sign locally</button>
        </article>
      </section>

      <section className="console">
        <h2>Output</h2>
        <pre>{output}</pre>
        <small>Password length: {password.length}. Keystore encryption is exposed in wallet-core for the next persistence step.</small>
      </section>
    </main>
  );
}
