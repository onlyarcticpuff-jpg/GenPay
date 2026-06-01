import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import pinoHttp from 'pino-http';
import { Block, JsonRpcProvider, TransactionResponse } from 'ethers';
import { DEFAULT_NETWORKS, NetworkConfig, getNativeBalance, normalizeAddress } from '@genpay/wallet-core';

type IndexedTransaction = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: number | null;
};

const app = express();
const port = Number(process.env.PORT ?? 8787);
const configuredRpcUrl = process.env.RPC_URL;
const network: NetworkConfig = configuredRpcUrl
  ? { ...DEFAULT_NETWORKS[0], rpcUrl: configuredRpcUrl }
  : DEFAULT_NETWORKS[0];
const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
const indexedTransactions = new Map<string, IndexedTransaction[]>();
const sensitiveFieldPattern = /(mnemonic|seed|seedPhrase|recoveryPhrase|privateKey|decryptedKeystore|phrase|password)/i;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(rejectSensitivePayloads);
app.use(pinoHttp({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers.x-api-key',
      'req.headers.x-access-token',
      'req.body',
      'res.headers.set-cookie',
    ],
    remove: true,
  },
  serializers: {
    req(request: {
      id?: string | number;
      method?: string;
      remoteAddress?: string;
      remotePort?: number;
      url?: string;
    }) {
      return {
        id: request.id,
        method: request.method,
        remoteAddress: request.remoteAddress,
        remotePort: request.remotePort,
        url: stripQueryString(request.url),
      };
    },
  },
}));

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'genpay-api', network: network.name });
});

app.get('/networks', (_request, response) => {
  response.json(DEFAULT_NETWORKS);
});

app.get('/wallet/:address/balance', async (request, response, next) => {
  try {
    const balance = await getNativeBalance(request.params.address, network);
    response.json(balance);
  } catch (error) {
    next(error);
  }
});

app.get('/wallet/:address/transactions', (request, response, next) => {
  try {
    const address = normalizeAddress(request.params.address);
    response.json(indexedTransactions.get(address.toLowerCase()) ?? []);
  } catch (error) {
    next(error);
  }
});

app.post('/indexer/sync-latest', async (_request, response, next) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, true);
    const indexedCount = block ? indexBlock(block) : 0;

    response.json({ blockNumber, indexedCount });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown API error';
  response.status(400).json({ error: message });
});

function stripQueryString(url = ''): string {
  return url.split('?')[0];
}

function rejectSensitivePayloads(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
): void {
  if (containsSensitiveField(request.query) || containsSensitiveField(request.body)) {
    response.status(400).json({
      error: 'Sensitive wallet secret material must stay on the client and cannot be sent to the API.',
    });
    return;
  }

  next();
}

function containsSensitiveField(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (sensitiveFieldPattern.test(key) || containsSensitiveField(nestedValue)) {
      return true;
    }
  }

  return false;
}

function indexBlock(block: Block): number {
  let count = 0;

  for (const tx of block.prefetchedTransactions) {
    indexTransaction(tx);
    count += 1;
  }

  return count;
}

function indexTransaction(tx: TransactionResponse): void {
  const record: IndexedTransaction = {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    blockNumber: tx.blockNumber,
  };

  appendTransaction(tx.from, record);

  if (tx.to) {
    appendTransaction(tx.to, record);
  }
}

function appendTransaction(address: string, transaction: IndexedTransaction): void {
  const key = normalizeAddress(address).toLowerCase();
  const transactions = indexedTransactions.get(key) ?? [];
  transactions.unshift(transaction);
  indexedTransactions.set(key, transactions.slice(0, 100));
}

app.listen(port, () => {
  console.log(`GenPay API listening on http://localhost:${port}`);
});
