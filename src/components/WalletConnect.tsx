'use client';

import { useState, useEffect } from 'react';
import { Wallet, Check, ExternalLink, Copy, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  currentAddress?: string | null;
  onConnect: (address: string) => Promise<void> | void;
  onDisconnect: () => Promise<void> | void;
}

// Utility to shorten address for display
const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function WalletConnect({
  currentAddress,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    // Check if MetaMask/wallet is available
    setHasMetaMask(typeof window !== 'undefined' && !!window.ethereum);
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (!window.ethereum) {
        setError('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        // Await the onConnect callback to catch any API errors
        await onConnect(address);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err.code === 4001) {
        setError('Connection rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = () => {
    if (currentAddress) {
      navigator.clipboard.writeText(currentAddress);
    }
  };

  if (currentAddress) {
    return (
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Check className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Wallet Connected</div>
              <div className="flex items-center gap-2">
                <code className="text-green-400 font-mono">
                  {shortenAddress(currentAddress)}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-white/10 rounded"
                  title="Copy address"
                >
                  <Copy size={14} className="text-gray-400" />
                </button>
                <a
                  href={`https://basescan.org/address/${currentAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-white/10 rounded"
                  title="View on explorer"
                >
                  <ExternalLink size={14} className="text-gray-400" />
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600"
          >
            Disconnect
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💰 Payments for completed tasks will be sent to this wallet on Base network
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <Wallet className="text-purple-400" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Connect Your Wallet</h3>
          <p className="text-gray-400 text-sm mb-4">
            Connect your wallet to receive crypto payments for completed tasks.
            Payments are made in USDC on Base network.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {!hasMetaMask ? (
            <div className="space-y-2">
              <p className="text-yellow-400 text-sm">
                No Web3 wallet detected. Install one to receive payments:
              </p>
              <div className="flex gap-2">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  🦊 Get MetaMask
                </a>
                <a
                  href="https://www.coinbase.com/wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  Coinbase Wallet
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
