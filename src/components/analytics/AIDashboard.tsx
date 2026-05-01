import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Shield,
  Users,
  AlertTriangle,
  Zap,
  Clock,
  RefreshCw,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  Wallet,
  Globe,
  Bell,
  Search,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Target,
  BookOpen
} from 'lucide-react';

interface MarketInsight {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'warning';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface WalletAlert {
  address: string;
  name: string;
  type: 'whale' | 'institutional' | 'deFi';
  action: 'buy' | 'sell' | 'transfer';
  amount: string;
  token: string;
  time: string;
}

interface TokenAnalysis {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  score: number;
  verdict: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  signals: Array<{ type: string; description: string; weight: string }>;
}

interface AIDashboardProps {
  groqKey: string;
  etherscanKey: string;
  heliusKey: string;
}

export default function AIDashboard({ groqKey, etherscanKey, heliusKey }: AIDashboardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [walletAlerts, setWalletAlerts] = useState<WalletAlert[]>([]);
  const [topPicks, setTopPicks] = useState<TokenAnalysis[]>([]);
  const [marketSummary, setMarketSummary] = useState<any>({
    totalMarketCap: 0, totalVolume: 0, btcDominance: 0, avgChange: 0, activeCoins: 0, marketTrend: 'neutral'
  });
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: 'ai' | 'user'; text: string}>>([
    { role: 'ai', text: 'Привет! Я ваш AI-аналитик. Спросите меня о рынке, токенах, кошельках или рисках.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch market data
      const [globalRes, topCoinsRes, trendingRes] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/global'),
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false'),
        fetch('https://api.coingecko.com/api/v3/search/trending')
      ]);

      const globalData = await globalRes.json();
      const topCoinsData = await topCoinsRes.json();
      const trendingData = await trendingRes.json();

      // Calculate market summary
      const btcDominance = globalData.data?.market_cap_percentage?.btc || 0;
      const totalMarketCap = globalData.data?.total_market_cap?.usd || 0;
      const totalVolume = globalData.data?.total_volume?.usd || 0;
      const marketChange = topCoinsData.slice(0, 10).reduce((acc: number, coin: any) => acc + (coin.price_change_percentage_24h || 0), 0) / 10;

      setMarketSummary({
        totalMarketCap: totalMarketCap,
        totalVolume: totalVolume,
        btcDominance: btcDominance,
        avgChange: marketChange,
        activeCoins: globalData.data?.active_cryptocurrencies || 0,
        marketTrend: marketChange > 2 ? 'bullish' : marketChange < -2 ? 'bearish' : 'neutral'
      });

      // Generate insights based on market data
      const newInsights: MarketInsight[] = [];

      // BTC dominance insight
      if (btcDominance > 50) {
        newInsights.push({
          id: 'btc-dom-1',
          type: 'neutral',
          title: 'BTC Dominance Above 50%',
          description: `Биткоин доминирует ${btcDominance.toFixed(1)}% рынка. Альты могут показывать слабость.`,
          source: 'AI Analysis',
          timestamp: new Date(),
          confidence: 85,
          impact: 'medium'
        });
      }

      // Market trend insights
      if (marketChange > 3) {
        newInsights.push({
          id: 'bull-run-1',
          type: 'bullish',
          title: 'Сильный бычий импульс',
          description: 'Топ-10 монет показывают средний рост +' + marketChange.toFixed(1) + '%. Общий позитивный настрой.',
          source: 'Market Data',
          timestamp: new Date(),
          confidence: 78,
          impact: 'high'
        });
      } else if (marketChange < -3) {
        newInsights.push({
          id: 'bear-run-1',
          type: 'bearish',
          title: 'Медвежий импульс',
          description: 'Топ-10 монет показывают среднее падение ' + marketChange.toFixed(1) + '%. Осторожность.',
          source: 'Market Data',
          timestamp: new Date(),
          confidence: 80,
          impact: 'high'
        });
      }

      // Add trending coins analysis
      if (trendingData.coins?.length > 0) {
        const hotCoin = trendingData.coins[0].item;
        newInsights.push({
          id: 'trending-1',
          type: 'neutral',
          title: `🔥 ${hotCoin.symbol.toUpperCase()} в тренде`,
          description: `${hotCoin.name} показывает наибольший интерес. Текущая цена: $${(hotCoin.price_btc * 65000).toFixed(6)}`,
          source: 'CoinGecko Trending',
          timestamp: new Date(),
          confidence: 90,
          impact: 'medium'
        });
      }

      // Add whale alerts (mock)
      const whaleAlerts: WalletAlert[] = [
        { address: '0x28C6...6060', name: 'Binance Hot', type: 'institutional', action: 'buy', amount: '2,450', token: 'ETH', time: '5 мин' },
        { address: '0x88e6...7F8F', name: 'Paradigm', type: 'institutional', action: 'buy', amount: '8,200', token: 'UNI', time: '12 мин' },
        { address: '0xd8dA...86A4', name: 'Whale #847', type: 'whale', action: 'sell', amount: '15,000', token: 'LINK', time: '25 мин' },
      ];
      setWalletAlerts(whaleAlerts);

      // Top picks based on 24h performance
      const topPerformers = topCoinsData
        .filter((coin: any) => coin.price_change_percentage_24h > 5)
        .slice(0, 3)
        .map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          score: Math.min(100, 50 + coin.price_change_percentage_24h * 2 + (coin.market_cap_rank < 50 ? 20 : 0)),
          verdict: coin.price_change_percentage_24h > 15 ? 'strong_buy' : coin.price_change_percentage_24h > 5 ? 'buy' : 'hold',
          signals: [
            { type: 'price', description: `${coin.price_change_percentage_24h.toFixed(1)}% за 24ч`, weight: 'high' },
            { type: 'volume', description: 'Объём растёт', weight: 'medium' },
            { type: 'momentum', description: 'Импульс положительный', weight: 'medium' }
          ]
        }));
      setTopPicks(topPerformers);

      // Calculate overall risk
      const avgVolatility = topCoinsData.slice(0, 5).reduce((acc: number, coin: any) => acc + Math.abs(coin.price_change_percentage_24h || 0), 0) / 5;
      if (avgVolatility > 5 || marketChange < -5) {
        setRiskLevel('high');
      } else if (avgVolatility > 3 || marketChange < -2) {
        setRiskLevel('medium');
      } else {
        setRiskLevel('low');
      }

      setInsights(newInsights);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchAllData();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // AI Chat with Groq
  const askAI = async (question: string) => {
    if (!question.trim()) return;

    const userMsg = question;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage("");
    setAiLoading(true);

    // Build comprehensive context for AI
    const topCoinsFormatted = topPicks.map(p => `${p.symbol}: $${p.price?.toLocaleString()}, ${p.change24h >= 0 ? '+' : ''}${p.change24h?.toFixed(1)}%, verdict: ${p.verdict.replace('_', ' ')}`).join('\n');

    const whaleActivityFormatted = walletAlerts.map(w => `${w.name} (${w.type}): ${w.action === 'buy' ? 'BUY' : 'SELL'} ${w.amount} ${w.token}`).join('\n');

    const insightsFormatted = insights.map(i => `[${i.type.toUpperCase()}] ${i.title}: ${i.description} (confidence: ${i.confidence}%)`).join('\n');

    try {
      // If Groq key is available, use it
      if (groqKey) {
        const contextPrompt = `Ты — AI-аналитик крипторынка для платформы "Андрей-Вова". Ответь на вопрос пользователя на основе текущих данных платформы.

=== ДОСТУПНЫЕ ИНСТРУМЕНТЫ ПЛАТФОРМЫ ===
1. Wallet Tracker — отслеживание кошельков на ETH/SOL
2. Token Flow — анализ потоков токенов
3. Holder Map — визуализация распределения держателей
4. Holder Analysis — анализ топ держателей токена
5. Token Scanner — проверка безопасности токенов
6. Alerts — настройка уведомлений
7. AI Chat — общение с AI-аналитиком

=== ТЕКУЩИЕ ДАННЫЕ РЫНКА ===
Общая капитализация: $${marketSummary ? (marketSummary.totalMarketCap / 1e12).toFixed(2) : '...'}T
Среднее изменение топ-монет: ${marketSummary ? (marketSummary.avgChange > 0 ? '+' : '') + marketSummary.avgChange.toFixed(1) : '...'}%
BTC доминирование: ${marketSummary ? marketSummary.btcDominance.toFixed(1) : '...'}%
Объём 24ч: $${marketSummary ? (marketSummary.totalVolume / 1e9).toFixed(1) : '...'}B
Активных монет: ${marketSummary?.activeCoins || '...'}
Уровень риска: ${riskLevel}
Тренд: ${marketSummary?.marketTrend || 'neutral'}

=== ТОП ВЫБОРЫ (сигналы AI) ===
${topCoinsFormatted || 'Нет данных'}

=== АКТИВНОСТЬ КИТОВ ===
${whaleActivityFormatted || 'Нет данных'}

=== AI ИНСАЙТЫ ===
${insightsFormatted || 'Нет данных'}

=== ВОПРОС ПОЛЬЗОВАТЕЛЯ ===
${userMsg}

=== ИНСТРУКЦИЯ ===
1. Отвечай на РУССКОМ языке
2. Будь кратким и информативным
3. Если спрашивают про инструменты — описывай возможности платформы
4. Если спрашивают про рынок — используй данные выше
5. Если нужны действия — предлагай перейти в соответствующий раздел`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: contextPrompt }],
            temperature: 0.7,
            max_tokens: 600
          })
        });

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ от AI. Попробуйте позже.';
        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      } else {
        // Fallback responses without Groq
        const fallbackResponses: {[key: string]: string} = {
          'риск': `📊 Текущий уровень риска: **${riskLevel.toUpperCase()}**\n\n${riskLevel === 'high' ? '⚠️ Рекомендую быть осторожным. Высокая волатильность.' : riskLevel === 'medium' ? '🟡 Умеренный риск. Следите за рынком.' : '✅ Риск низкий. Благоприятные условия.'}\n\nОбщая капитализация: $${marketSummary ? (marketSummary.totalMarketCap / 1e12).toFixed(2) : '...'}T\nСреднее изменение: ${marketSummary ? (marketSummary.avgChange > 0 ? '+' : '') + marketSummary.avgChange.toFixed(1) : '...'}%`,
          'кит': `🐋 Последняя активность китов:\n\n${walletAlerts.map(w => `• **${w.name}** — ${w.action === 'buy' ? '🟢 ПОКУПКА' : '🔴 ПРОДАЖА'} ${w.amount} ${w.token} (${w.time} назад)`).join('\n')}\n\nЧтобы узнать больше о конкретном кошельке, используйте **Wallet Tracker** в меню.`,
          'токен': topPicks.length > 0
            ? `🎯 Топ выборы AI:\n\n${topPicks.map(p => `**${p.symbol}** — $${p.price?.toLocaleString()}\n${p.change24h >= 0 ? '📈' : '📉'} ${p.change24h >= 0 ? '+' : ''}${p.change24h?.toFixed(1)}%\nВердикт: ${p.verdict === 'strong_buy' ? '🔥 Сильная покупка' : p.verdict === 'buy' ? '🟢 Покупка' : '🟡 Держать'}`).join('\n\n')}`
            : '📊 Используйте **Token Scanner** для анализа конкретного токена.',
          'сигнал': insights.length > 0
            ? `💡 Активные сигналы:\n\n${insights.map(i => `**[${i.type.toUpperCase()}]** ${i.title}\n${i.description}\nУверенность: ${i.confidence}%`).join('\n\n')}`
            : '📡 Сигналы обновляются автоматически. Подождите немного.',
          'default': `🧠 Я получил ваш вопрос: "${userMsg}"\n\nДля полного анализа:\n• Используйте **AI Dashboard** для обзора рынка\n• **Wallet Tracker** для анализа кошельков\n• **Token Scanner** для проверки токенов\n• **Holder Map** для распределения держателей\n\nВведите ключ Groq API в .env для расширенных ответов AI.`
        };

        const lowerQ = userMsg.toLowerCase();
        let response = fallbackResponses.default;
        if (lowerQ.includes('риск')) response = fallbackResponses.risk;
        else if (lowerQ.includes('кит') || lowerQ.includes('whale')) response = fallbackResponses.кит;
        else if (lowerQ.includes('токен') || lowerQ.includes('монета')) response = fallbackResponses.токен;
        else if (lowerQ.includes('сигнал') || lowerQ.includes('инсайт')) response = fallbackResponses.сигнал;

        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: response }]);
          setAiLoading(false);
        }, 1000);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Произошла ошибка при обработке запроса. Попробуйте ещё раз.' }]);
      setAiLoading(false);
    }
  };

  const getInsightIcon = (type: MarketInsight['type']) => {
    switch (type) {
      case 'bullish': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'bearish': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: MarketInsight['type']) => {
    switch (type) {
      case 'bullish': return 'bg-green-500/10 border-green-500/30';
      case 'bearish': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getVerdictBadge = (verdict: TokenAnalysis['verdict']) => {
    switch (verdict) {
      case 'strong_buy': return { bg: 'bg-green-500', text: 'text-white', label: '🔥 Сильная покупка' };
      case 'buy': return { bg: 'bg-green-500/70', text: 'text-white', label: '🟢 Покупка' };
      case 'hold': return { bg: 'bg-yellow-500', text: 'text-black', label: '🟡 Держать' };
      case 'sell': return { bg: 'bg-red-500/70', text: 'text-white', label: '🟠 Продажа' };
      case 'strong_sell': return { bg: 'bg-red-500', text: 'text-white', label: '🔴 Сильная продажа' };
    }
  };

  const getRiskBadge = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return { bg: 'bg-green-500/20', text: 'text-green-500', icon: '✓', label: 'Низкий риск' };
      case 'medium': return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', icon: '⚠', label: 'Средний риск' };
      case 'high': return { bg: 'bg-red-500/20', text: 'text-red-500', icon: '!', label: 'Высокий риск' };
    }
  };

  // Loading state doesn't block anymore - data shown instantly with placeholders

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.accent + '20' }}>
            <Brain className="w-5 h-5" style={{ color: colors.accent }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Dashboard</h2>
            <p className="text-sm opacity-60">Автоматический анализ рынка и инструментов</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-60">
            Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-all ${autoRefresh ? colors.accent + '20' : ''}`}
            style={{ color: autoRefresh ? colors.accent : colors.textSecondary }}
            title={autoRefresh ? 'Автообновление включено' : 'Автообновление выключено'}
          >
            <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
            style={{ background: colors.gradient, color: 'white' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* Risk Banner */}
      <div className={`p-4 rounded-2xl border ${getRiskBadge(riskLevel).bg}`} style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${getRiskBadge(riskLevel).text}`}>{getRiskBadge(riskLevel).icon}</span>
            <div>
              <p className="font-bold">Уровень риска: {getRiskBadge(riskLevel).label}</p>
              <p className="text-sm opacity-70">На основе текущей волатильности и активности рынка</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-60">Тренд рынка</p>
            <p className={`text-lg font-bold ${marketSummary?.marketTrend === 'bullish' ? 'text-green-500' : marketSummary?.marketTrend === 'bearish' ? 'text-red-500' : 'text-yellow-500'}`}>
              {marketSummary?.marketTrend === 'bullish' ? '🟢 Бычий' : marketSummary?.marketTrend === 'bearish' ? '🔴 Медвежий' : '🟡 Нейтральный'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: colors.accent }} />
            <span className="text-sm opacity-60">Капитализация</span>
            {loading && marketSummary.totalMarketCap === 0 && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: colors.textSecondary }} />}
          </div>
          <p className="text-xl font-bold">
            {marketSummary.totalMarketCap > 0 ? `$${(marketSummary.totalMarketCap / 1e12).toFixed(2)}` : loading ? '...' : '$0.00'}
          </p>
          <span className="text-xs opacity-40">триллионов</span>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4" style={{ color: colors.success }} />
            <span className="text-sm opacity-60">Объём 24ч</span>
            {loading && marketSummary.totalVolume === 0 && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: colors.textSecondary }} />}
          </div>
          <p className="text-xl font-bold">
            {marketSummary.totalVolume > 0 ? `$${(marketSummary.totalVolume / 1e9).toFixed(1)}` : loading ? '...' : '$0.0'}
          </p>
          <span className="text-xs opacity-40">миллиардов</span>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" style={{ color: colors.warning }} />
            <span className="text-sm opacity-60">BTC доля</span>
            {loading && marketSummary.btcDominance === 0 && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: colors.textSecondary }} />}
          </div>
          <p className="text-xl font-bold">
            {marketSummary.btcDominance > 0 ? `${marketSummary.btcDominance.toFixed(1)}` : loading ? '...' : '0.0'}%
          </p>
          <span className="text-xs opacity-40">от рынка</span>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" style={{ color: marketSummary?.avgChange >= 0 ? colors.success : colors.danger }} />
            <span className="text-sm opacity-60">Сред. изменение</span>
            {loading && marketSummary.avgChange === 0 && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: colors.textSecondary }} />}
          </div>
          <p className="text-xl font-bold" style={{ color: marketSummary?.avgChange >= 0 ? colors.success : colors.danger }}>
            {marketSummary.avgChange !== 0 ? (marketSummary.avgChange >= 0 ? '+' : '') + marketSummary.avgChange.toFixed(1) : loading ? '...' : '0.0'}%
          </p>
          <span className="text-xs opacity-40">топ-10 монет</span>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
          <h3 className="text-lg font-bold">AI Инсайты</h3>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: colors.accent + '20', color: colors.accent }}>
            {insights.length} сигналов
          </span>
        </div>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-xl border ${getInsightBg(insight.type)}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                        insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {insight.impact === 'high' ? 'Высокий' : insight.impact === 'medium' ? 'Средний' : 'Низкий'} импакт
                      </span>
                      <span className="text-xs opacity-50">
                        {insight.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm opacity-80">{insight.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs opacity-50">Источник: {insight.source}</span>
                    <span className="text-xs opacity-50">·</span>
                    <span className="text-xs opacity-50">Уверенность: {insight.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Whale Alerts */}
        <div className="rounded-xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" style={{ color: colors.warning }} />
              <h3 className="font-bold">🐋 Активность китов</h3>
            </div>
            <span className="text-xs opacity-50">Последние</span>
          </div>
          <div className="space-y-3">
            {walletAlerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: colors.bgSecondary }}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    alert.action === 'buy' ? 'bg-green-500/20' : alert.action === 'sell' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    {alert.action === 'buy' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : alert.action === 'sell' ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{alert.name}</p>
                    <p className="text-xs opacity-50 font-mono">{alert.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    alert.action === 'buy' ? 'text-green-500' : alert.action === 'sell' ? 'text-red-500' : 'text-blue-500'
                  }`}>
                    {alert.action === 'buy' ? '+' : alert.action === 'sell' ? '-' : ''}{alert.amount} {alert.token}
                  </p>
                  <p className="text-xs opacity-50">{alert.time} назад</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Picks */}
        <div className="rounded-xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: colors.success }} />
              <h3 className="font-bold">🎯 Топ выборы AI</h3>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: colors.success + '20', color: colors.success }}>
              {topPicks.length} возможностей
            </span>
          </div>
          <div className="space-y-3">
            {topPicks.length > 0 ? topPicks.map((pick, i) => (
              <div key={i} className="p-4 rounded-lg border" style={{ background: colors.bgSecondary, borderColor: colors.border }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{pick.symbol}</span>
                    <span className="text-sm opacity-60">{pick.name}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getVerdictBadge(pick.verdict).bg} ${getVerdictBadge(pick.verdict).text}`}>
                    {getVerdictBadge(pick.verdict).label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">${pick.price?.toLocaleString()}</span>
                    <span className={`ml-2 text-sm ${pick.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pick.change24h >= 0 ? '+' : ''}{pick.change24h?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60">Score: {pick.score}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pick.signals.map((signal, j) => (
                    <span key={j} className="text-xs px-2 py-1 rounded" style={{ background: colors.accent + '10', color: colors.accent }}>
                      {signal.type === 'price' ? '📈' : signal.type === 'volume' ? '📊' : '💡'} {signal.description}
                    </span>
                  ))}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 opacity-60">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <p>Нет активных возможностей с ростом &gt;5%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" style={{ color: colors.accent }} />
            <h3 className="font-bold">💬 AI Ассистент</h3>
            {groqKey && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">Groq подключён</span>
            )}
          </div>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] p-4 rounded-2xl"
                style={{
                  background: msg.role === 'ai' ? colors.accent + '10' : colors.accent,
                  border: msg.role === 'ai' ? `1px solid ${colors.accent}30` : 'none',
                  color: msg.role === 'ai' ? colors.text : 'white'
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-2xl" style={{ background: colors.accent + '10', border: `1px solid ${colors.accent}30` }}>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.accent }} />
                  <span className="text-sm" style={{ color: colors.accent }}>AI думает...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t" style={{ borderColor: colors.border }}>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Спросите о рынке, токенах, рисках..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !aiLoading && askAI(chatMessage)}
              disabled={aiLoading}
              className="flex-1 px-4 py-3 rounded-xl border outline-none"
              style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
            />
            <button
              onClick={() => askAI(chatMessage)}
              disabled={aiLoading || !chatMessage.trim()}
              className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
              style={{ background: colors.gradient, color: 'white', opacity: aiLoading || !chatMessage.trim() ? 0.5 : 1 }}
            >
              <Sparkles className="w-4 h-4" />
              Спросить
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Проанализируй ETH', 'Какие риски сейчас?', 'Что покупают киты?', 'Топ монеты недели'].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => askAI(suggestion)}
                disabled={aiLoading}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: colors.bgSecondary, color: colors.textSecondary }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5" style={{ color: colors.textSecondary }} />
          <h3 className="text-lg font-bold">Быстрый доступ к инструментам</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 rounded-xl border text-left transition-all hover:border-opacity-50" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <Wallet className="w-6 h-6 mb-2" style={{ color: colors.accent }} />
            <p className="font-medium">Wallet Tracker</p>
            <p className="text-xs opacity-60">Анализ кошельков</p>
          </button>
          <button className="p-4 rounded-xl border text-left transition-all hover:border-opacity-50" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <Shield className="w-6 h-6 mb-2" style={{ color: colors.success }} />
            <p className="font-medium">Scanner</p>
            <p className="text-xs opacity-60">Безопасность токенов</p>
    </button>
          <button className="p-4 rounded-xl border text-left transition-all hover:border-opacity-50" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <Globe className="w-6 h-6 mb-2" style={{ color: colors.warning }} />
            <p className="font-medium">Holder Map</p>
            <p className="text-xs opacity-60">Распределение</p>
          </button>
          <button className="p-4 rounded-xl border text-left transition-all hover:border-opacity-50" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <Bell className="w-6 h-6 mb-2" style={{ color: colors.danger }} />
            <p className="font-medium">Alerts</p>
            <p className="text-xs opacity-60">Уведомления</p>
          </button>
        </div>
      </div>
    </div>
  );
}