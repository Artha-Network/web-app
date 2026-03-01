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
        // Log error details for debugging
        const errorMessage = err?.message || '';
        const errorLogs = err?.logs || [];
        
        try {
          // Best-effort: log simulation details to help debugging
          if (typeof err.getLogs === 'function') {
            // eslint-disable-next-line no-console
            console.error('Transaction simulation failed:', await err.getLogs(connection));
          } else if (err.logs) {
            // eslint-disable-next-line no-console
            console.error('Transaction simulation failed:', err.logs);
          } else {
            // eslint-disable-next-line no-console
            console.error('Transaction send failed:', err?.message ?? err);
          }
        } catch (logErr) {
          // eslint-disable-next-line no-console
          console.error('Failed to extract simulation logs:', logErr);
        }

        // Always throw the error - no mock signatures or silent failures
        // This ensures blockchain errors are properly surfaced to users
        throw err;
      }
    },
    [signTransaction, sendTransaction, publicKey, connected, wallet, connection]
  );

  return { signAndSendBase64Tx };
}

export default useWalletTransactions;
