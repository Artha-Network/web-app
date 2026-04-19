import { useCallback } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

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

      // Check if the transaction already has partial signatures (e.g. arbiter-signed resolve)
      const hasPartialSignatures = tx.signatures.some(
        (sig, i) => i > 0 && sig.some(b => b !== 0)
      );

      let blockhash: string;
      let lastValidBlockHeight: number;

      if (hasPartialSignatures) {
        // Don't replace blockhash — it would invalidate existing signatures
        blockhash = tx.message.recentBlockhash;
        const bh = await connection.getLatestBlockhash('confirmed');
        lastValidBlockHeight = bh.lastValidBlockHeight;
      } else {
        // Get a fresh blockhash (critical for localhost where blockhashes expire quickly)
        const bh = await connection.getLatestBlockhash('confirmed');
        blockhash = bh.blockhash;
        lastValidBlockHeight = bh.lastValidBlockHeight;
        tx.message.recentBlockhash = blockhash;
      }

      // Sign the transaction (wallet adds its signature)
      const signedTx = await signTransaction(tx);

      // Pre-compute the on-chain signature so we can recover from "already processed"
      const expectedSignature = signedTx.signatures[0]?.length
        ? bs58.encode(signedTx.signatures[0])
        : null;

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
        const errorMessage = err?.message || '';

        // "This transaction has already been processed" means the signed bytes
        // were already submitted in a prior attempt and recorded on chain.
        // Recover by checking the on-chain status of the known signature.
        if (expectedSignature && /already been processed/i.test(errorMessage)) {
          try {
            const status = await connection.getSignatureStatus(expectedSignature, {
              searchTransactionHistory: true,
            });
            if (status?.value && !status.value.err) {
              // The original tx succeeded — proceed as if this attempt sent it.
              return expectedSignature;
            }
            if (status?.value?.err) {
              throw new Error(
                `Previous transaction was rejected on-chain (${JSON.stringify(status.value.err)}). Please refresh the page and start a new deal.`
              );
            }
          } catch (statusErr) {
            console.error('Failed to recover signature status:', statusErr);
          }
        }

        try {
          if (typeof err.getLogs === 'function') {
            console.error('Transaction simulation failed:', await err.getLogs(connection));
          } else if (err.logs) {
            console.error('Transaction simulation failed:', err.logs);
          } else {
            console.error('Transaction send failed:', err?.message ?? err);
          }
        } catch (logErr) {
          console.error('Failed to extract simulation logs:', logErr);
        }

        throw err;
      }
    },
    [signTransaction, sendTransaction, publicKey, connected, wallet, connection]
  );

  return { signAndSendBase64Tx };
}

export default useWalletTransactions;
