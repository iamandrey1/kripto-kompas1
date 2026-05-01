import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { EtherscanProvider } from '../../lib/api-providers/wallet';
import { Transaction, Chain } from '../../types/analytics';
import {
  GitBranch,
  ArrowRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Filter
} from 'lucide-react';

interface FlowTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
  token: string;
  direction: 'in' | 'out';
}

// Known exchange/DeFi addresses for categorization
const KNOWN_ADDRESSES: Record<string, { label: string; type: string }> = {
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0b4': { label: 'Binance', type: 'exchange' },
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance Hot', type: 'exchange' },
  '0x21a31ee1af00d5db44a47b2db7e4cb76a44b9c3f': { label: 'Binance 8', type: 'exchange' },
  '0x056ed3d1fce88cb73f8d3bb1b6f7b6d52a9f2b3f': { label: 'Uniswap V3', type: 'defi' },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { label: 'Uniswap V3 Router', type: 'defi' },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { label: 'USDC Contract', type: 'stablecoin' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { label: 'USDT Contract', type: 'stablecoin' },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { label: 'WETH', type: 'token' },
};

const typeColors: Record<string, string> = {
  exchange: '#3b82f6',
  defi: '#8b5cf6',
  bridge: '#f59e0b',
  stablecoin: '#22c55e',
  token: '#6366f1',
  unknown: '#6b7280'
};

interface TokenFlowProps {
  etherscanKey: string;
  address?: string;
}

export default function TokenFlow({ etherscanKey, address }: TokenFlowProps) {
  const { colors } = useTheme();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>('all');
  const [minValue, setMinValue] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const etherscan = new EtherscanProvider(etherscanKey);

  useEffect(() => {
    if (address && etherscanKey) {
      loadTransactions();
    }
  }, [address, etherscanKey]);

  const loadTransactions = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const transactions = await etherscan.getTransactions(address, 'ethereum', 100);
      setTxs(transactions);
    } catch (error) {
      console.error('Load error:', error);
    }
    setLoading(false);
  };

  // Get unique tokens
  const tokens = ['all', ...new Set(txs.map(tx => {
    const value = parseFloat(tx.value);
    if (value < 0.001) return 'Micro';
    if (value < 1) return 'Small';
    if (value < 10) return 'Medium';
    if (value < 100) return 'Large';
    return 'Whale';
  }))];

  // Filter transactions
  const filteredTxs = txs.filter(tx => {
    const value = parseFloat(tx.value);
    if (value < minValue) return false;
    return true;
  });

  // Group by time
  const groupByTime = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      const hour = date.toLocaleDateString() + ' ' + Math.floor(date.getHours() / 4) * 4 + ':00';
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(tx);
    });
    return groups;
  };

  const groupedTxs = groupByTime(filteredTxs);

  // Calculate stats
  const totalVolume = filteredTxs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
  const inFlow = filteredTxs.filter(tx => tx.to.address.toLowerCase() === address?.toLowerCase()).reduce((sum, tx) => sum + parseFloat(tx.value), 0);
  const outFlow = filteredTxs.filter(tx => tx.from.address.toLowerCase() === address?.toLowerCase()).reduce((sum, tx) => sum + parseFloat(tx.value), 0);

  const getAddressType = (addr: string) => {
    const lower = addr.toLowerCase();
    const known = Object.entries(KNOWN_ADDRESSES).find(([key]) => key.toLowerCase() === lower);
    if (known) return known[1];
    return { label: 'Unknown', type: 'unknown' };
  };

  const formatValue = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
    return val.toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.exchange + '20' }}>
            <GitBranch className="w-5 h-5" style={{ color: colors.exchange }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Token Flow</h2>
            <p className="text-sm opacity-60">Visualize token movements and identify patterns</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: colors.accent }} />
            <span className="text-sm opacity-60">Total Volume</span>
          </div>
          <div className="text-2xl font-bold">{formatValue(totalVolume)} ETH</div>
        </div>

        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: colors.success }} />
            <span className="text-sm opacity-60">In Flow</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{formatValue(inFlow)} ETH</div>
        </div>

        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4" style={{ color: colors.danger }} />
            <span className="text-sm opacity-60">Out Flow</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{formatValue(outFlow)} ETH</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 opacity-60" />
          <span className="text-sm opacity-60">Min value:</span>
        </div>
        <select
          value={minValue}
          onChange={(e) => setMinValue(parseFloat(e.target.value))}
          className="px-4 py-2 rounded-lg border"
          style={{ background: colors.bgCard, borderColor: colors.border }}
        >
          <option value="0">All</option>
          <option value="1">≥ 1 ETH</option>
          <option value="10">≥ 10 ETH</option>
          <option value="100">≥ 100 ETH</option>
        </select>

        <div className="ml-auto text-sm opacity-60">
          {filteredTxs.length} transactions
        </div>
      </div>

      {/* Flow Timeline */}
      <div className="space-y-4">
        {Object.entries(groupedTxs).sort(([a], [b]) => b.localeCompare(a)).map(([time, txs]) => (
          <div key={time} className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 opacity-60" />
              <span className="text-sm font-medium">{time}</span>
              <span className="ml-auto text-sm opacity-60">
                {txs.length} txs
              </span>
            </div>

            <div className="space-y-2">
              {txs.map((tx, i) => {
                const isOutgoing = tx.from.address.toLowerCase() === address?.toLowerCase();
                const counterparty = isOutgoing ? tx.to.address : tx.from.address;
                const counterType = getAddressType(counterparty);
                const value = parseFloat(tx.value);

                return (
                  <div
                    key={tx.hash + i}
                    className="flex items-center gap-4 p-3 rounded-lg"
                    style={{ background: colors.bgSecondary }}
                  >
                    {/* Direction */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: isOutgoing ? colors.danger + '20' : colors.success + '20' }}
                    >
                      {isOutgoing ? (
                        <TrendingDown className="w-4 h-4" style={{ color: colors.danger }} />
                      ) : (
                        <TrendingUp className="w-4 h-4" style={{ color: colors.success }} />
                      )}
                    </div>

                    {/* Addresses */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-60">{isOutgoing ? 'TO' : 'FROM'}</span>
                        <span className="font-mono text-sm">
                          {counterparty.slice(0, 8)}...{counterparty.slice(-6)}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ background: typeColors[counterType.type] + '20', color: typeColors[counterType.type] }}
                        >
                          {counterType.type}
                        </span>
                      </div>
                    </div>

                    {/* Value */}
                    <div className={`font-bold ${isOutgoing ? 'text-red-500' : 'text-green-500'}`}>
                      {isOutgoing ? '-' : '+'}{value.toFixed(4)} ETH
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 opacity-30" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedTxs).length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 mx-auto opacity-30 mb-3" />
            <p className="opacity-60">No transactions to display</p>
            <p className="text-sm opacity-40 mt-1">Enter a wallet address above to see token flows</p>
          </div>
        )}
      </div>

      {/* Mini Canvas Visualization */}
      {filteredTxs.length > 0 && (
        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <h3 className="font-semibold mb-4">Flow Visualization</h3>
          <div className="h-32 flex items-center justify-center gap-2 overflow-hidden">
            {filteredTxs.slice(0, 50).map((tx, i) => {
              const isOutgoing = tx.from.address.toLowerCase() === address?.toLowerCase();
              const value = Math.min(parseFloat(tx.value) / 10, 1);

              return (
                <div
                  key={tx.hash}
                  className="w-1 rounded-full transition-all"
                  style={{
                    height: `${20 + value * 60}px`,
                    background: isOutgoing ? colors.danger : colors.success,
                    opacity: 0.3 + value * 0.5
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: colors.success }}></div>
              In Flow
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: colors.danger }}></div>
              Out Flow
            </span>
          </div>
        </div>
      )}
    </div>
  );
}