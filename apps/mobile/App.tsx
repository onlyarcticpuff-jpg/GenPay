import 'react-native-get-random-values';
import '@ethersproject/shims';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  DEFAULT_NETWORKS,
  WalletAccount,
  buildNativeTransfer,
  createRandomAccount,
  signMessageWithMnemonic,
} from '@genpay/wallet-core';

export default function App() {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [output, setOutput] = useState('Create a local wallet to begin.');
  const network = DEFAULT_NETWORKS[0];

  const createWallet = () => {
    const nextAccount = createRandomAccount();
    setAccount(nextAccount);
    setOutput(`Wallet created on-device: ${nextAccount.address}`);
  };

  const previewTransfer = () => {
    const tx = buildNativeTransfer({ to: recipient, amount });
    setOutput(JSON.stringify({ ...tx, value: tx.value?.toString() }, null, 2));
  };

  const signMessage = async () => {
    if (!account?.phrase) {
      setOutput('Create a local wallet first.');
      return;
    }

    const signature = await signMessageWithMnemonic(account.phrase, 'GenPay mobile approval');
    setOutput(signature);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>GenPayFrontend mobile</Text>
        <Text style={styles.title}>Non-custodial wallet starter</Text>
        <Text style={styles.copy}>
          Keys are generated locally on the device. Backend services can index balances and transactions,
          but they must never receive recovery phrases or private keys.
        </Text>

        <Pressable style={styles.button} onPress={createWallet}>
          <Text style={styles.buttonText}>Create on-device wallet</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet</Text>
          <Text style={styles.mono}>{account?.address ?? 'No wallet selected'}</Text>
          {account?.phrase ? <Text style={styles.warning}>{account.phrase}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Network</Text>
          <Text style={styles.copy}>{network.name}</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Recipient address"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
          />
          <Pressable style={styles.secondaryButton} onPress={previewTransfer}>
            <Text style={styles.buttonText}>Preview transfer</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={signMessage}>
            <Text style={styles.buttonText}>Sign demo message</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Output</Text>
          <Text style={styles.mono}>{output}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#09090f',
    flex: 1,
  },
  container: {
    gap: 18,
    padding: 22,
  },
  kicker: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  copy: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 999,
    padding: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#312e81',
    borderRadius: 16,
    marginTop: 12,
    padding: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(148, 163, 184, 0.26)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  mono: {
    backgroundColor: '#020617',
    borderRadius: 12,
    color: '#bbf7d0',
    fontFamily: 'Courier',
    overflow: 'hidden',
    padding: 12,
  },
  warning: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 12,
    color: '#fde68a',
    padding: 12,
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#fff',
    padding: 14,
  },
});
