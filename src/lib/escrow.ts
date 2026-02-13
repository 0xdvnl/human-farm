/**
 * Escrow Contract Integration (v2)
 *
 * This module provides functions to interact with the HumanFarmEscrow smart contract
 * using viem for type-safe contract interactions.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Hash,
  type Address,
  formatEther,
  parseEther,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import {
  getContractConfig,
  ESCROW_ABI,
  ERC20_ABI,
  taskIdToBytes32,
  TaskStatus,
  ResolutionType,
  type Task,
} from './contracts';

// Re-export types and enums for convenience
export { TaskStatus, ResolutionType, type Task };

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the appropriate chain based on config
 */
function getChain() {
  const config = getContractConfig();
  return config.chainId === 84532 ? baseSepolia : base;
}

/**
 * Get a public client for reading contract state
 */
export function getPublicClient() {
  const config = getContractConfig();
  return createPublicClient({
    chain: getChain(),
    transport: http(config.rpcUrl),
  });
}

/**
 * Get a wallet client for sending transactions
 */
export function getWalletClient() {
  if (!isBrowser || !window.ethereum) {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }

  return createWalletClient({
    chain: getChain(),
    transport: custom(window.ethereum),
  });
}

/**
 * Get the contract configuration via API
 */
export async function getEscrowConfig() {
  const res = await fetch('/api/escrow');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * Connect to user's wallet
 */
export async function connectWallet(): Promise<Address> {
  if (!isBrowser || !window.ethereum) {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  return accounts[0] as Address;
}

/**
 * Get connected wallet address
 */
export async function getConnectedWallet(): Promise<Address | null> {
  if (!isBrowser || !window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts?.[0] as Address || null;
  } catch {
    return null;
  }
}

/**
 * Switch to Base network
 */
export async function switchToBase(testnet = false): Promise<void> {
  if (!isBrowser || !window.ethereum) {
    throw new Error('Wallet not available');
  }

  const chainId = testnet ? '0x14a34' : '0x2105'; // Base Sepolia or Base Mainnet
  const chainName = testnet ? 'Base Sepolia' : 'Base';
  const rpcUrl = testnet ? 'https://sepolia.base.org' : 'https://mainnet.base.org';
  const explorerUrl = testnet ? 'https://sepolia.basescan.org' : 'https://basescan.org';

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError: any) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId,
          chainName,
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: [explorerUrl],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Get current chain ID
 */
export async function getCurrentChainId(): Promise<number> {
  if (!isBrowser || !window.ethereum) {
    throw new Error('Wallet not available');
  }

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId as string, 16);
}

// ============ Contract Read Functions ============

/**
 * Get task details from the escrow contract
 */
export async function getTaskFromContract(taskId: string): Promise<Task | null> {
  const config = getContractConfig();
  const publicClient = getPublicClient();
  const taskIdBytes = taskIdToBytes32(taskId);

  try {
    const task = await publicClient.readContract({
      address: config.escrowContract as Address,
      abi: ESCROW_ABI,
      functionName: 'getTask',
      args: [taskIdBytes],
    }) as any;

    // Check if task exists (status will be 0 for non-existent tasks)
    if (task.status === 0 && task.agent === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return {
      agent: task.agent,
      human: task.human,
      token: task.token,
      amount: task.amount,
      platformFee: task.platformFee,
      deadline: task.deadline,
      status: task.status as TaskStatus,
      createdAt: task.createdAt,
    };
  } catch (error) {
    console.error('Error fetching task:', error);
    return null;
  }
}

/**
 * Calculate total amount required (including platform fee)
 */
export async function calculateTotal(amount: bigint): Promise<{ total: bigint; fee: bigint }> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  const [total, fee] = await publicClient.readContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'calculateTotal',
    args: [amount],
  }) as [bigint, bigint];

  return { total, fee };
}

/**
 * Check if a token is supported
 */
export async function isTokenSupported(tokenAddress: Address): Promise<boolean> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'isTokenSupported',
    args: [tokenAddress],
  }) as Promise<boolean>;
}

/**
 * Get platform fee in basis points
 */
export async function getPlatformFeeBps(): Promise<bigint> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'platformFeeBps',
  }) as Promise<bigint>;
}

/**
 * Get minimum task amount
 */
export async function getMinTaskAmount(): Promise<bigint> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'minTaskAmount',
  }) as Promise<bigint>;
}

/**
 * Get minimum task duration in seconds
 */
export async function getMinTaskDuration(): Promise<bigint> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'minTaskDuration',
  }) as Promise<bigint>;
}

/**
 * Check if contract is paused
 */
export async function isPaused(): Promise<boolean> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'paused',
  }) as Promise<boolean>;
}

// ============ Contract Write Functions ============

/**
 * Approve USDC spending for the escrow contract
 */
export async function approveToken(
  tokenAddress: Address,
  amount: bigint
): Promise<Hash> {
  const config = getContractConfig();
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [config.escrowContract as Address, amount],
    account,
  });

  return hash;
}

/**
 * Check token allowance
 */
export async function getAllowance(
  tokenAddress: Address,
  ownerAddress: Address
): Promise<bigint> {
  const config = getContractConfig();
  const publicClient = getPublicClient();

  return publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [ownerAddress, config.escrowContract as Address],
  }) as Promise<bigint>;
}

/**
 * Create task in escrow contract
 *
 * IMPORTANT: For ETH payments, the exact amount (including fee) must be sent.
 * No excess ETH will be refunded.
 */
export async function createTaskEscrow(
  taskId: string,
  humanAddress: Address,
  tokenAddress: Address,
  amount: bigint,
  deadline: bigint
): Promise<Hash> {
  const config = getContractConfig();
  const walletClient = getWalletClient();
  const publicClient = getPublicClient();
  const [account] = await walletClient.getAddresses();

  const taskIdBytes = taskIdToBytes32(taskId);
  const isETH = tokenAddress === '0x0000000000000000000000000000000000000000';

  // Calculate total required (amount + platform fee)
  const { total } = await calculateTotal(amount);

  const hash = await walletClient.writeContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'createTask',
    args: [taskIdBytes, humanAddress, tokenAddress, amount, deadline],
    account,
    value: isETH ? total : BigInt(0), // Send exact ETH amount required
  });

  return hash;
}

/**
 * Release payment to human
 */
export async function releasePayment(taskId: string): Promise<Hash> {
  const config = getContractConfig();
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const taskIdBytes = taskIdToBytes32(taskId);

  const hash = await walletClient.writeContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'releasePayment',
    args: [taskIdBytes],
    account,
  });

  return hash;
}

/**
 * Refund payment to agent (only after deadline)
 */
export async function refundPayment(taskId: string): Promise<Hash> {
  const config = getContractConfig();
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const taskIdBytes = taskIdToBytes32(taskId);

  const hash = await walletClient.writeContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'refundPayment',
    args: [taskIdBytes],
    account,
  });

  return hash;
}

/**
 * Initiate a dispute on a task
 */
export async function initiateDispute(taskId: string): Promise<Hash> {
  const config = getContractConfig();
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const taskIdBytes = taskIdToBytes32(taskId);

  const hash = await walletClient.writeContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'initiateDispute',
    args: [taskIdBytes],
    account,
  });

  return hash;
}

/**
 * Resolve a dispute (resolver/owner only)
 *
 * @param taskId - The task ID
 * @param resolution - Resolution type (Release, Refund, or Split)
 * @param humanAmount - Amount to send to human (only used for Split resolution)
 */
export async function resolveDispute(
  taskId: string,
  resolution: ResolutionType,
  humanAmount: bigint = BigInt(0)
): Promise<Hash> {
  const config = getContractConfig();
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const taskIdBytes = taskIdToBytes32(taskId);

  const hash = await walletClient.writeContract({
    address: config.escrowContract as Address,
    abi: ESCROW_ABI,
    functionName: 'resolveDispute',
    args: [taskIdBytes, resolution, humanAmount],
    account,
  });

  return hash;
}

// ============ Transaction Helpers ============

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(txHash: Hash): Promise<any> {
  const publicClient = getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  return receipt;
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash: Hash) {
  const publicClient = getPublicClient();
  return publicClient.getTransactionReceipt({ hash: txHash });
}

// ============ Utility Functions ============

/**
 * Convert USD to token amount (for USDC with 6 decimals)
 */
export function usdToUsdc(usdAmount: number): bigint {
  return BigInt(Math.floor(usdAmount * 1e6));
}

/**
 * Convert USDC amount to USD
 */
export function usdcToUsd(usdcAmount: bigint): number {
  return Number(usdcAmount) / 1e6;
}

/**
 * Convert ETH string to wei
 */
export function ethToWei(ethAmount: string): bigint {
  return parseEther(ethAmount);
}

/**
 * Convert wei to ETH string
 */
export function weiToEth(weiAmount: bigint): string {
  return formatEther(weiAmount);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const num = Number(amount) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

/**
 * Get deadline timestamp (current time + duration in seconds)
 */
export function getDeadlineTimestamp(durationSeconds: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + durationSeconds);
}

/**
 * Check if deadline has passed
 */
export function isDeadlinePassed(deadline: bigint): boolean {
  return BigInt(Math.floor(Date.now() / 1000)) > deadline;
}
