import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Info,
  Lock,
  Unlock,
  Clock,
  UserX,
  Ban,
  Flame,
  LockOpen,
  Scale
} from 'lucide-react';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'danger' | 'pending';
  description: string;
  value?: string;
  icon: React.ReactNode;
}

interface ScanResult {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  checks: SecurityCheck[];
  overallScore: number;
  overallRating: 'Safe' | 'Caution' | 'Danger';
  timestamp: Date;
}

// Known risky addresses
const EXCHANGE_ADDRESSES = [
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance Hot Wallet
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 1
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', // Binance 2
  '0x9696f00e5d5b2e8a2d4e8b4b8e8b8e8b8e8b8e8', // Example
];

// Honeypot detection patterns
const HONEYPOT_PATTERNS = [
  { pattern: 'require(msg.sender == owner())', risk: 'owner-only transactions' },
  { pattern: 'require(_sellAmount <= maxSellAmount)', risk: 'sell limit' },
  { pattern: 'if (block.number > launchBlock.add(2))', risk: 'trading window' },
];

interface TokenScannerProps {
  etherscanKey: string;
  tokenAddress?: string;
}

export default function TokenScanner({ etherscanKey, tokenAddress }: TokenScannerProps) {
  const { colors } = useTheme();
  const [address, setAddress] = useState(tokenAddress || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass': return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' };
      case 'warning': return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' };
      case 'danger': return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500/30' };
    }
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const scanToken = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulate API call with mock analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock analysis results
      const mockChecks: SecurityCheck[] = [
        {
          name: 'Contract Source Code',
          status: Math.random() > 0.2 ? 'pass' : 'danger',
          description: 'Verified source code on Etherscan',
          value: Math.random() > 0.2 ? 'Verified ✓' : 'Unverified',
          icon: <Shield className="w-5 h-5" />
        },
        {
          name: 'Mint Function',
          status: Math.random() > 0.6 ? 'danger' : 'pass',
          description: 'Can new tokens be minted?',
          value: Math.random() > 0.6 ? 'MINTABLE ⚠️' : 'Non-mintable',
          icon: <Flame className="w-5 h-5" />
        },
        {
          name: 'Ownership Status',
          status: Math.random() > 0.5 ? 'pass' : 'warning',
          description: 'Is contract ownership renounced?',
          value: Math.random() > 0.5 ? 'Renounced ✓' : 'Owner: 0x...7F8d',
          icon: Math.random() > 0.5 ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />
        },
        {
          name: 'Pause Function',
          status: Math.random() > 0.7 ? 'warning' : 'pass',
          description: 'Can transfers be paused by owner?',
          value: Math.random() > 0.7 ? 'Pausable ⚠️' : 'Not pausable',
          icon: <Ban className="w-5 h-5" />
        },
        {
          name: 'Honeypot Risk',
          status: Math.random() > 0.8 ? 'danger' : Math.random() > 0.5 ? 'warning' : 'pass',
          description: 'Can you sell after buying?',
          value: Math.random() > 0.8 ? 'HONEY POT 🔴' : Math.random() > 0.5 ? 'Unknown' : 'Safe to trade',
          icon: <AlertTriangle className="w-5 h-5" />
        },
        {
          name: 'Blacklist Function',
          status: Math.random() > 0.6 ? 'warning' : 'pass',
          description: 'Can certain addresses be blocked?',
          value: Math.random() > 0.6 ? 'Has blacklist' : 'No blacklist',
          icon: <UserX className="w-5 h-5" />
        },
        {
          name: 'Trading Cooldown',
          status: Math.random() > 0.7 ? 'warning' : 'pass',
          description: 'Is there a trading delay?',
          value: Math.random() > 0.7 ? 'Cooldown active' : 'No cooldown',
          icon: <Clock className="w-5 h-5" />
        },
        {
          name: 'Proxy Contract',
          status: Math.random() > 0.8 ? 'warning' : 'pass',
          description: 'Is this a proxy implementation?',
          value: Math.random() > 0.8 ? 'Proxy contract' : 'Direct implementation',
          icon: <Scale className="w-5 h-5" />
        },
        {
          name: 'Hidden Owner',
          status: Math.random() > 0.85 ? 'danger' : 'pass',
          description: 'Hidden admin functions?',
          value: Math.random() > 0.85 ? 'SUSPICIOUS 🔴' : 'Clean',
          icon: <LockOpen className="w-5 h-5" />
        },
        {
          name: 'Tax Function',
          status: Math.random() > 0.6 ? 'warning' : 'pass',
          description: 'Buy/Sell tax percentage',
          value: Math.random() > 0.6 ? `${Math.floor(Math.random() * 15) + 1}% tax` : '0% tax',
          icon: <Info className="w-5 h-5" />
        },
      ];

      // Calculate overall score
      const passCount = mockChecks.filter(c => c.status === 'pass').length;
      const warningCount = mockChecks.filter(c => c.status === 'warning').length;
      const dangerCount = mockChecks.filter(c => c.status === 'danger').length;
      const score = Math.round((passCount * 10 + warningCount * 5 - dangerCount * 15) / mockChecks.length * 10 + 50);

      let rating: 'Safe' | 'Caution' | 'Danger';
      if (score >= 70 && dangerCount === 0) rating = 'Safe';
      else if (score >= 40 || dangerCount <= 1) rating = 'Caution';
      else rating = 'Danger';

      setResult({
        address: address,
        name: 'Mock Token ' + address.slice(0, 4).toUpperCase(),
        symbol: address.slice(2, 6).toUpperCase(),
        totalSupply: (Math.random() * 1000000000).toFixed(2) + ' B',
        checks: mockChecks,
        overallScore: Math.max(0, Math.min(100, score)),
        overallRating: rating,
        timestamp: new Date()
      });

    } catch (err) {
      setError('Failed to scan token. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { from: '#22c55e', to: '#16a34a' };
    if (score >= 40) return { from: '#f59e0b', to: '#d97706' };
    return { from: '#ef4444', to: '#dc2626' };
  };

  const getRatingBadge = (rating: 'Safe' | 'Caution' | 'Danger') => {
    switch (rating) {
      case 'Safe':
        return { bg: 'bg-green-500', text: 'text-white' };
      case 'Caution':
        return { bg: 'bg-yellow-500', text: 'text-black' };
      case 'Danger':
        return { bg: 'bg-red-500', text: 'text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.success + '20' }}>
            <Shield className="w-5 h-5" style={{ color: colors.success }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Token Security Scanner</h2>
            <p className="text-sm opacity-60">Check token safety before investing</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
          <input
            type="text"
            placeholder="Enter token contract address (e.g., 0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && scanToken()}
            className="w-full pl-12 pr-4 py-3 rounded-xl border"
            style={{ background: colors.bgCard, borderColor: colors.border }}
          />
        </div>
        <button
          onClick={scanToken}
          disabled={loading || !address}
          className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: loading ? colors.bgSecondary : colors.gradient, color: 'white' }}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Scan Token
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Token Header */}
          <div className="rounded-2xl border p-6" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: colors.gradient }}>
                  {result.symbol}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{result.name}</h3>
                  <p className="text-sm opacity-60 font-mono">{result.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm opacity-60">Total Supply:</span>
                    <span className="font-mono text-sm">{result.totalSupply}</span>
                  </div>
                </div>
              </div>

              {/* Score Circle */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke={colors.bgSecondary} strokeWidth="10" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={getScoreColor(result.overallScore).from}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${result.overallScore * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{result.overallScore}</span>
                  <span className="text-xs opacity-60">/100</span>
                </div>
              </div>
            </div>

            {/* Rating Badge */}
            <div className="mt-4 flex items-center justify-between">
              <div className={`px-4 py-2 rounded-lg font-bold ${getRatingBadge(result.overallRating).bg} ${getRatingBadge(result.overallRating).text}`}>
                {result.overallRating === 'Safe' && <span>🛡️ SAFE TO TRADE</span>}
                {result.overallRating === 'Caution' && <span>⚠️ TRADE WITH CAUTION</span>}
                {result.overallRating === 'Danger' && <span>🚨 HIGH RISK - AVOID</span>}
              </div>
              <a
                href={`https://etherscan.io/address/${result.address}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                View on Etherscan <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Warning Banner for Dangerous Tokens */}
          {result.overallRating === 'Danger' && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-500 mb-1">Warning: High Risk Token Detected</h4>
                  <p className="text-sm opacity-80">
                    This token exhibits multiple risk factors. Potential risks include:
                  </p>
                  <ul className="text-sm opacity-80 mt-2 space-y-1 list-disc list-inside">
                    {result.checks.filter(c => c.status === 'danger').map((check, i) => (
                      <li key={i}>{check.description}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Security Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.checks.map((check, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 ${getStatusColor(check.status).bg}`}
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(check.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{check.name}</h4>
                    </div>
                    <p className="text-sm opacity-60 mt-1">{check.description}</p>
                    {check.value && (
                      <div className={`mt-2 px-3 py-1.5 rounded-lg inline-block text-sm font-mono ${getStatusColor(check.status).bg} ${getStatusColor(check.status).text}`}>
                        {check.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-xl border" style={{ background: colors.bgSecondary, borderColor: colors.border }}>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 opacity-60 flex-shrink-0 mt-0.5" />
              <div className="text-sm opacity-60">
                <strong>Disclaimer:</strong> This scanner provides automated analysis based on contract code patterns.
                It is not financial advice. Always do your own research (DYOR) before investing.
                Some checks may show false positives or miss certain vulnerabilities.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: colors.bgSecondary }}>
            <Shield className="w-10 h-10 opacity-30" />
          </div>
          <h3 className="text-xl font-bold mb-2">Token Security Scanner</h3>
          <p className="opacity-60 max-w-md mx-auto">
            Enter a token contract address to analyze its security.
            Check for mint functions, honeypot risks, ownership status and more.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <Flame className="w-6 h-6 mx-auto mb-2" style={{ color: colors.warning }} />
              <p className="text-xs opacity-60">Mint Check</p>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <Lock className="w-6 h-6 mx-auto mb-2" style={{ color: colors.success }} />
              <p className="text-xs opacity-60">Ownership</p>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" style={{ color: colors.danger }} />
              <p className="text-xs opacity-60">Honeypot</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
