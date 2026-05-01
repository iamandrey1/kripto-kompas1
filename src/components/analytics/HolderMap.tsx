import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Search, Globe, Link2, Copy, ExternalLink, TrendingUp, TrendingDown, Users, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface HolderMapProps {
  etherscanKey: string;
}

// Token holder data structure
interface TokenHolder {
  rank: number;
  address: string;
  quantity: string;
  percentage: number;
  label?: string;
  isContract?: boolean;
  isExchange?: boolean;
  isDefi?: boolean;
  isWhale?: boolean;
  isDao?: boolean;
}

// Chain configuration
const CHAINS = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', explorer: 'etherscan.io', color: '#627EEA' },
  arbitrum: { name: 'Arbitrum', symbol: 'ARB', explorer: 'arbiscan.io', color: '#28A0F0' },
  optimism: { name: 'Optimism', symbol: 'OP', explorer: 'optimistic.etherscan.io', color: '#FF0420' },
  base: { name: 'Base', symbol: 'ETH', explorer: 'basescan.org', color: '#0057FF' },
  polygon: { name: 'Polygon', symbol: 'MATIC', explorer: 'polygonscan.com', color: '#8247E5' },
  bsc: { name: 'BNB Chain', symbol: 'BNB', explorer: 'bscscan.com', color: '#F3BA2F' },
};

// Known labels for addresses
const KNOWN_ADDRESSES: Record<string, { label: string; type: 'exchange' | 'defi' | 'bridge' | 'dao' | 'whale' }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance Hot', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 14', type: 'exchange' },
  '0xdfd5293d8e347dfe59e90efd55b2956a134b3db': { label: 'Binance 16', type: 'exchange' },
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': { label: 'Binance Cold', type: 'exchange' },
  '0xa34f4f2cd23f72e19b00c657baa3d38cdde11e4e': { label: 'Binance 17', type: 'exchange' },
  '0xb5d85cbf7cb3ee0d56b8ea30c8e1c3b8b8e0a12e': { label: 'Coinbase Hot', type: 'exchange' },
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0b2': { label: 'Kraken', type: 'exchange' },
  '0x0a869d79a7052c7ab1f8cdd8d5a77d43e9e8d8a2': { label: 'Uniswap V3', type: 'defi' },
  '0x8ad599c3a0ff1de082011efdddc1616b23c1e5d7': { label: 'Uniswap V3 USDC', type: 'defi' },
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640': { label: 'Uniswap V3 WETH', type: 'defi' },
  '0xc36442b4a4522e871399cd717abdd847ab11fe8d7': { label: 'Uniswap V3 NFT', type: 'defi' },
  '0xae7ab96520de3a8e7e46d8f8d0cfb7b3e3f8c71e': { label: 'Aave V3', type: 'defi' },
  '0x87870bca3f3fd6335c3f4ce8392d69350b4aa4b8': { label: 'Aave V3', type: 'defi' },
  '0x7d2768de32b0b80b7b3454d6b9a8c9e2e01e5c9e': { label: 'Aave V2', type: 'defi' },
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': { label: 'WMATIC', type: 'bridge' },
  '0x52d800ca26211dc6c2b4609a6e8505f0b9d8d0e6': { label: 'USDC Bridge', type: 'bridge' },
  '0x40c822d5305f5ec9c6c8c9f8e8e8e8e8e8e8e8e8': { label: 'Optimism Bridge', type: 'bridge' },
  '0x35101c13b0e4a12580f7e2e7f7f7f7f7f7f7f7f7': { label: 'Arbitrum Bridge', type: 'bridge' },
};

// Sample tokens with mock holder data for demo
const SAMPLE_TOKENS: Record<string, { name: string; symbol: string; holders: TokenHolder[] }> = {
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
    name: 'Uniswap',
    symbol: 'UNI',
    holders: [
      { rank: 1, address: '0x28c6c06298d514db089934071355e5743bf21d60', quantity: '149,523,000', percentage: 14.95, label: 'Binance Hot', isExchange: true },
      { rank: 2, address: '0x0a869d79a7052c7ab1f8cdd8d5a77d43e9e8d8a2', quantity: '86,234,567', percentage: 8.62, label: 'Uniswap V3', isDefi: true },
      { rank: 3, address: '0x8ad599c3a0ff1de082011efdddc1616b23c1e5d7', quantity: '45,678,901', percentage: 4.57, label: 'Uniswap V3 USDC', isDefi: true },
      { rank: 4, address: '0xa34f4f2cd23f72e19b00c657baa3d38cdde11e4e', quantity: '38,901,234', percentage: 3.89, label: 'Binance 17', isExchange: true },
      { rank: 5, address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', quantity: '32,456,789', percentage: 3.25, label: 'Binance 14', isExchange: true },
      { rank: 6, address: '0xdfd5293d8e347dfe59e90efd55b2956a134b3db', quantity: '28,765,432', percentage: 2.88, label: 'Binance 16', isExchange: true },
      { rank: 7, address: '0x47d9f9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8e8', quantity: '21,234,567', percentage: 2.12, label: 'Paradigm', isWhale: true },
      { rank: 8, address: '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', quantity: '19,876,543', percentage: 1.99, label: 'Binance Cold', isExchange: true },
      { rank: 9, address: '0x5a4ea3c0e7c8d3e7e8f8e8e8e8e8e8e8e8e8e8', quantity: '15,678,901', percentage: 1.57, label: 'a16z', isWhale: true },
      { rank: 10, address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0b2', quantity: '12,345,678', percentage: 1.23, label: 'Kraken', isExchange: true },
    ]
  },
  '0x514910771af9ca656af840dff83e8264ecf986ca': {
    name: 'Chainlink',
    symbol: 'LINK',
    holders: [
      { rank: 1, address: '0x28c6c06298d514db089934071355e5743bf21d60', quantity: '234,567,890', percentage: 23.46, label: 'Binance Hot', isExchange: true },
      { rank: 2, address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', quantity: '156,789,012', percentage: 15.68, label: 'Binance 14', isExchange: true },
      { rank: 3, address: '0x47d9f9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8e8', quantity: '89,012,345', percentage: 8.90, label: 'Chainlink Reserve', isDao: true },
      { rank: 4, address: '0x5a4ea3c0e7c8d3e7e8f8e8e8e8e8e8e8e8e8e8', quantity: '67,890,123', percentage: 6.79, label: 'Binance 17', isExchange: true },
      { rank: 5, address: '0xa34f4f2cd23f72e19b00c657baa3d38cdde11e4e', quantity: '45,678,901', percentage: 4.57, label: 'Coinbase', isExchange: true },
      { rank: 6, address: '0xdfd5293d8e347dfe59e90efd55b2956a134b3db', quantity: '34,567,890', percentage: 3.46, label: 'Binance 16', isExchange: true },
      { rank: 7, address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0b2', quantity: '28,901,234', percentage: 2.89, label: 'Kraken', isExchange: true },
      { rank: 8, address: '0x6c8f3e9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8', quantity: '23,456,789', percentage: 2.35, label: 'Whale 842', isWhale: true },
      { rank: 9, address: '0x7d2a4e8f9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8', quantity: '19,012,345', percentage: 1.90, label: 'DeFi Whale', isWhale: true },
      { rank: 10, address: '0x8e3f4d9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8', quantity: '15,678,901', percentage: 1.57, label: '1inch DAO', isDao: true },
    ]
  },
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': {
    name: 'Aave',
    symbol: 'AAVE',
    holders: [
      { rank: 1, address: '0x28c6c06298d514db089934071355e5743bf21d60', quantity: '1,234,567', percentage: 12.35, label: 'Binance Hot', isExchange: true },
      { rank: 2, address: '0x47d9f9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8e8', quantity: '876,543', percentage: 8.77, label: 'Aave Treasury', isDao: true },
      { rank: 3, address: '0x5a4ea3c0e7c8d3e7e8f8e8e8e8e8e8e8e8e8e8', quantity: '654,321', percentage: 6.54, label: 'Binance 14', isExchange: true },
      { rank: 4, address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', quantity: '432,109', percentage: 4.32, label: 'Binance 17', isExchange: true },
      { rank: 5, address: '0xa34f4f2cd23f72e19b00c657baa3d38cdde11e4e', quantity: '345,678', percentage: 3.46, label: 'Coinbase', isExchange: true },
      { rank: 6, address: '0xdfd5293d8e347dfe59e90efd55b2956a134b3db', quantity: '298,765', percentage: 2.99, label: 'Kraken', isExchange: true },
      { rank: 7, address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0b2', quantity: '234,567', percentage: 2.35, label: 'FTX', isExchange: true },
      { rank: 8, address: '0x6c8f3e9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8', quantity: '198,765', percentage: 1.99, label: 'Whale 127', isWhale: true },
      { rank: 9, address: '0x7d2a4e8f9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8', quantity: '165,432', percentage: 1.65, label: 'Aave DAO', isDao: true },
      { rank: 10, address: '0x8e3f4d9c0bb9d6b4f7e8f8e8e8e8e8e8e8e8e8', quantity: '123,456', percentage: 1.23, label: 'Whale 333', isWhale: true },
    ]
  },
};

// Bubble colors for holders
const BUBBLE_COLORS = [
  '#FF6B6B', // Red - Exchange
  '#4ECDC4', // Teal - DeFi
  '#45B7D1', // Blue - Bridge
  '#96CEB4', // Green - DAO
  '#FFEAA7', // Yellow - Whale
  '#DDA0DD', // Plum - Other
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
];

export default function HolderMap({ etherscanKey }: HolderMapProps) {
  const { colors } = useTheme();
  const [tokenAddress, setTokenAddress] = useState('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984');
  const [chain, setChain] = useState<keyof typeof CHAINS>('ethereum');
  const [loading, setLoading] = useState(false);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHolders, setExpandedHolders] = useState<Set<number>>(new Set([1, 2, 3]));
  const [showList, setShowList] = useState(false);

  // Calculate bubble sizes based on percentage
  const getBubbleSize = (percentage: number, maxPercentage: number = 25) => {
    const minSize = 40;
    const maxSize = 120;
    const normalizedSize = (percentage / maxPercentage) * (maxSize - minSize) + minSize;
    return Math.max(minSize, Math.min(maxSize, normalizedSize));
  };

  // Calculate positions in circular layout
  const getBubblePosition = (index: number, total: number, centerX: number, centerY: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  };

  // Load holder data
  const loadHolders = async () => {
    setLoading(true);

    // Check if we have sample data for this token
    const normalizedAddress = tokenAddress.toLowerCase();
    const sampleData = SAMPLE_TOKENS[normalizedAddress];

    if (sampleData) {
      setTokenInfo({ name: sampleData.name, symbol: sampleData.symbol });
      setHolders(sampleData.holders);
    } else {
      // Generate mock data for any address
      const mockHolders = Array.from({ length: 10 }, (_, i) => {
        const percentage = (15 - i * 1.5 + Math.random() * 0.5).toFixed(2);
        const address = `0x${Math.random().toString(16).substr(2, 40)}`;
        return {
          rank: i + 1,
          address,
          quantity: (Math.random() * 100 + 10).toFixed(0) + 'M',
          percentage: parseFloat(percentage),
          label: i < 3 ? `Top Holder ${i + 1}` : undefined,
          isExchange: i < 2,
          isDefi: i >= 2 && i < 4,
          isWhale: i >= 4 && i < 6,
        };
      });

      setTokenInfo({ name: 'Token', symbol: 'TKN' });
      setHolders(mockHolders);
    }

    setLoading(false);
  };

  // Search for known token
  const searchToken = (address: string) => {
    const normalized = address.toLowerCase();
    if (SAMPLE_TOKENS[normalized]) {
      setTokenAddress(address);
      loadHolders();
    }
  };

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  // Toggle holder expansion
  const toggleHolder = (rank: number) => {
    const newExpanded = new Set(expandedHolders);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedHolders(newExpanded);
  };

  useEffect(() => {
    loadHolders();
  }, [chain]);

  // Calculate total exchange/DeFi concentration
  const concentration = useMemo(() => {
    const exchange = holders.filter(h => h.isExchange).reduce((sum, h) => sum + h.percentage, 0);
    const defi = holders.filter(h => h.isDefi).reduce((sum, h) => sum + h.percentage, 0);
    const whale = holders.filter(h => h.isWhale).reduce((sum, h) => sum + h.percentage, 0);
    const dao = holders.filter(h => h.isDao).reduce((sum, h) => sum + h.percentage, 0);
    return { exchange, defi, whale, dao, other: 100 - exchange - defi - whale - dao };
  }, [holders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.exchange + '20' }}>
          <Globe className="w-5 h-5" style={{ color: colors.exchange }} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Token Holder Map</h2>
          <p className="text-sm opacity-60">Визуализация держателей как в Bubblemaps</p>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Token Address Input */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Введите адрес токена (0x...)"
              className="w-full pl-12 pr-4 py-3 rounded-xl border outline-none"
              style={{ background: colors.bgCard, borderColor: colors.border, color: colors.text }}
            />
            <button
              onClick={loadHolders}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors"
              style={{ background: colors.accent + '20', color: colors.accent }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Chain Selector */}
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value as keyof typeof CHAINS)}
          className="px-4 py-3 rounded-xl border outline-none"
          style={{ background: colors.bgCard, borderColor: colors.border, color: colors.text }}
        >
          {Object.entries(CHAINS).map(([key, { name }]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>

        {/* Quick Tokens */}
        <div className="flex gap-2">
          {Object.entries(SAMPLE_TOKENS).slice(0, 3).map(([address, { symbol }]) => (
            <button
              key={address}
              onClick={() => {
                setTokenAddress(address);
                loadHolders();
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tokenAddress.toLowerCase() === address.toLowerCase() ? colors.accent + '20' : colors.bgSecondary,
                border: `1px solid ${tokenAddress.toLowerCase() === address.toLowerCase() ? colors.accent : colors.border}`,
                color: tokenAddress.toLowerCase() === address.toLowerCase() ? colors.accent : colors.text,
              }}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Concentration Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Биржи', value: concentration.exchange, color: colors.exchange, icon: '🏦' },
          { label: 'DeFi', value: concentration.defi, color: colors.defi, icon: '🔄' },
          { label: 'Киты', value: concentration.whale, color: colors.warning, icon: '🐋' },
          { label: 'DAO', value: concentration.dao, color: colors.dao, icon: '🏛️' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border"
            style={{ background: colors.bgCard, borderColor: colors.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-sm" style={{ color: colors.textSecondary }}>{stat.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value.toFixed(1)}%
            </div>
            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: colors.bgSecondary }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(stat.value, 50)}%`, background: stat.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bubble Map Visualization */}
      <div
        className="relative rounded-2xl border overflow-hidden"
        style={{ background: colors.bgCard, borderColor: colors.border, minHeight: '400px' }}
      >
        {/* Token Info Overlay */}
        {tokenInfo && (
          <div className="absolute top-4 left-4 z-20 p-4 rounded-xl backdrop-blur-md" style={{ background: colors.bg + 'CC' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: colors.gradient }}>
                {tokenInfo.symbol.slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold">{tokenInfo.name}</h3>
                <span className="text-sm" style={{ color: colors.textSecondary }}>{tokenInfo.symbol}</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-3 p-4 rounded-xl backdrop-blur-md" style={{ background: colors.bg + 'CC' }}>
          {[
            { label: 'Exchange', color: colors.exchange },
            { label: 'DeFi', color: colors.defi },
            { label: 'Bridge', color: '#45B7D1' },
            { label: 'DAO', color: colors.dao },
            { label: 'Whale', color: colors.warning },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Bubbles Container */}
        <div className="relative w-full h-[400px] flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
              <span>Загрузка данных...</span>
            </div>
          ) : holders.length > 0 ? (
            <>
              {/* Central Token */}
              <div
                className="absolute z-10 w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}80)`,
                  boxShadow: `0 0 40px ${colors.accent}40`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="text-center">
                  <div>{tokenInfo?.symbol || 'TKN'}</div>
                  <div className="text-xs font-normal">{holders.length} holders</div>
                </div>
              </div>

              {/* Holder Bubbles */}
              {holders.slice(0, 10).map((holder, index) => {
                const size = getBubbleSize(holder.percentage);
                const position = getBubblePosition(index, Math.min(holders.length, 10), 200, 200, 140);

                const getColor = () => {
                  if (holder.isExchange) return colors.exchange;
                  if (holder.isDefi) return colors.defi;
                  if (holder.isDao) return colors.dao;
                  if (holder.isWhale) return colors.warning;
                  return BUBBLE_COLORS[index % BUBBLE_COLORS.length];
                };

                return (
                  <div
                    key={holder.rank}
                    className="absolute flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      background: `${getColor()}30`,
                      border: `2px solid ${getColor()}`,
                      boxShadow: `0 0 20px ${getColor()}40`,
                      left: `calc(50% + ${position.x}px - ${size / 2}px)`,
                      top: `calc(50% + ${position.y}px - ${size / 2}px)`,
                      zIndex: index + 1,
                    }}
                    onClick={() => toggleHolder(holder.rank)}
                    title={`${holder.label || 'Unknown'}: ${holder.percentage.toFixed(2)}%`}
                  >
                    <div className="text-center p-2">
                      <div className="text-xs font-bold" style={{ color: getColor() }}>
                        {holder.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs opacity-70 truncate max-w-[80px]">
                        {holder.label?.split(' ')[0] || holder.address.slice(0, 4)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {holders.slice(0, 10).map((holder, index) => {
                  const position = getBubblePosition(index, Math.min(holders.length, 10), 200, 200, 140);
                  return (
                    <line
                      key={index}
                      x1="50%"
                      y1="50%"
                      x2={`calc(50% + ${position.x}px)`}
                      y2={`calc(50% + ${position.y}px)`}
                      stroke={colors.border}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.3"
                    />
                  );
                })}
              </svg>
            </>
          ) : (
            <div className="text-center" style={{ color: colors.textSecondary }}>
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Введите адрес токена для загрузки данных</p>
            </div>
          )}
        </div>
      </div>

      {/* Holder List Toggle */}
      <button
        onClick={() => setShowList(!showList)}
        className="w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition-all"
        style={{ background: colors.bgCard, borderColor: colors.border }}
      >
        <Users className="w-4 h-4" />
        <span>Показать список держателей ({holders.length})</span>
        {showList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Holder List */}
      {showList && (
        <div className="rounded-xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium" style={{ color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>
            <div className="col-span-1">#</div>
            <div className="col-span-4">Адрес / Метка</div>
            <div className="col-span-3 text-right">Количество</div>
            <div className="col-span-2 text-right">Доля</div>
            <div className="col-span-2">Тип</div>
          </div>

          {holders.map((holder) => (
            <div
              key={holder.rank}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/5 transition-colors"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <div className="col-span-1 text-sm" style={{ color: colors.textSecondary }}>
                {holder.rank}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: holder.isExchange ? colors.exchange + '30' : holder.isDefi ? colors.defi + '30' : colors.bgSecondary, color: holder.isExchange ? colors.exchange : holder.isDefi ? colors.defi : colors.text }}
                >
                  {holder.address.slice(2, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {holder.label || 'Unknown'}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: colors.textSecondary }}>
                    <span className="font-mono truncate">{holder.address.slice(0, 10)}...</span>
                    <button
                      onClick={() => copyAddress(holder.address)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <a
                      href={`https://${CHAINS[chain].explorer}/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="col-span-3 text-right text-sm font-medium">
                {holder.quantity}
              </div>
              <div className="col-span-2 text-right">
                <div className="inline-flex items-center gap-1">
                  <span className="font-bold" style={{ color: holder.percentage > 5 ? colors.warning : colors.text }}>
                    {holder.percentage.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: colors.bgSecondary }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(holder.percentage * 4, 100)}%`,
                      background: holder.percentage > 5 ? colors.warning : colors.accent
                    }}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    background: holder.isExchange ? colors.exchange + '20' : holder.isDefi ? colors.defi + '20' : holder.isWhale ? colors.warning + '20' : colors.bgSecondary,
                    color: holder.isExchange ? colors.exchange : holder.isDefi ? colors.defi : holder.isWhale ? colors.warning : colors.textSecondary
                  }}
                >
                  {holder.isExchange ? 'Exchange' : holder.isDefi ? 'DeFi' : holder.isWhale ? 'Whale' : holder.isDao ? 'DAO' : 'Other'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risk Assessment */}
      <div className="rounded-xl border p-5" style={{ background: colors.bgCard, borderColor: colors.border }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: colors.accent }} />
          Оценка рисков распределения
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {/* Centralization Risk */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Централизация</span>
              <span className="text-sm font-bold" style={{ color: concentration.exchange > 40 ? colors.danger : colors.success }}>
                {concentration.exchange > 40 ? 'Высокий' : concentration.exchange > 20 ? 'Средний' : 'Низкий'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bgSecondary }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${concentration.exchange * 2}%`,
                  background: concentration.exchange > 40 ? colors.danger : concentration.exchange > 20 ? colors.warning : colors.success
                }}
              />
            </div>
            <div className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
              Биржи: {concentration.exchange.toFixed(1)}%
            </div>
          </div>

          {/* Top 10 Concentration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Топ-10</span>
              <span className="text-sm font-bold" style={{ color: holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0) > 60 ? colors.danger : colors.success }}>
                {holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bgSecondary }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0) * 0.7}%`,
                  background: holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0) > 60 ? colors.danger : colors.success
                }}
              />
            </div>
            <div className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
              Сумма топ-10 держателей
            </div>
          </div>

          {/* Whale Activity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Активность китов</span>
              <span className="text-sm font-bold" style={{ color: concentration.whale > 30 ? colors.warning : colors.success }}>
                {concentration.whale > 30 ? 'Высокая' : concentration.whale > 15 ? 'Средняя' : 'Низкая'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bgSecondary }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${concentration.whale * 2}%`,
                  background: concentration.whale > 30 ? colors.warning : colors.success
                }}
              />
            </div>
            <div className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
              Киты: {concentration.whale.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}