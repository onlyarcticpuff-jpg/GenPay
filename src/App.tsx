import { useEffect, useMemo, useState } from 'react';
import {
  clearEncryptedWallet,
  createLocalWallet,
  createTransferPreview,
  decryptWallet,
  encryptWallet,
  loadEncryptedWallet,
  saveEncryptedWallet,
} from './wallet';
import type { EncryptedWallet, LocalWallet } from './wallet';

export function App() {
  const [password, setPassword] = useState('');
  const [wallet, setWallet] = useState<LocalWallet | null>(null);
  const [encryptedWallet, setEncryptedWallet] = useState<EncryptedWallet | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('10.00');
  const [memo, setMemo] = useState('');
  const [message, setMessage] = useState('Create or restore a wallet to begin.');

  const maskedRecoverySecret = useMemo(() => {
    if (!wallet) {
      return 'No decrypted wallet in memory';
    }

    return `${wallet.recoverySecret.slice(0, 8)}••••••••${wallet.recoverySecret.slice(-8)}`;
  }, [wallet]);

  useEffect(() => {
    try {
      setEncryptedWallet(loadEncryptedWallet());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load wallet.');
    }
  }, []);

  const handleCreateWallet = async () => {
    try {
      const nextWallet = await createLocalWallet();
      const nextEncryptedWallet = await encryptWallet(nextWallet, password);

      saveEncryptedWallet(nextEncryptedWallet);
      setWallet(nextWallet);
      setEncryptedWallet(nextEncryptedWallet);
      setMessage('Wallet created locally and saved encrypted in this browser.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create wallet.');
    }
  };

  const handleUnlockWallet = async () => {
    try {
      if (!encryptedWallet) {
        setMessage('No encrypted wallet found in this browser.');
        return;
      }

      const unlockedWallet = await decryptWallet(encryptedWallet, password);
      setWallet(unlockedWallet);
      setMessage('Wallet decrypted locally and loaded into memory.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not unlock wallet.');
    }
  };

  const handleLockWallet = () => {
    setWallet(null);
    setMessage('Wallet locked. Encrypted wallet data remains in browser storage.');
  };

  const handleForgetWallet = () => {
    clearEncryptedWallet();
    setWallet(null);
    setEncryptedWallet(null);
    setMessage('Encrypted wallet removed from this browser.');
  };

  const handlePreviewTransfer = () => {
    try {
      if (!wallet) {
        setMessage('Unlock or create a wallet before previewing a transfer.');
        return;
      }

      const preview = createTransferPreview(wallet.publicAddress, recipient, amount, memo);
      setMessage(JSON.stringify(preview, null, 2));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not preview transfer.');
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">GenPay</p>
        <h1>Clean non-custodial wallet base</h1>
        <p>
          Create a local wallet, encrypt it with a password, restore it from encrypted browser
          storage, and preview a payment without sending secret material anywhere.
        </p>
      </section>

      <section className="grid">
        <article className="card wallet-card">
          <div className="card-heading">
            <h2>Wallet</h2>
            <span className={wallet ? 'status unlocked' : 'status'}>{wallet ? 'Unlocked' : 'Locked'}</span>
          </div>

          <label>
            Wallet password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <div className="button-row">
            <button onClick={handleCreateWallet}>Create encrypted wallet</button>
            <button className="secondary" onClick={handleUnlockWallet} disabled={!encryptedWallet}>
              Unlock saved wallet
            </button>
          </div>

          <div className="button-row">
            <button className="secondary" onClick={handleLockWallet} disabled={!wallet}>
              Lock
            </button>
            <button className="danger" onClick={handleForgetWallet} disabled={!encryptedWallet}>
              Forget encrypted wallet
            </button>
          </div>

          <dl>
            <dt>Public wallet id</dt>
            <dd>{wallet?.publicAddress ?? encryptedWallet?.publicAddress ?? 'No wallet yet'}</dd>
            <dt>Recovery secret</dt>
            <dd>{maskedRecoverySecret}</dd>
            <dt>Storage</dt>
            <dd>{encryptedWallet ? 'Encrypted wallet saved locally' : 'Nothing saved'}</dd>
          </dl>
        </article>

        <article className="card">
          <h2>Payment preview</h2>
          <p className="muted">This creates a local preview only. Add a chain adapter before signing real transactions.</p>

          <label>
            Recipient wallet id
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="gen_..." />
          </label>

          <label>
            Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
          </label>

          <label>
            Memo
            <textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Optional" />
          </label>

          <button onClick={handlePreviewTransfer}>Preview transfer</button>
        </article>
      </section>

      <section className="console">
        <h2>Output</h2>
        <pre>{message}</pre>
      </section>
    </main>
  );
}
