import { useState, useEffect } from 'react';
import {
  Search,
  Wallet,
  Map,
  Brain,
  ChevronRight,
  Zap,
  Eye,
  Users,
  Clock,
  Newspaper,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  TrendingUp,
  Menu,
  X,
  Plus,
  Star,
  ExternalLink,
  Copy,
  Loader2,
  Moon,
  Sun,
  BarChart3,
  Bell,
  Settings,
  LogIn,
  LogOut,
  User as UserIcon,
  Globe,
  MessageSquare
} from 'lucide-react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { EtherscanProvider, HeliusProvider } from '../lib/api-providers/wallet';
import WalletTracker from '../components/analytics/WalletTracker';
import TokenFlow from '../components/analytics/TokenFlow';
import HolderAnalysis from '../components/analytics/HolderAnalysis';
import HolderMap from '../components/analytics/HolderMap';
import Alerts from '../components/analytics/Alerts';
import AIAnalysis from '../components/analytics/AIAnalysis';
import TokenScanner from '../components/analytics/TokenScanner';
import AIDashboard from '../components/analytics/AIDashboard';
import AuthModal from '../components/auth/AuthModal';
import { fetchEthWalletData, fetchSolWalletData, askGroqAI, EthWalletData, SolWalletData } from '../lib/api-helpers';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// API Keys from environment
const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || '';
const HELIUS_KEY = import.meta.env.VITE_HELIUS_API_KEY || '';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Navigation tabs
type TabType = 'dashboard' | 'market' | 'wallet' | 'tokenflow' | 'holders' | 'holdermap' | 'alerts' | 'ai' | 'scanner';

const tabs = [
  { id: 'dashboard' as TabType, icon: <Brain className="w-4 h-4" />, label: 'AI Dashboard' },
  { id: 'market' as TabType, icon: <TrendingUp className="w-4 h-4" />, label: 'Market' },
  { id: 'wallet' as TabType, icon: <Wallet className="w-4 h-4" />, label: 'Wallet Tracker' },
  { id: 'tokenflow' as TabType, icon: <ArrowUpDown className="w-4 h-4" />, label: 'Token Flow' },
  { id: 'holdermap' as TabType, icon: <Globe className="w-4 h-4" />, label: 'Holder Map' },
  { id: 'holders' as TabType, icon: <Users className="w-4 h-4" />, label: 'Holders' },
  { id: 'alerts' as TabType, icon: <Bell className="w-4 h-4" />, label: 'Alerts' },
  { id: 'ai' as TabType, icon: <MessageSquare className="w-4 h-4" />, label: 'AI Chat' },
  { id: 'scanner' as TabType, icon: <Shield className="w-4 h-4" />, label: 'Scanner' },
];

// Starfield background
const Starfield = () => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    twinkle: number;
    speed: number;
    vx: number;
    vy: number;
  }>>([]);

  useEffect(() => {
    const initialStars = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      twinkle: Math.random(),
      speed: Math.random() * 0.002 + 0.001,
      vx: (Math.random() - 0.5) * 0.02,
      vy: -Math.random() * 0.02 - 0.01,
    }));
    setStars(initialStars);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStars((prev) =>
        prev.map((star) => {
          let newY = star.y + star.vy;
          let newX = star.x + star.vx;
          if (newY < -5) newY = 105;
          if (newY > 105) newY = -5;
          if (newX < -5) newX = 105;
          if (newX > 105) newX = -5;

          return {
            ...star,
            twinkle: (Math.sin(Date.now() * star.speed + star.id) + 1) / 2,
            y: newY,
            x: newX,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const connections = stars.flatMap((star, i) => {
    const result: Array<{x1: number; y1: number; x2: number; y2: number; opacity: number}> = [];

    stars.slice(i + 1).forEach((other) => {
      const dx = star.x - other.x;
      const dy = star.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 6) {
        result.push({
          x1: star.x, y1: star.y,
          x2: other.x, y2: other.y,
          opacity: (6 - distance) / 6 * 0.25,
        });
      }
    });

    const mdx = star.x - mousePos.x;
    const mdy = star.y - mousePos.y;
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
    if (mdist < 20) {
      result.push({
        x1: star.x, y1: star.y,
        x2: mousePos.x, y2: mousePos.y,
        opacity: (20 - mdist) / 20 * 0.5,
      });
    }

    return result;
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg className="absolute inset-0 w-full h-full">
        {connections.map((conn, i) => (
          <line
            key={i}
            x1={`${conn.x1}%`}
            y1={`${conn.y1}%`}
            x2={`${conn.x2}%`}
            y2={`${conn.y2}%`}
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="1"
            strokeDasharray="2 5"
            opacity={conn.opacity * 2.5}
          />
        ))}
      </svg>

      {stars.map((star) => {
        const mdx = star.x - mousePos.x;
        const mdy = star.y - mousePos.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const nearMouse = mdist < 35;
        const moveFactor = nearMouse ? (35 - mdist) / 35 : 0;

        return (
          <div
            key={star.id}
            className="absolute rounded-full transition-all duration-200"
            style={{
              left: `${star.x + mdx * moveFactor * 0.15}%`,
              top: `${star.y + mdy * moveFactor * 0.15}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: `rgba(255, 255, 255, ${nearMouse ? 0.95 : 0.3 + star.twinkle * 0.5})`,
              boxShadow: `0 0 ${nearMouse ? 6 : 2 + star.twinkle * 3}px rgba(255, 255, 255, ${nearMouse ? 0.9 : star.twinkle * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
};

// Main content component that uses theme
function MainContent() {
  const { colors, theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Привет! Я AI-консультант. Спроси меня о любом кошельке или токене.' }
  ]);

  // Auth state
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Token prices state
  const [tokenPrices, setTokenPrices] = useState<{[key: string]: {price: number; change: number; marketCap?: number}}>({});
  const [globalStats, setGlobalStats] = useState<{marketCap: number; volume24h: number; btcDominance: number} | null>(null);
  const [topCoins, setTopCoins] = useState<Array<{id: string; name: string; symbol: string; image: string; price: number; change: number; marketCap: number}>>([]);
  const [trendingCoins, setTrendingCoins] = useState<Array<{id: string; name: string; symbol: string; thumb: string; price?: number; change?: number}>>([]);

  // Wallet data states
  const [ethWalletData, setEthWalletData] = useState<EthWalletData | null>(null);
  const [solWalletData, setSolWalletData] = useState<SolWalletData | null>(null);
  const [walletType, setWalletType] = useState<'eth' | 'sol'>('eth');
  const [isLoading, setIsLoading] = useState(false);

  // Token detail state
  const [selectedToken, setSelectedToken] = useState<{id: string; name: string; symbol: string} | null>(null);
  const [tokenDetail, setTokenDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistCoins, setWatchlistCoins] = useState<Array<{id: string; name: string; symbol: string; price: number; change: number}>>([]);

  // Fetch global market stats
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        if (data.data) {
          setGlobalStats({
            marketCap: data.data.total_market_cap?.usd || 0,
            volume24h: data.data.total_volume?.usd || 0,
            btcDominance: data.data.market_cap_percentage?.btc || 0
          });
        }
      } catch (error) {
        console.log('Global stats error:', error);
      }
    };

    const fetchTopCoins = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false'
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setTopCoins(data.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            image: coin.image,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            marketCap: coin.market_cap
          })));
        }
      } catch (error) {
        console.log('Top coins error:', error);
      }
    };

    fetchGlobalStats();
    fetchTopCoins();
  }, []);

  // Fetch token prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const tokenIds = topTokens.map(t => t.id).join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
        );
        const data = await response.json();

        const prices: {[key: string]: {price: number; change: number; marketCap?: number}} = {};
        topTokens.forEach(token => {
          if (data[token.id]) {
            prices[token.id] = {
              price: data[token.id].usd,
              change: data[token.id].usd_24h_change || 0,
              marketCap: data[token.id].usd_market_cap
            };
          }
        });

        setTokenPrices(prices);
      } catch (error) {
        console.log('CoinGecko API error:', error);
      }
    };

    const fetchTrending = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
        const data = await response.json();
        if (data.coins) {
          setTrendingCoins(data.coins.slice(0, 7).map((c: any) => ({
            id: c.item.id,
            name: c.item.name,
            symbol: c.item.symbol.toUpperCase(),
            thumb: c.item.thumb,
            price: c.item.price_btc ? c.item.price_btc : undefined,
            change: c.item.price_change_percentage_24h_btc || 0
          })));
        }
      } catch (error) {
        console.log('Trending API error:', error);
      }
    };

    fetchPrices();
    fetchTrending();
    const interval = setInterval(() => {
      fetchPrices();
      fetchTrending();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auth state check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    const query = searchQuery.trim();

    if (query.startsWith('0x') && query.length === 42) {
      setWalletType('eth');
      setActiveTab('wallet');
      const walletData = await fetchEthWalletData(query);
      if (walletData) {
        setEthWalletData(walletData);
      }
    } else if (query.length > 30 && !query.startsWith('0x')) {
      setWalletType('sol');
      setActiveTab('wallet');
      const walletData = await fetchSolWalletData(query);
      if (walletData) {
        setSolWalletData(walletData);
      }
    }

    setIsLoading(false);
  };

  // Handle AI chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage("");
    setAiLoading(true);

    try {
      const aiResponse = await askGroqAI(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Произошла ошибка. Попробуйте ещё раз.' }]);
    }

    setAiLoading(false);
  };

  // Fetch token detail
  const fetchTokenDetail = async (tokenId: string, name: string, symbol: string) => {
    setSelectedToken({ id: tokenId, name, symbol });
    setIsLoadingDetail(true);
    setPriceHistory([]);

    try {
      const [coinRes, chartRes] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&community_data=false&developer_data=false`),
        fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=7`)
      ]);

      const data = await coinRes.json();
      const chartData = await chartRes.json();

      if (chartData.prices) {
        setPriceHistory(chartData.prices.map((p: number[]) => p[1]));
      }

      setTokenDetail({
        price: data.market_data?.current_price?.usd,
        change24h: data.market_data?.price_change_percentage_24h,
        change7d: data.market_data?.price_change_percentage_7d,
        marketCap: data.market_data?.market_cap?.usd,
        volume24h: data.market_data?.total_volume?.usd,
        high24h: data.market_data?.high_24h?.usd,
        low24h: data.market_data?.low_24h?.usd,
        circulating: data.market_data?.circulating_supply,
        total: data.market_data?.total_supply,
        ath: data.market_data?.ath?.usd,
        athChange: data.market_data?.ath_change_percentage?.usd,
        image: data.image?.large,
        description: data.description?.en?.slice(0, 300)
      });
    } catch (error) {
      console.log('Token detail error:', error);
    }
    setIsLoadingDetail(false);
  };

  // Generate chart SVG path from price history
  const getChartPath = (prices: number[]) => {
    if (prices.length < 2) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 100;
    const height = 60;
    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Check if token is in watchlist
  const isInWatchlist = (tokenId: string) => watchlist.includes(tokenId);

  // Toggle watchlist
  const toggleWatchlist = (tokenId: string, name: string, symbol: string, price: number, change: number) => {
    if (isInWatchlist(tokenId)) {
      setWatchlist(prev => prev.filter(id => id !== tokenId));
      setWatchlistCoins(prev => prev.filter(c => c.id !== tokenId));
    } else {
      setWatchlist(prev => [...prev, tokenId]);
      setWatchlistCoins(prev => [...prev, { id: tokenId, name, symbol, price, change }]);
    }
  };

  // Token list
  const topTokens = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
    { id: 'optimism', name: 'Optimism', symbol: 'OP' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
    { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
    { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
  ];

  // News data
  const cryptoNews = [
    { title: 'Ethereum растёт на фоне обновления сети', source: 'CoinDesk', time: '1 ч.', type: 'bullish' },
    { title: 'Bitcoin удерживает позиции выше $95,000', source: 'The Block', time: '3 ч.', type: 'neutral' },
    { title: 'Новые ETF на Solana одобрены SEC', source: 'Decrypt', time: '5 ч.', type: 'bullish' },
  ];

  const smartMoneyData = [
    { name: 'Paradigm', action: 'Покупка ETH', amount: '$12.4M', date: '2 ч. назад', type: 'buy' },
    { name: 'Binance Hot', action: 'Вывод USDC', amount: '$50M', date: '5 ч. назад', type: 'sell' },
    { name: 'Whale #847', action: 'Покупка SOL', amount: '$8.2M', date: '8 ч. назад', type: 'buy' },
  ];

  const vestingData = [
    { token: 'SEI', amount: '$12.5M', date: 'Завтра', risk: 'high' },
    { token: 'OP', amount: '$8.2M', date: '3 дня', risk: 'medium' },
    { token: 'ARB', amount: '$3.1M', date: '5 дней', risk: 'low' },
  ];

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.text }}>
      <Starfield />

      {/* Header */}
      <header className="relative z-50 border-b backdrop-blur-md sticky top-0" style={{ background: colors.bg + '80', borderColor: colors.border + '20' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: colors.text }}>
                <span style={{ color: colors.accent }}>Андрей</span>
                <span>-Вова</span>
              </h1>
            </div>

            {/* Global Stats - Desktop */}
            <div className="hidden lg:flex items-center gap-5 text-xs">
              <div>
                <span style={{ color: colors.textSecondary }}>Капа: </span>
                <span className="font-medium">${globalStats ? (globalStats.marketCap / 1e12).toFixed(2) : '...'}T</span>
              </div>
              <div>
                <span style={{ color: colors.textSecondary }}>Объём: </span>
                <span className="font-medium">${globalStats ? (globalStats.volume24h / 1e9).toFixed(1) : '...'}B</span>
              </div>
              <div>
                <span style={{ color: colors.textSecondary }}>BTC: </span>
                <span className="font-medium" style={{ color: colors.warning }}>{globalStats ? globalStats.btcDominance.toFixed(1) : '...'}%</span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
              style={{ color: colors.textSecondary }}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: colors.bgSecondary }}>
                  <UserIcon className="w-4 h-4" style={{ color: colors.accent }} />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {currentUser.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-white/5 transition-all"
                  style={{ color: colors.textSecondary }}
                  title="Выйти"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
                style={{ background: colors.gradient, color: 'white' }}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Войти</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: activeTab === tab.id ? colors.accent + '20' : 'transparent',
                  color: activeTab === tab.id ? colors.accent : colors.textSecondary,
                }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="xl:hidden pb-4 border-t pt-4" style={{ borderColor: colors.border }}>
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className="p-3 rounded-xl border text-left transition-all flex items-center gap-2"
                    style={{
                      background: activeTab === tab.id ? colors.accent + '20' : colors.bgCard,
                      borderColor: colors.border,
                    }}
                  >
                    <span style={{ color: activeTab === tab.id ? colors.accent : colors.textSecondary }}>{tab.icon}</span>
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Введите адрес кошелька (0x...) или название токена..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-6 py-4 pl-14 rounded-2xl border outline-none transition-all"
              style={{
                background: colors.bgCard,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: colors.gradient, color: 'white' }}
            >
              {isLoading ? '...' : 'Искать'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'market' && (
          <div className="space-y-8">
            {/* Top Tokens Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {topTokens.slice(0, 10).map((token) => {
                const price = tokenPrices[token.id];
                const inWatchlist = isInWatchlist(token.id);
                return (
                  <div
                    key={token.id}
                    onClick={() => fetchTokenDetail(token.id, token.name, token.symbol)}
                    className="p-4 rounded-xl border cursor-pointer transition-all hover:border-opacity-50"
                    style={{ background: colors.bgCard, borderColor: colors.border }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(token.id, token.name, token.symbol, price?.price || 0, price?.change || 0);
                      }}
                      className={`float-right p-1 rounded-lg transition-all`}
                      style={{ color: inWatchlist ? colors.warning : colors.textSecondary }}
                    >
                      <Star className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
                    </button>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{token.symbol}</span>
                      {price && price.change !== undefined && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: price.change >= 0 ? colors.success + '20' : colors.danger + '20',
                            color: price.change >= 0 ? colors.success : colors.danger
                          }}
                        >
                          {price.change >= 0 ? '+' : ''}{price.change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold">
                      {price && price.price ? `$${price.price.toLocaleString()}` : '...'}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Trending */}
            {trendingCoins.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4" style={{ color: colors.warning }} />
                  <span className="text-sm font-medium" style={{ color: colors.warning }}>🔥 В тренде</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {trendingCoins.map((coin) => (
                    <div
                      key={coin.id}
                      onClick={() => fetchTokenDetail(coin.id, coin.name, coin.symbol)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap cursor-pointer"
                      style={{ background: colors.bgCard, borderColor: colors.border }}
                    >
                      <img src={coin.thumb} alt={coin.name} className="w-5 h-5 rounded-full" />
                      <span className="text-sm font-medium">{coin.symbol}</span>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{coin.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Coins Table */}
            {topCoins.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" style={{ color: colors.accent }} />
                  <span className="text-sm font-medium" style={{ color: colors.accent }}>Топ по капитализации</span>
                </div>
                <div className="rounded-xl border overflow-hidden" style={{ background: colors.bgCard, borderColor: colors.border }}>
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs" style={{ color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Монета</div>
                    <div className="col-span-3 text-right">Цена</div>
                    <div className="col-span-3 text-right">Капа</div>
                  </div>
                  {topCoins.slice(0, 10).map((coin, i) => (
                    <div
                      key={coin.id}
                      onClick={() => fetchTokenDetail(coin.id, coin.name, coin.symbol)}
                      className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center cursor-pointer transition-all hover:bg-white/5"
                    >
                      <div style={{ color: colors.textSecondary }}>{i + 1}</div>
                      <div className="col-span-5 flex items-center gap-2">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                        <span className="font-medium">{coin.name}</span>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>{coin.symbol}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span style={{ color: coin.change >= 0 ? colors.success : colors.danger }}>
                          ${coin.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-3 text-right" style={{ color: colors.textSecondary }}>
                        ${(coin.marketCap / 1e9).toFixed(1)}B
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4" style={{ color: colors.textSecondary }} />
                <span className="text-sm uppercase tracking-wider" style={{ color: colors.textSecondary }}>Новости</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cryptoNews.map((news, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border cursor-pointer transition-all hover:border-opacity-50"
                    style={{ background: colors.bgCard, borderColor: colors.border }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: news.type === 'bullish' ? colors.success + '20' : news.type === 'bearish' ? colors.danger + '20' : colors.bgSecondary,
                          color: news.type === 'bullish' ? colors.success : news.type === 'bearish' ? colors.danger : colors.textSecondary
                        }}
                      >
                        {news.type === 'bullish' ? '↑' : news.type === 'bearish' ? '↓' : '—'}
                      </span>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{news.source}</span>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>·</span>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{news.time}</span>
                    </div>
                    <p className="text-sm" style={{ color: colors.text }}>{news.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Money Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                <Eye className="w-5 h-5" style={{ color: colors.accent }} />
                <span>Smart Money</span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: colors.textSecondary }}>Последняя активность</h3>
                  <div className="space-y-3">
                    {smartMoneyData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: colors.bgSecondary, borderColor: colors.border }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: item.type === 'buy' ? colors.success + '20' : colors.danger + '20' }}
                          >
                            {item.type === 'buy' ? <ArrowUpRight className="w-4 h-4" style={{ color: colors.success }} /> : <ArrowDownRight className="w-4 h-4" style={{ color: colors.danger }} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>{item.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: colors.success }}>{item.amount}</p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: colors.textSecondary }}>AI Анализ</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border" style={{ background: colors.success + '10', borderColor: colors.success + '30' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4" style={{ color: colors.success }} />
                        <span className="text-sm" style={{ color: colors.success }}>Бычий сигнал</span>
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Paradigm накопил ETH на $12M за 48 часов.</p>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ background: colors.warning + '10', borderColor: colors.warning + '30' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4" style={{ color: colors.warning }} />
                        <span className="text-sm" style={{ color: colors.warning }}>Осторожно</span>
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Завтра разлог SEI на $12.5M.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vesting Calendar */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                <Clock className="w-5 h-5" style={{ color: colors.accent }} />
                <span>Vesting Calendar</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vestingData.map((item, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border"
                    style={{
                      background: item.risk === 'high' ? colors.danger + '10' : item.risk === 'medium' ? colors.warning + '10' : colors.success + '10',
                      borderColor: item.risk === 'high' ? colors.danger + '30' : item.risk === 'medium' ? colors.warning + '30' : colors.success + '30'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold">{item.token}</span>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: item.risk === 'high' ? colors.danger + '20' : item.risk === 'medium' ? colors.warning + '20' : colors.success + '20',
                          color: item.risk === 'high' ? colors.danger : item.risk === 'medium' ? colors.warning : colors.success
                        }}
                      >
                        {item.risk === 'high' ? 'Высокий' : item.risk === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-1">{item.amount}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Разлог через {item.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Consultant */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                <Brain className="w-5 h-5" style={{ color: colors.accent }} />
                <span>AI Консультант</span>
              </h2>
              <div className="rounded-xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[80%] p-4 rounded-2xl"
                        style={{
                          background: msg.role === 'ai' ? colors.accent + '10' : colors.accent,
                          borderColor: msg.role === 'ai' ? colors.accent + '30' : 'transparent',
                          color: msg.role === 'ai' ? colors.text : 'white'
                        }}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Спросите AI..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-3 rounded-xl border outline-none"
                    style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={aiLoading}
                    className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                    style={{ background: colors.gradient, color: 'white' }}
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <WalletTracker etherscanKey={ETHERSCAN_KEY} heliusKey={HELIUS_KEY} />
        )}

        {activeTab === 'tokenflow' && (
          <TokenFlow etherscanKey={ETHERSCAN_KEY} />
        )}

        {activeTab === 'holdermap' && (
          <HolderMap etherscanKey={ETHERSCAN_KEY} />
        )}

        {activeTab === 'holders' && (
          <HolderAnalysis etherscanKey={ETHERSCAN_KEY} />
        )}

        {activeTab === 'alerts' && (
          <Alerts etherscanKey={ETHERSCAN_KEY} heliusKey={HELIUS_KEY} />
        )}

        {activeTab === 'dashboard' && (
          <AIDashboard groqKey={GROQ_KEY} etherscanKey={ETHERSCAN_KEY} heliusKey={HELIUS_KEY} />
        )}

        {activeTab === 'ai' && (
          <AIAnalysis groqKey={GROQ_KEY} />
        )}

        {activeTab === 'scanner' && (
          <TokenScanner etherscanKey={ETHERSCAN_KEY} />
        )}
      </main>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedToken(null)}>
          <div
            className="w-full max-w-lg p-6 rounded-2xl border"
            onClick={e => e.stopPropagation()}
            style={{ background: colors.bgCard, borderColor: colors.border }}
          >
            {isLoadingDetail ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : tokenDetail ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {tokenDetail.image && <img src={tokenDetail.image} alt={selectedToken.name} className="w-10 h-10 rounded-full" />}
                    <div>
                      <h3 className="text-xl font-bold">{selectedToken.name}</h3>
                      <span className="text-sm" style={{ color: colors.textSecondary }}>{selectedToken.symbol}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedToken(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.bgSecondary }}>✕</button>
                </div>

                <div className="text-center mb-6">
                  <p className="text-4xl font-bold">${tokenDetail.price ? tokenDetail.price.toLocaleString() : '...'}</p>
                  <span
                    className="text-lg"
                    style={{ color: tokenDetail.change24h >= 0 ? colors.success : colors.danger }}
                  >
                    {tokenDetail.change24h >= 0 ? '+' : ''}{tokenDetail.change24h?.toFixed(2) ?? 0}% (24ч)
                  </span>
                </div>

                {/* Price Chart */}
                {priceHistory.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl" style={{ background: colors.bgSecondary }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: colors.textSecondary }}>Цена за 7 дней</span>
                      <span
                        className="text-xs"
                        style={{ color: tokenDetail.change7d >= 0 ? colors.success : colors.danger }}
                      >
                        {tokenDetail.change7d >= 0 ? '+' : ''}{tokenDetail.change7d?.toFixed(1) ?? 0}%
                      </span>
                    </div>
                    <svg viewBox="0 0 100 60" className="w-full h-16" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`grad-${selectedToken?.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={tokenDetail.change7d >= 0 ? colors.success : colors.danger} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={tokenDetail.change7d >= 0 ? colors.success : colors.danger} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${getChartPath(priceHistory)} L 100,60 L 0,60 Z`} fill={`url(#grad-${selectedToken?.id})`} />
                      <path d={getChartPath(priceHistory)} fill="none" stroke={tokenDetail.change7d >= 0 ? colors.success : colors.danger} strokeWidth="2" />
                    </svg>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-xl" style={{ background: colors.bgSecondary }}>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Капитализация</p>
                    <p className="font-bold">${tokenDetail.marketCap ? (tokenDetail.marketCap / 1e9).toFixed(2) : '...'}B</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: colors.bgSecondary }}>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Объём 24ч</p>
                    <p className="font-bold">${tokenDetail.volume24h ? (tokenDetail.volume24h / 1e9).toFixed(2) : '...'}B</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: colors.bgSecondary }}>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Макс. цена</p>
                    <p className="font-bold" style={{ color: colors.success }}>${tokenDetail.ath ? tokenDetail.ath.toLocaleString() : '...'}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: colors.bgSecondary }}>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Сейчас от макс.</p>
                    <p className="font-bold" style={{ color: colors.danger }}>{tokenDetail.athChange?.toFixed(1) ?? 0}%</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleWatchlist(selectedToken.id, selectedToken.name, selectedToken.symbol, tokenDetail.price || 0, tokenDetail.change24h || 0)}
                  className="w-full py-3 rounded-xl font-medium transition-all cursor-pointer"
                  style={{
                    background: isInWatchlist(selectedToken.id) ? colors.warning + '20' : colors.bgSecondary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  {isInWatchlist(selectedToken.id) ? '⭐ Убрать из избранного' : '⭐ Добавить в избранное'}
                </button>

                {tokenDetail.description && (
                  <p className="text-sm mt-4" style={{ color: colors.textSecondary }}>{tokenDetail.description}...</p>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t py-8" style={{ borderColor: colors.border + '20' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs" style={{ color: colors.textSecondary }}>© 2025 Андрей-Вова</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

// Wrap with ThemeProvider
export default function HomePage() {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
}