/**
 * Smart Contract Configuration for Human.Farm
 *
 * This file contains the configuration for integrating with the
 * Human.Farm escrow smart contract (v2). Update these values after
 * deploying your smart contract.
 */

export interface ContractConfig {
  // The deployed escrow contract address
  escrowContract: string;
  // Chain ID (8453 = Base Mainnet, 84532 = Base Sepolia)
  chainId: number;
  // Chain name for display
  chainName: string;
  // RPC URL for reading contract state
  rpcUrl: string;
  // Block explorer URL
  explorerUrl: string;
  // Supported payment tokens
  tokens: {
    symbol: string;
    address: string; // Use '0x0000000000000000000000000000000000000000' for native ETH
    decimals: number;
  }[];
}

// Default configuration - UPDATE AFTER DEPLOYING YOUR CONTRACT
export const CONTRACT_CONFIG: ContractConfig = {
  // Replace with your deployed contract address
  escrowContract: '0x0000000000000000000000000000000000000000',

  // Base Mainnet
  chainId: 8453,
  chainName: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org',

  // Supported tokens - add more as needed
  tokens: [
    {
      symbol: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      decimals: 6,
    },
    {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
  ],
};

// For testnet deployment (Base Sepolia)
export const TESTNET_CONFIG: ContractConfig = {
  escrowContract: '0xBeb9e10F41e516008313456923B57deE199af65E',
  chainId: 84532,
  chainName: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
  tokens: [
    {
      symbol: 'USDC',
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
      decimals: 6,
    },
    {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
  ],
};

// Get the active config based on environment
export const getContractConfig = (): ContractConfig => {
  const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
  return isTestnet ? TESTNET_CONFIG : CONTRACT_CONFIG;
};

/**
 * Task Status Enum (matches Solidity contract)
 */
export enum TaskStatus {
  None = 0,       // Task doesn't exist
  Active = 1,     // Funded and awaiting completion
  Completed = 2,  // Payment released to human
  Refunded = 3,   // Payment refunded to agent
  Disputed = 4,   // Under dispute resolution
}

/**
 * Resolution Type Enum (matches Solidity contract)
 */
export enum ResolutionType {
  Release = 0,    // Full release to human
  Refund = 1,     // Full refund to agent
  Split = 2,      // Split between human and agent
}

/**
 * Task Struct Type (matches Solidity contract)
 */
export interface Task {
  agent: `0x${string}`;
  human: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  platformFee: bigint;
  deadline: bigint;
  status: TaskStatus;
  createdAt: bigint;
}

/**
 * HumanFarmEscrow Contract ABI (v2)
 *
 * Full ABI for the updated escrow contract with:
 * - ResolutionType enum for disputes
 * - Resolver role separate from owner
 * - getTask returns struct directly
 * - Exact ETH amounts required (no refunds)
 */
export const ESCROW_ABI = [
  // ============ State Variables (read) ============
  {
    name: 'platformFeeBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'platformWallet',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'minTaskAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'minTaskDuration',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'resolver',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'supportedTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },

  // ============ Core Functions ============
  {
    name: 'createTask',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'taskId', type: 'bytes32' },
      { name: 'human', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'releasePayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'refundPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'initiateDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'resolveDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'bytes32' },
      { name: 'resolution', type: 'uint8' }, // ResolutionType enum
      { name: 'humanAmount', type: 'uint256' },
    ],
    outputs: [],
  },

  // ============ View Functions ============
  {
    name: 'getTask',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'bytes32' }],
    outputs: [
      {
        name: 'task',
        type: 'tuple',
        components: [
          { name: 'agent', type: 'address' },
          { name: 'human', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'platformFee', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'calculateTotal',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [
      { name: 'total', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
  },
  {
    name: 'isTokenSupported',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },

  // ============ Admin Functions ============
  {
    name: 'setPlatformFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newFeeBps', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'setPlatformWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newWallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setResolver',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newResolver', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setTokenSupport',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'supported', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'setMinTaskAmount',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newMinAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'setMinTaskDuration',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newMinDuration', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdrawStuckETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },

  // ============ Events ============
  {
    name: 'TaskCreated',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'bytes32', indexed: true },
      { name: 'agent', type: 'address', indexed: true },
      { name: 'human', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PaymentReleased',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'bytes32', indexed: true },
      { name: 'human', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PaymentRefunded',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'bytes32', indexed: true },
      { name: 'agent', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'TaskDisputed',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'bytes32', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
    ],
  },
  {
    name: 'DisputeResolved',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'bytes32', indexed: true },
      { name: 'resolution', type: 'uint8', indexed: false },
      { name: 'humanAmount', type: 'uint256', indexed: false },
      { name: 'agentAmount', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PlatformFeeUpdated',
    type: 'event',
    inputs: [
      { name: 'oldFee', type: 'uint256', indexed: false },
      { name: 'newFee', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PlatformWalletUpdated',
    type: 'event',
    inputs: [
      { name: 'oldWallet', type: 'address', indexed: false },
      { name: 'newWallet', type: 'address', indexed: false },
    ],
  },
  {
    name: 'TokenSupportUpdated',
    type: 'event',
    inputs: [
      { name: 'token', type: 'address', indexed: false },
      { name: 'supported', type: 'bool', indexed: false },
    ],
  },
  {
    name: 'MinTaskAmountUpdated',
    type: 'event',
    inputs: [
      { name: 'oldAmount', type: 'uint256', indexed: false },
      { name: 'newAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'MinTaskDurationUpdated',
    type: 'event',
    inputs: [
      { name: 'oldDuration', type: 'uint256', indexed: false },
      { name: 'newDuration', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'ResolverUpdated',
    type: 'event',
    inputs: [
      { name: 'oldResolver', type: 'address', indexed: false },
      { name: 'newResolver', type: 'address', indexed: false },
    ],
  },
  {
    name: 'StuckETHWithdrawn',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },

  // ============ Custom Errors ============
  {
    name: 'TaskAlreadyExists',
    type: 'error',
    inputs: [],
  },
  {
    name: 'TaskNotFound',
    type: 'error',
    inputs: [],
  },
  {
    name: 'TaskNotActive',
    type: 'error',
    inputs: [],
  },
  {
    name: 'TaskNotDisputed',
    type: 'error',
    inputs: [],
  },
  {
    name: 'InvalidAddress',
    type: 'error',
    inputs: [],
  },
  {
    name: 'InvalidAmount',
    type: 'error',
    inputs: [],
  },
  {
    name: 'InvalidDeadline',
    type: 'error',
    inputs: [],
  },
  {
    name: 'InvalidDuration',
    type: 'error',
    inputs: [],
  },
  {
    name: 'InvalidHumanShare',
    type: 'error',
    inputs: [],
  },
  {
    name: 'DeadlineNotPassed',
    type: 'error',
    inputs: [],
  },
  {
    name: 'OnlyAgent',
    type: 'error',
    inputs: [],
  },
  {
    name: 'OnlyParticipant',
    type: 'error',
    inputs: [],
  },
  {
    name: 'OnlyResolver',
    type: 'error',
    inputs: [],
  },
  {
    name: 'UnsupportedToken',
    type: 'error',
    inputs: [],
  },
  {
    name: 'InsufficientETH',
    type: 'error',
    inputs: [],
  },
  {
    name: 'IncorrectETHAmount',
    type: 'error',
    inputs: [],
  },
  {
    name: 'TransferFailed',
    type: 'error',
    inputs: [],
  },
  {
    name: 'NoStuckETH',
    type: 'error',
    inputs: [],
  },
] as const;

/**
 * ERC20 ABI (minimal for approve and allowance)
 */
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

/**
 * Helper to convert task ID to bytes32
 * Uses keccak256 hash for consistent 32-byte output
 */
export const taskIdToBytes32 = (taskId: string): `0x${string}` => {
  // For UUIDs or string IDs, we'll pad/hash them to bytes32
  // Simple approach: pad with zeros if short, or use first 32 bytes
  const cleaned = taskId.replace(/-/g, ''); // Remove dashes from UUIDs
  const hex = Buffer.from(cleaned).toString('hex');
  const padded = hex.padEnd(64, '0').slice(0, 64);
  return `0x${padded}` as `0x${string}`;
};

/**
 * Helper to convert USD amount to token amount
 */
export const usdToTokenAmount = (
  usdAmount: number,
  tokenDecimals: number,
  usdPerToken: number = 1 // For stablecoins like USDC, this is 1
): bigint => {
  const amount = (usdAmount / usdPerToken) * Math.pow(10, tokenDecimals);
  return BigInt(Math.floor(amount));
};

/**
 * Helper to format token amount for display
 */
export const formatTokenAmount = (
  amount: bigint,
  decimals: number,
  maxDecimals: number = 2
): string => {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, maxDecimals);
  return `${whole}.${fractionStr}`;
};

/**
 * Get status label from enum
 */
export const getStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    [TaskStatus.None]: 'Not Found',
    [TaskStatus.Active]: 'Active',
    [TaskStatus.Completed]: 'Completed',
    [TaskStatus.Refunded]: 'Refunded',
    [TaskStatus.Disputed]: 'Disputed',
  };
  return labels[status] || 'Unknown';
};

/**
 * Get resolution type label
 */
export const getResolutionLabel = (resolution: ResolutionType): string => {
  const labels: Record<ResolutionType, string> = {
    [ResolutionType.Release]: 'Released to Human',
    [ResolutionType.Refund]: 'Refunded to Agent',
    [ResolutionType.Split]: 'Split',
  };
  return labels[resolution] || 'Unknown';
};
