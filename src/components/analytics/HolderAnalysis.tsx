import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { EtherscanProvider } from '../../lib/api-providers/wallet';
import { TokenBalance } from '../../types/analytics';
import {
  Users,
  PieChart,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

// Mock holder data (in real app, would use Arkham/Bubblemaps API)
interface HolderData {
  address: string;
  balance: number;
  percentage: number;
  change: number;
  type: 'whale' | 'exchange' | 'retail' | 'team' | 'unknown';
}

const MOCK_HOLDERS: Record<string, HolderData[]> = {
  '0x1f9840a85d5aF5bf1D1762F371BDa8B6BE33A900': [ // Uniswap
    { address: '0x88e6A0c2dDD4BFf2f3086CD4CF1A8Cb9b4dB7F8F', balance: 15000000, percentage: 6.5, change: 2.3, type: 'whale' },
    { address: '0x47176B2d5BbE26A2D1e3C4D2E7b5B6A8F3D2C1E9', balance: 8500000, percentage: 3.7, change: -1.2, type: 'exchange' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9eB0cE3606eB48', balance: 5200000, percentage: 2.2, change: 0, type: 'team' },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', balance: 4100000, percentage: 1.8, change: 5.1, type: 'whale' },
    { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', balance: 3800000, percentage: 1.6, change: -0.5, type: 'exchange' },
    { address: '0xd8dA6BF26764fCE4B9A1aA6a0d3B38c67b9b86A4', balance: 2900000, percentage: 1.2, change: 8.2, type: 'whale' },
    { address: '0x5C8D27aB1C1D2C3E4F5A6B7C8D9E0F1A2B3C4D5', balance: 1500000, percentage: 0.6, change: -2.1, type: 'retail' },
    { address: '0x6D7F8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5', balance: 1200000, percentage: 0.5, change: 1.8, type: 'retail' },
  ]
};

const typeColors = {
  whale: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  exchange: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' },
  team: { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/30' },
  retail: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  unknown: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' }
};

interface HolderAnalysisProps {
  etherscanKey: string;
  tokenAddress?: string;
}

export default function HolderAnalysis({ etherscanKey, tokenAddress }: HolderAnalysisProps) {
  const { colors } = useTheme();
  const [address, setAddress] = useState(tokenAddress || '');
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'balance' | 'change'>('balance');
  const [expanded, setExpanded] = useState(false);

  const etherscan = new EtherscanProvider(etherscanKey);

  const searchHolders = async () => {
    if (!address) return;
    setLoading(true);

    // Simulate API call with mock data
    setTimeout(() => {
      const mock = MOCK_HOLDERS[address.toLowerCase()] || generateMockHolders();
      setHolders(mock);
      setLoading(false);
    }, 1000);
  };

  const generateMockHolders = (): HolderData[] => {
    const types: HolderData['type'][] = ['whale', 'exchange', 'retail', 'team'];
    return Array.from({ length: 20 }, (_, i) => ({
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
      balance: Math.random() * 10000000 + 100000,
      percentage: Math.random() * 5 + 0.1,
      change: (Math.random() - 0.5) * 20,
      type: types[Math.floor(Math.random() * types.length)]
    }));
  };

  const sortedHolders = [...holders].sort((a, b) => {
    if (sortBy === 'balance') return b.balance - a.balance;
    return Math.abs(b.change) - Math.abs(a.change);
  });

  const topHoldersPercentage = holders.slice(0, 5).reduce((sum, h) => sum + h.percentage, 0);
  const displayHolders = expanded ? sortedHolders : sortedHolders.slice(0, 5);

  const formatBalance = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.defi + '20' }}>
            <Users className="w-5 h-5" style={{ color: colors.defi }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Holder Analysis</h2>
            <p className="text-sm opacity-60">Token distribution and holder concentration</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Enter token or NFT contract address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchHolders()}
          className="flex-1 px-4 py-3 rounded-xl border"
          style={{ background: colors.bgCard, borderColor: colors.border }}
        />
        <button
          onClick={searchHolders}
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium transition-all"
          style={{ background: colors.gradient, color: 'white' }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Stats */}
      {holders.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" style={{ color: colors.accent }} />
                <span className="text-sm opacity-60">Total Holders</span>
              </div>
              <div className="text-2xl font-bold">{holders.length.toLocaleString()}</div>
            </div>

            <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4" style={{ color: colors.warning }} />
                <span className="text-sm opacity-60">Top 5 Concentration</span>
              </div>
              <div className="text-2xl font-bold">{topHoldersPercentage.toFixed(1)}%</div>
            </div>

            <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: colors.success }} />
                <span className="text-sm opacity-60">Avg Change 24h</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                +{(holders.reduce((s, h) => s + h.change, 0) / holders.length).toFixed(1)}%
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" style={{ color: colors.danger }} />
                <span className="text-sm opacity-60">Risk Score</span>
              </div>
              <div className="text-2xl font-bold">
                {topHoldersPercentage > 50 ? 'High' : topHoldersPercentage > 30 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>

          {/* Concentration Bar */}
          <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Token Distribution</span>
              <span className="text-sm opacity-60">{topHoldersPercentage.toFixed(1)}% in top 5</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden flex">
              <div className="bg-yellow-500" style={{ width: `${holders[0]?.percentage || 0}%` }}></div>
              <div className="bg-blue-500" style={{ width: `${holders[1]?.percentage || 0}%` }}></div>
              <div className="bg-purple-500" style={{ width: `${holders[2]?.percentage || 0}%` }}></div>
              <div className="bg-green-500" style={{ width: `${holders[3]?.percentage || 0}%` }}></div>
              <div className="bg-gray-400 flex-1"></div>
            </div>
            <div className="flex gap-4 mt-3 text-xs opacity-60">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>Whales</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Exchanges</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Team</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Retail</span>
            </div>
          </div>

          {/* Holders List */}
          <div className="rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="p-4 border-b flex items-center gap-4" style={{ borderColor: colors.border }}>
              <h3 className="font-semibold">Top Holders</h3>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setSortBy('balance')}
                  className={`px-3 py-1 rounded-lg text-sm ${sortBy === 'balance' ? colors.accent + '/20' : ''}`}
                  style={{ background: sortBy === 'balance' ? colors.accent + '20' : 'transparent' }}
                >
                  By Balance
                </button>
                <button
                  onClick={() => setSortBy('change')}
                  className={`px-3 py-1 rounded-lg text-sm ${sortBy === 'change' ? colors.accent + '/20' : ''}`}
                  style={{ background: sortBy === 'change' ? colors.accent + '20' : 'transparent' }}
                >
                  By Change
                </button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: colors.border }}>
              {displayHolders.map((holder, i) => (
                <div key={holder.address} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.bgSecondary }}>
                    #{i + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {holder.address.slice(0, 8)}...{holder.address.slice(-6)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${typeColors[holder.type].bg} ${typeColors[holder.type].text}`}
                      >
                        {holder.type}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">{formatBalance(holder.balance)}</div>
                    <div className="text-sm opacity-60">{holder.percentage.toFixed(2)}%</div>
                  </div>

                  <div className={`flex items-center gap-1 ${holder.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holder.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">{Math.abs(holder.change).toFixed(1)}%</span>
                  </div>

                  <a
                    href={`https://etherscan.io/address/${holder.address}`}
                    target="_blank"
                    rel="noopener"
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 opacity-60" />
                  </a>
                </div>
              ))}
            </div>

            {holders.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-center gap-2 border-t"
                style={{ borderColor: colors.border }}
              >
                {expanded ? (
                  <><ChevronUp className="w-4 h-4" /> Show Less</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Show All {holders.length} Holders</>
                )}
              </button>
            )}
          </div>
        </>
      )}

      {holders.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <p className="opacity-60">Enter a token address to analyze holder distribution</p>
        </div>
      )}
    </div>
  );
}