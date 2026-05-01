import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { EtherscanProvider, HeliusProvider, KNOWN_WHALES } from '../../lib/api-providers/wallet';
import { Chain, WalletInfo, Transaction, WalletLabel } from '../../types/analytics';
import {
  Search,
  Wallet,
  Clock,
  TrendingUp,
  Activity,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

// Chain icons mapping
const chainIcons: Record<Chain, string> = {
  ethereum: 'Ξ',
  solana: '◎',
  arbitrum: 'A',
  optimism: 'O',
  base: 'B',
  polygon: 'MATIC'
};

const labelColors: Record<WalletLabel, string> = {
  whale: 'text-yellow-500 bg-yellow-500/10',
  exchange: 'text-blue-500 bg-blue-500/10',
  defi: 'text-purple-500 bg-purple-500/10',
  nft: 'text-pink-500 bg-pink-500/10',
  dao: 'text-green-500 bg-green-500/10',
  cex: 'text-blue-400 bg-blue-400/10',
  protocol: 'text-cyan-500 bg-cyan-500/10',
  bridge: 'text-orange-500 bg-orange-500/10',
  unknown: 'text-gray-500 bg-gray-500/10'
};

interface WalletTrackerProps {
  etherscanKey: string;
  heliusKey: string;
}

export default function WalletTracker({ etherscanKey, heliusKey }: WalletTrackerProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<Chain>('ethereum');
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [showChainMenu, setShowChainMenu] = useState(false);

  const etherscan = new EtherscanProvider(etherscanKey);
  const helius = new HeliusProvider(heliusKey);

  const searchWallet = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let walletInfo: WalletInfo | null = null;
      let txs: Transaction[] = [];

      // Detect chain from address format
      let chain = selectedChain;
      if (searchQuery.startsWith('0x') && selectedChain === 'ethereum') {
        // ETH address
        walletInfo = await etherscan.getWalletInfo(searchQuery, 'ethereum');
        txs = await etherscan.getTransactions(searchQuery, 'ethereum', 20);
      } else if (searchQuery.length > 30 && !searchQuery.startsWith('0x')) {
        // Likely Solana
        chain = 'solana';
        walletInfo = await helius.getWalletInfo(searchQuery);
        txs = await helius.getTransactions(searchQuery, 'solana', 20);
      }

      if (walletInfo) {
        // Check if known whale
        const knownWhales = KNOWN_WHALES[chain as keyof typeof KNOWN_WHALES] || [];
        if (knownWhales.includes(searchQuery.toLowerCase())) {
          walletInfo.label = 'whale';
          walletInfo.isSmartMoney = true;
        }

        setWallet(walletInfo);
        setTransactions(txs);
        setSelectedChain(chain);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatValue = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  const getExplorerUrl = (tx: Transaction) => {
    const explorers: Record<Chain, string> = {
      ethereum: 'https://etherscan.io/tx/',
      solana: 'https://solscan.io/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      optimism: 'https://optimistic.etherscan.io/tx/',
      base: 'https://basescan.org/tx/',
      polygon: 'https://polygonscan.com/tx/'
    };
    return explorers[tx.chain] + tx.hash;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.accent + '20' }}>
            <Wallet className="w-5 h-5" style={{ color: colors.accent }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Wallet Tracker</h2>
            <p className="text-sm opacity-60">Track any wallet across multiple chains</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
          <input
            type="text"
            placeholder="Enter wallet address or ENS name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchWallet()}
            className="w-full pl-12 pr-4 py-3 rounded-xl border"
            style={{ background: colors.bgCard, borderColor: colors.border, color: colors.text }}
          />
        </div>

        {/* Chain Selector */}
        <div className="relative">
          <button
            onClick={() => setShowChainMenu(!showChainMenu)}
            className="px-4 py-3 rounded-xl border flex items-center gap-2"
            style={{ background: colors.bgCard, borderColor: colors.border }}
          >
            <span className="font-mono">{chainIcons[selectedChain]}</span>
            <span className="capitalize">{selectedChain}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>

          {showChainMenu && (
            <div
              className="absolute top-full mt-2 right-0 rounded-xl border p-2 z-10 min-w-40"
              style={{ background: colors.bgCard, borderColor: colors.border }}
            >
              {(['ethereum', 'solana', 'arbitrum', 'optimism', 'base', 'polygon'] as Chain[]).map(chain => (
                <button
                  key={chain}
                  onClick={() => { setSelectedChain(chain); setShowChainMenu(false); }}
                  className="w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 hover:bg-white/5"
                  style={{ color: selectedChain === chain ? colors.accent : colors.text }}
                >
                  <span className="font-mono">{chainIcons[chain]}</span>
                  <span className="capitalize">{chain}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={searchWallet}
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium transition-all"
          style={{ background: colors.gradient, color: 'white' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {wallet && (
        <div className="space-y-4">
          {/* Wallet Card */}
          <div className="rounded-2xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: colors.gradient }}
                >
                  {wallet.address.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                    <button onClick={() => copyAddress(wallet.address)} className="p-1 rounded hover:bg-white/10">
                      <Copy className="w-4 h-4 opacity-60" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${labelColors[wallet.label]}`}>
                      {wallet.label.toUpperCase()}
                    </span>
                    {wallet.isSmartMoney && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                        SMART MONEY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {wallet.score && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-60">Score</span>
                    <span className={`text-2xl font-bold ${wallet.score >= 70 ? 'text-green-500' : wallet.score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {wallet.score}
                    </span>
                  </div>
                )}
                <span className="text-sm opacity-60 capitalize">{wallet.chain}</span>
              </div>
            </div>

            {/* Tags */}
            {wallet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
                {wallet.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs" style={{ background: colors.bgSecondary }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <a
                href={wallet.chain === 'solana' ? `https://solscan.io/account/${wallet.address}` : `https://etherscan.io/address/${wallet.address}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: colors.bgSecondary }}
              >
                <ExternalLink className="w-4 h-4" />
                Explorer
              </a>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-2xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: colors.border }}>
              <Activity className="w-5 h-5" style={{ color: colors.accent }} />
              <h3 className="font-semibold">Recent Transactions</h3>
              <span className="ml-auto text-sm opacity-60">{transactions.length} transactions</span>
            </div>

            <div className="divide-y" style={{ borderColor: colors.border }}>
              {transactions.slice(0, 10).map(tx => (
                <div key={tx.hash}>
                  <button
                    onClick={() => setExpandedTx(expandedTx === tx.hash ? null : tx.hash)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      tx.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {tx.status === 'success' ? '✓' : '✗'}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="opacity-60">To:</span>
                        <span className="font-mono">{tx.to.address.slice(0, 8)}...{tx.to.address.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 opacity-50" />
                        <span className="text-xs opacity-60">{formatTime(tx.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">{formatValue(tx.value)} ETH</div>
                      <span className="text-xs opacity-60 capitalize">{tx.chain}</span>
                    </div>

                    {expandedTx === tx.hash ? (
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    )}
                  </button>

                  {expandedTx === tx.hash && (
                    <div className="px-4 pb-4 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="opacity-60">Hash:</span>
                          <div className="font-mono text-xs truncate">{tx.hash}</div>
                        </div>
                        <div>
                          <span className="opacity-60">Gas Used:</span>
                          <div>{tx.gasUsed || 'N/A'}</div>
                        </div>
                      </div>
                      <a
                        href={getExplorerUrl(tx)}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 text-sm"
                        style={{ color: colors.accent }}
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="opacity-60">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}