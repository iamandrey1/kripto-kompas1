// Blockchain types
export type Chain = 'ethereum' | 'solana' | 'arbitrum' | 'optimism' | 'base' | 'polygon';

export interface Address {
  address: string;
  chain: Chain;
  ens?: string;
  label?: string;
}

export interface Transaction {
  hash: string;
  from: Address;
  to: Address;
  value: string;
  timestamp: number;
  chain: Chain;
  gasUsed?: string;
  gasPrice?: string;
  status: 'success' | 'failed' | 'pending';
  logs?: any[];
}

// Wallet labels
export type WalletLabel =
  | 'whale'
  | 'exchange'
  | 'defi'
  | 'nft'
  | 'dao'
  | 'cex'
  | 'protocol'
  | 'bridge'
  | 'unknown';

export interface WalletInfo {
  address: string;
  chain: Chain;
  label: WalletLabel;
  tags: string[];
  firstSeen?: number;
  lastActive?: number;
  balance?: TokenBalance[];
  isSmartMoney?: boolean;
  score?: number;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  amount: number;
  value: number;
  decimals: number;
}

// Token Flow types
export interface FlowNode {
  id: string;
  address: string;
  label: string;
  type: 'wallet' | 'exchange' | 'defi' | 'bridge' | 'protocol';
  value: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  value: number;
  token: string;
}

export interface TokenFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
  totalVolume: number;
  timeframe: string;
}

// Holder Analysis
export interface Holder {
  address: string;
  balance: number;
  percentage: number;
  label?: WalletLabel;
  change24h?: number;
}

export interface TokenDistribution {
  token: string;
  symbol: string;
  holders: Holder[];
  topHoldersPercentage: number;
  uniqueHolders: number;
}

// Alerts
export type AlertCondition =
  | 'large_transfer'
  | 'new_wallet'
  | 'token_movement'
  | 'price_change'
  | 'whale_activity';

export interface Alert {
  id: string;
  name: string;
  address?: string;
  chain: Chain;
  condition: AlertCondition;
  threshold?: number;
  condition2?: 'above' | 'below';
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: number;
}

// Analytics Response types
export interface AnalyticsResponse<T> {
  data: T;
  loading: boolean;
  error: string | null;
  timestamp: number;
}

// Dashboard Stats
export interface ChainStats {
  chain: Chain;
  tvl: number;
  volume24h: number;
  txCount: number;
  activeAddresses: number;
}

export interface WhaleMovement {
  address: string;
  chain: Chain;
  token: string;
  value: number;
  direction: 'in' | 'out';
  timestamp: number;
  transactionHash: string;
}