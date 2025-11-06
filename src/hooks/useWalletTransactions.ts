import { useCallback } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export function useWalletTransactions() {
  const { signTransaction, sendTransaction, publicKey, connected, wallet } = useWallet();
  const { connection } = useConnection();

  const signAndSendBase64Tx = useCallback(
    async (txMessageBase64: string) => {
      // Comprehensive wallet readiness check
      if (!connected) throw new Error("Wallet not connected - please connect your wallet first");
      if (!publicKey) throw new Error("Wallet address not available - please reconnect your wallet");
      if (!wallet) throw new Error("No wallet selected - please select a wallet");
      if (!signTransaction) throw new Error(`Wallet ${wallet.adapter.name} does not support signing transactions`);
      if (!sendTransaction) throw new Error(`Wallet ${wallet.adapter.name} does not support sending transactions`);
      
      // Deserialize the transaction
      let tx = VersionedTransaction.deserialize(decodeBase64(txMessageBase64));
      
      // Get a fresh blockhash (critical for localhost where blockhashes expire quickly)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      
      // Update the transaction with the fresh blockhash
      tx.message.recentBlockhash = blockhash;
      
      // Sign the transaction with the fresh blockhash
      const signedTx = await signTransaction(tx);
      
      try {
        // Send the signed transaction and get signature
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        // Wait for confirmation with the valid block height
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');

        return signature;
      } catch (err: any) {
        // Best-effort: log simulation details to help debugging 'program does not exist' errors
        // Some wallet adapters / @solana/web3.js throw SendTransactionError which exposes getLogs()
        try {
          // If the error object has getLogs, call it with the current connection
          if (typeof err.getLogs === 'function') {
            // getLogs may return an array of log strings or a formatted object
            // await in case it's async
            // eslint-disable-next-line no-console
            console.error('SendTransactionError simulation logs:', await err.getLogs(connection));
          } else if (err.logs) {
            // Some errors include a logs property
            // eslint-disable-next-line no-console
            console.error('Simulation logs (err.logs):', err.logs);
          } else {
            // eslint-disable-next-line no-console
            console.error('Transaction send failed (no logs available):', err?.message ?? err);
          }
        } catch (logErr) {
          // eslint-disable-next-line no-console
          console.error('Failed to extract simulation logs:', logErr);
        }

        // Re-throw the original error so callers can display or handle it
        throw err;
      }
    },
    [signTransaction, sendTransaction, publicKey, connected, wallet, connection]
  );

  return { signAndSendBase64Tx };
}

export default useWalletTransactions;
