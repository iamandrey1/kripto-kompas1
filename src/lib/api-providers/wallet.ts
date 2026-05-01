// Blockchain API Providers - Free APIs only
import { Chain, WalletInfo, Transaction, TokenBalance, TokenFlow, Holder, TokenDistribution, WhaleMovement } from '../../types/analytics';

// Base interfaces for API providers
export interface WalletProvider {
  getWalletInfo(address: string, chain: Chain): Promise<WalletInfo | null>;
  getTransactions(address: string, chain: Chain, limit?: number): Promise<Transaction[]>;
  getTokenBalances(address: string, chain: Chain): Promise<TokenBalance[]>;
  getWhaleMovements(chain: Chain, minValue?: number): Promise<WhaleMovement[]>;
}

// Etherscan Provider (ETH, L2s)
export class EtherscanProvider implements WalletProvider {
  private apiKey: string;
  private baseUrl = 'https://api.etherscan.io/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const query = new URLSearchParams({ apikey: this.apiKey, ...params }).toString();
    const response = await fetch(`${this.baseUrl}?module=${endpoint}&${query}`);
    return response.json();
  }

  async getWalletInfo(address: string, chain: Chain): Promise<WalletInfo | null> {
    try {
      // Get balance
      const balanceRes = await this.fetch('account', {
        action: 'balance',
        address,
        tag: 'latest'
      });

      const balance = balanceRes.status === '1' ? (parseInt(balanceRes.result) / 1e18).toFixed(4) : '0';

      // Get token transfers count
      const txCountRes = await this.fetch('account', {
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        sort: 'desc',
        page: '1',
        offset: '1'
      });

      const label = this.guessLabel(address);

      return {
        address,
        chain,
        label,
        tags: this.getTags(label),
        firstSeen: undefined,
        lastActive: undefined,
        isSmartMoney: this.isLikelySmartMoney(parseInt(txCountRes.result?.length || '0')),
        score: this.calculateScore(label, parseInt(txCountRes.result?.length || '0'))
      };
    } catch (error) {
      console.error('Etherscan error:', error);
      return null;
    }
  }

  async getTransactions(address: string, chain: Chain, limit = 50): Promise<Transaction[]> {
    try {
      const res = await this.fetch('account', {
        action: 'txlist',
        address,
        startblock: '0',
        endblock: '99999999',
        sort: 'desc',
        page: '1',
        offset: String(limit)
      });

      return (res.result || []).map((tx: any) => ({
        hash: tx.hash,
        from: { address: tx.from, chain },
        to: { address: tx.to, chain },
        value: (parseInt(tx.value) / 1e18).toFixed(6),
        timestamp: parseInt(tx.timeStamp) * 1000,
        chain,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: tx.isError === '0' ? 'success' : 'failed'
      }));
    } catch (error) {
      console.error('Transactions error:', error);
      return [];
    }
  }

  async getTokenBalances(address: string, chain: Chain): Promise<TokenBalance[]> {
    try {
      const res = await this.fetch('account', {
        action: 'tokentx',
        address,
        startblock: '0',
        endblock: '99999999',
        sort: 'desc',
        page: '1',
        offset: '100'
      });

      // Group by token
      const balances: Record<string, { amount: number; symbol: string; decimals: number }> = {};

      (res.result || []).forEach((tx: any) => {
        const key = tx.contractAddress;
        if (!balances[key]) {
          balances[key] = {
            symbol: tx.tokenSymbol || 'UNKNOWN',
            decimals: parseInt(tx.tokenDecimal || '18'),
            amount: 0
          };
        }
        balances[key].amount += parseFloat(tx.value) / Math.pow(10, balances[key].decimals);
      });

      return Object.entries(balances).map(([token, data]) => ({
        token,
        symbol: data.symbol,
        amount: data.amount,
        value: 0, // Would need price API
        decimals: data.decimals
      }));
    } catch (error) {
      return [];
    }
  }

  async getWhaleMovements(chain: Chain, minValue = 100000): Promise<WhaleMovement[]> {
    // Get recent large transactions
    // This is simplified - real implementation would track known whale wallets
    return [];
  }

  private guessLabel(address: string): WalletInfo['label'] {
    // Known addresses would be in a database
    // For now, return unknown
    return 'unknown';
  }

  private getTags(label: WalletInfo['label']): string[] {
    const tagMap: Record<WalletInfo['label'], string[]> = {
      whale: ['Large Holder', 'Early Adopter'],
      exchange: ['Centralized Exchange'],
      defi: ['DeFi Protocol', 'Liquidity Pool'],
      nft: ['NFT Collector', 'NFT Trader'],
      dao: ['DAO Member', 'Governance'],
      cex: ['Centralized Exchange'],
      protocol: ['Protocol Contract'],
      bridge: ['Cross-Chain Bridge'],
      unknown: ['Wallet']
    };
    return tagMap[label] || [];
  }

  private isLikelySmartMoney(txCount: number): boolean {
    return txCount > 1000;
  }

  private calculateScore(label: WalletInfo['label'], txCount: number): number {
    const baseScores: Record<WalletInfo['label'], number> = {
      whale: 90,
      defi: 75,
      exchange: 60,
      dao: 70,
      nft: 65,
      cex: 55,
      protocol: 50,
      bridge: 65,
      unknown: 30
    };
    return Math.min(100, baseScores[label] + Math.min(txCount / 100, 10));
  }
}

// Helius Provider (Solana)
export class HeliusProvider {
  private apiKey: string;
  private baseUrl = 'https://api.helius-rpc.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWalletInfo(address: string): Promise<WalletInfo | null> {
    try {
      // Get balance
      const balanceRes = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });

      const balanceData = await balanceRes.json();
      const balance = (balanceData.result?.value || 0) / 1e9;

      return {
        address,
        chain: 'solana',
        label: 'unknown',
        tags: ['Wallet'],
        balance: [{ token: 'SOL', symbol: 'SOL', amount: balance, value: 0, decimals: 9 }],
        isSmartMoney: false,
        score: 30
      };
    } catch (error) {
      return null;
    }
  }

  async getTransactions(address: string, chain: Chain, limit = 50): Promise<Transaction[]> {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [address, { limit }]
        })
      });

      const data = await res.json();
      return (data.result || []).map((tx: any) => ({
        hash: tx.signature,
        from: { address, chain },
        to: { address: 'unknown', chain },
        value: '0',
        timestamp: new Date(tx.blockTime * 1000).getTime(),
        chain,
        status: tx.err ? 'failed' : 'success'
      }));
    } catch (error) {
      return [];
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    // SPL tokens require parsing account data
    // Simplified for now
    return [];
  }

  async getWhaleMovements(chain: Chain, minValue = 100000): Promise<WhaleMovement[]> {
    // Solana whale tracking requires additional API calls
    // Simplified for now
    return [];
  }
}

// DeBank Provider (Multi-chain portfolio)
export class DeBankProvider {
  async getPortfolio(address: string): Promise<TokenBalance[]> {
    try {
      const res = await fetch(`https://api.debank.com/v1/user/portfolio_list?user_addr=${address}`);
      const data = await res.json();

      return (data.data?.portfolio_list || []).map((item: any) => ({
        token: item.chain,
        symbol: item.token?.symbol || item.chain.toUpperCase(),
        amount: item.token?.amount || 0,
        value: item.token?.value || 0,
        decimals: 18
      }));
    } catch (error) {
      return [];
    }
  }

  async getPositions(address: string) {
    try {
      const res = await fetch(`https://api.debank.com/v1/user/complex_protocol_list?user_addr=${address}`);
      return res.json();
    } catch (error) {
      return null;
    }
  }
}

// Dune Analytics Provider (Public data)
export class DuneAnalyticsProvider {
  // Dune public queries can be accessed without API key for some data
  async executeQuery(queryId: string, params: Record<string, string> = {}) {
    // Public queries only
    // Would need API key for private queries
    return null;
  }
}

// Factory function
export function createWalletProvider(chain: Chain, apiKey?: string): WalletProvider | null {
  switch (chain) {
    case 'ethereum':
    case 'arbitrum':
    case 'optimism':
    case 'base':
    case 'polygon':
      return apiKey ? new EtherscanProvider(apiKey) : null;
    case 'solana':
      return apiKey ? new HeliusProvider(apiKey) : null;
    default:
      return null;
  }
}

// Known whale addresses (for demo)
export const KNOWN_WHALES: Record<Chain, string[]> = {
  ethereum: [
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance Hot
    '0x21a31ee1af00d5db44a47b2db7e4cb76a44b9c3f', // Binance 8
    '0x0a869d79a7052c7ac1ae1d638b5d8a16bb9ad5a5', // CEX
  ],
  solana: [
    '4NkZ2H3kSMMgP1j8V6vPMH3aQjZ6x7YqM9vR2K5nL1', // Example whale
  ],
  arbitrum: [],
  optimism: [],
  base: [],
  polygon: []
};