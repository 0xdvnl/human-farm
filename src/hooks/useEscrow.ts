'use client';

import { useState, useCallback } from 'react';
import {
  getEscrowConfig,
  connectWallet,
  getConnectedWallet,
  switchToBase,
  getCurrentChainId,
  approveToken,
  createTaskEscrow,
  releasePayment,
  refundPayment,
  waitForTransaction,
  usdToUsdc,
} from '@/lib/escrow';

interface EscrowConfig {
  contract: string;
  chainId: number;
  chainName: string;
  explorerUrl: string;
  tokens: { symbol: string; address: string; decimals: number }[];
}

interface UseEscrowReturn {
  config: EscrowConfig | null;
  isLoading: boolean;
  error: string | null;
  walletAddress: string | null;
  isCorrectChain: boolean;
  connect: () => Promise<string>;
  switchChain: () => Promise<void>;
  depositToEscrow: (
    taskId: string,
    humanAddress: string,
    amountUsd: number,
    deadlineTimestamp: number
  ) => Promise<string>;
  release: (taskId: string) => Promise<string>;
  refund: (taskId: string) => Promise<string>;
  loadConfig: () => Promise<void>;
}

export function useEscrow(): UseEscrowReturn {
  const [config, setConfig] = useState<EscrowConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isCorrectChain, setIsCorrectChain] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const escrowConfig = await getEscrowConfig();
      setConfig(escrowConfig);

      // Check wallet connection
      const wallet = await getConnectedWallet();
      setWalletAddress(wallet);

      // Check chain
      if (wallet) {
        const chainId = await getCurrentChainId();
        setIsCorrectChain(chainId === escrowConfig.chainId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async (): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const address = await connectWallet();
      setWalletAddress(address);

      // Check chain after connecting
      if (config) {
        const chainId = await getCurrentChainId();
        setIsCorrectChain(chainId === config.chainId);
      }

      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const switchChain = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
      await switchToBase(isTestnet);
      setIsCorrectChain(true);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const depositToEscrow = useCallback(async (
    taskId: string,
    humanAddress: string,
    amountUsd: number,
    deadlineTimestamp: number
  ): Promise<string> => {
    if (!config) throw new Error('Config not loaded');

    try {
      setIsLoading(true);
      setError(null);

      // Find USDC token
      const usdc = config.tokens.find(t => t.symbol === 'USDC');
      if (!usdc) throw new Error('USDC not supported');

      const amountWei = usdToUsdc(amountUsd);

      // Calculate total with platform fee (5%)
      const totalWithFee = Math.ceil(amountUsd * 1.05);
      const totalWei = usdToUsdc(totalWithFee);

      // Approve USDC spending
      const approveTx = await approveToken(usdc.address as `0x${string}`, totalWei);
      await waitForTransaction(approveTx);

      // Create task in escrow
      const createTx = await createTaskEscrow(
        taskId,
        humanAddress as `0x${string}`,
        usdc.address as `0x${string}`,
        amountWei,
        BigInt(deadlineTimestamp)
      );

      // Wait for confirmation
      await waitForTransaction(createTx);

      // Record in database
      await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          action: 'deposit',
          tx_hash: createTx,
          payment_token: 'USDC',
          payment_amount_wei: amountWei,
        }),
      });

      return createTx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const release = useCallback(async (taskId: string): Promise<string> => {
    if (!config) throw new Error('Config not loaded');

    try {
      setIsLoading(true);
      setError(null);

      const tx = await releasePayment(taskId);
      await waitForTransaction(tx);

      // Record in database
      await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          action: 'release',
          tx_hash: tx,
        }),
      });

      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const refund = useCallback(async (taskId: string): Promise<string> => {
    if (!config) throw new Error('Config not loaded');

    try {
      setIsLoading(true);
      setError(null);

      const tx = await refundPayment(taskId);
      await waitForTransaction(tx);

      // Record in database
      await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          action: 'refund',
          tx_hash: tx,
        }),
      });

      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return {
    config,
    isLoading,
    error,
    walletAddress,
    isCorrectChain,
    connect,
    switchChain,
    depositToEscrow,
    release,
    refund,
    loadConfig,
  };
}
