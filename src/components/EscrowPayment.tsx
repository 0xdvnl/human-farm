'use client';

import { useState, useEffect } from 'react';
import { useEscrow } from '@/hooks/useEscrow';
import {
  Wallet,
  ArrowRight,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface EscrowPaymentProps {
  taskId: string;
  humanWallet: string | null;
  amountUsd: number;
  deadline: string;
  status: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'disputed' | 'cancelled';
  paymentStatus?: string;
  depositTxHash?: string;
  releaseTxHash?: string;
  onPaymentComplete?: () => void;
}

export default function EscrowPayment({
  taskId,
  humanWallet,
  amountUsd,
  deadline,
  status,
  paymentStatus,
  depositTxHash,
  releaseTxHash,
  onPaymentComplete,
}: EscrowPaymentProps) {
  const {
    config,
    isLoading,
    error,
    walletAddress,
    isCorrectChain,
    connect,
    switchChain,
    depositToEscrow,
    release,
    loadConfig,
  } = useEscrow();

  const [txHash, setTxHash] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'releasing' | 'done'>('idle');

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const platformFee = amountUsd * 0.05;
  const totalAmount = amountUsd + platformFee;

  const handleDeposit = async () => {
    if (!humanWallet) {
      alert('Human must connect their wallet first');
      return;
    }

    try {
      setStep('approving');
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      setStep('depositing');
      const tx = await depositToEscrow(taskId, humanWallet, amountUsd, deadlineTimestamp);
      setTxHash(tx);
      setStep('done');
      onPaymentComplete?.();
    } catch (err) {
      console.error('Deposit failed:', err);
      setStep('idle');
    }
  };

  const handleRelease = async () => {
    try {
      setStep('releasing');
      const tx = await release(taskId);
      setTxHash(tx);
      setStep('done');
      onPaymentComplete?.();
    } catch (err) {
      console.error('Release failed:', err);
      setStep('idle');
    }
  };

  // Already paid
  if (paymentStatus === 'released' || releaseTxHash) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Check className="text-green-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-green-400">Payment Released</h3>
            <p className="text-gray-400 text-sm">${amountUsd.toFixed(2)} USDC sent to human</p>
          </div>
        </div>
        {releaseTxHash && config && (
          <a
            href={`${config.explorerUrl}/tx/${releaseTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-400 mt-3 hover:underline"
          >
            View transaction <ExternalLink size={14} />
          </a>
        )}
      </div>
    );
  }

  // Funds in escrow
  if (paymentStatus === 'escrowed' || depositTxHash) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-400">Funds in Escrow</h3>
              <p className="text-gray-400 text-sm">${amountUsd.toFixed(2)} USDC locked</p>
            </div>
          </div>

          {status === 'pending_review' && (
            <button
              onClick={handleRelease}
              disabled={isLoading || step !== 'idle'}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {step === 'releasing' ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Releasing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Release Payment
                </>
              )}
            </button>
          )}
        </div>

        {depositTxHash && config && (
          <a
            href={`${config.explorerUrl}/tx/${depositTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-400 mt-3 hover:underline"
          >
            View deposit transaction <ExternalLink size={14} />
          </a>
        )}
      </div>
    );
  }

  // Not connected
  if (!walletAddress) {
    return (
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Wallet className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Connect Wallet to Fund Task</h3>
              <p className="text-gray-400 text-sm">
                Total: ${totalAmount.toFixed(2)} USDC (includes 5% platform fee)
              </p>
            </div>
          </div>

          <button
            onClick={connect}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Wallet size={16} />
            )}
            Connect
          </button>
        </div>
      </div>
    );
  }

  // Wrong network
  if (!isCorrectChain) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="text-yellow-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400">Wrong Network</h3>
              <p className="text-gray-400 text-sm">
                Please switch to {config?.chainName || 'Base'} network
              </p>
            </div>
          </div>

          <button
            onClick={switchChain}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  // Ready to deposit
  return (
    <div className="bg-farm-orange/10 border border-farm-orange/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold mb-1">Fund Task Escrow</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Task amount: ${amountUsd.toFixed(2)} USDC</p>
            <p>Platform fee (5%): ${platformFee.toFixed(2)} USDC</p>
            <p className="font-medium text-white">Total: ${totalAmount.toFixed(2)} USDC</p>
          </div>
        </div>

        <button
          onClick={handleDeposit}
          disabled={isLoading || step !== 'idle' || !humanWallet}
          className="px-4 py-2 bg-farm-orange text-white rounded-lg hover:bg-farm-orange-dark disabled:opacity-50 flex items-center gap-2"
        >
          {step === 'approving' ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Approving...
            </>
          ) : step === 'depositing' ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Depositing...
            </>
          ) : (
            <>
              <ArrowRight size={16} />
              Deposit to Escrow
            </>
          )}
        </button>
      </div>

      {!humanWallet && (
        <p className="text-yellow-400 text-sm mt-3">
          ⚠️ Human must connect their wallet first before you can fund the escrow
        </p>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {txHash && config && (
        <a
          href={`${config.explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-400 mt-3 hover:underline"
        >
          View transaction <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
