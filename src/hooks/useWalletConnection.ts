/**
 * useWalletConnection Hook
 * 
 * Handles wallet connection lifecycle:
 * 1. Detects when wallet connects
 * 2. Requests signature to verify wallet ownership
 * 3. Creates/updates user in database
 * 4. Stores authentication state
 */

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEvent } from './useEvent';
import axios from 'axios';
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_ACTIONS_SERVER_URL || 'http://localhost:4000';

interface WalletConnectionState {
  isVerified: boolean;
  isVerifying: boolean;
  userId: string | null;
  error: string | null;
}

export function useWalletConnection() {
  const { publicKey, connected, signMessage } = useWallet();
  const { trackEvent } = useEvent();

  const [state, setState] = useState<WalletConnectionState>({
    isVerified: false,
    isVerifying: false,
    userId: null,
    error: null,
  });

  const verifyAndCreateUser = useCallback(async () => {
    if (!publicKey || !connected || !signMessage) {
      return;
    }

    const walletAddress = publicKey.toBase58();

    // Check if already verified in this session
    const storedVerification = sessionStorage.getItem(`wallet_verified_${walletAddress}`);
    if (storedVerification) {
      setState({
        isVerified: true,
        isVerifying: false,
        userId: storedVerification,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      // Step 1: Request wallet signature to verify ownership
      const message = `Verify wallet ownership for Artha Network\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);

      trackEvent('wallet_verification_attempt', { wallet_address: walletAddress });

      let signature: Uint8Array;
      try {
        signature = await signMessage(encodedMessage);
      } catch (signError) {
        // User rejected signature
        trackEvent('wallet_verification_rejected', {
          wallet_address: walletAddress,
          error: signError instanceof Error ? signError.message : 'Unknown error'
        });
        throw new Error('Wallet signature rejected. Please sign the message to verify wallet ownership.');
      }

      trackEvent('wallet_signature_success', { wallet_address: walletAddress });

      // Step 2: Create or find user in database
      const response = await axios.post(`${API_BASE_URL}/api/users`, {
        walletAddress,
      });

      const userId = response.data.id;

      // Step 3: Store verification in session
      sessionStorage.setItem(`wallet_verified_${walletAddress}`, userId);

      setState({
        isVerified: true,
        isVerifying: false,
        userId,
        error: null,
      });

      trackEvent('wallet_connection_complete', {
        wallet_address: walletAddress,
        user_id: userId,
      });

    } catch (error) {
      let errorMessage = 'Failed to verify wallet';

      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data;
        errorMessage = data.details || data.error || errorMessage;
        if (data.hint) {
          errorMessage += ` (${data.hint})`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState({
        isVerified: false,
        isVerifying: false,
        userId: null,
        error: errorMessage,
      });

      trackEvent('wallet_connection_failed', {
        wallet_address: walletAddress,
        error: errorMessage,
      });

      console.error('Wallet connection error:', error);
      toast.error(errorMessage);
    }
  }, [publicKey, connected, signMessage, trackEvent]);

  // Auto-verify when wallet connects
  useEffect(() => {
    // Only auto-verify if we haven't tried and failed yet (prevent loop)
    if (connected && publicKey && !state.isVerified && !state.isVerifying && !state.error) {
      verifyAndCreateUser();
    }
  }, [connected, publicKey, state.isVerified, state.isVerifying, state.error, verifyAndCreateUser]);

  // Clear verification when wallet disconnects
  useEffect(() => {
    if (!connected || !publicKey) {
      setState({
        isVerified: false,
        isVerifying: false,
        userId: null,
        error: null,
      });
    }
  }, [connected, publicKey]);

  return {
    ...state,
    retry: verifyAndCreateUser,
  };
}
