import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, BellRing, Trash2, Plus, Check, X, ExternalLink, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Alert, AlertCondition, Chain } from '../../types/analytics';

const conditionLabels: Record<AlertCondition, string> = {
  large_transfer: 'Large Transfer',
  new_wallet: 'New Wallet Activity',
  token_movement: 'Token Movement',
  price_change: 'Price Change',
  whale_activity: 'Whale Activity'
};

interface AlertsProps {
  etherscanKey: string;
  heliusKey?: string;
}

export default function Alerts({ etherscanKey, heliusKey }: AlertsProps) {
  const { colors, theme } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      name: 'Whale Alert',
      chain: 'ethereum',
      condition: 'whale_activity',
      threshold: 100000,
      enabled: true,
      triggered: false
    },
    {
      id: '2',
      name: 'Exchange Flow',
      address: '0x28c6c06298d514db089934071355e5743bf21d60',
      chain: 'ethereum',
      condition: 'large_transfer',
      threshold: 500000,
      enabled: true,
      triggered: true,
      lastTriggered: Date.now() - 3600000
    }
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    name: '',
    chain: 'ethereum',
    condition: 'large_transfer',
    threshold: 100000,
    enabled: true,
    triggered: false
  });

  const chains: Chain[] = ['ethereum', 'solana', 'arbitrum', 'optimism', 'base', 'polygon'];

  const addAlert = () => {
    if (!newAlert.name) return;
    setAlerts([...alerts, {
      id: Date.now().toString(),
      name: newAlert.name!,
      address: newAlert.address,
      chain: newAlert.chain || 'ethereum',
      condition: newAlert.condition as AlertCondition,
      threshold: newAlert.threshold,
      enabled: true,
      triggered: false
    }]);
    setNewAlert({
      name: '',
      chain: 'ethereum',
      condition: 'large_transfer',
      threshold: 100000,
      enabled: true,
      triggered: false
    });
    setShowCreate(false);
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.warning + '20' }}>
            <Bell className="w-5 h-5" style={{ color: colors.warning }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Alerts</h2>
            <p className="text-sm opacity-60">Whale tracking & custom notifications</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
          style={{
            background: showCreate ? colors.bgSecondary : colors.gradient,
            color: showCreate ? colors.text : 'white',
            border: `1px solid ${colors.border}`
          }}
        >
          <Plus className="w-4 h-4" />
          Create Alert
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border p-5" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <h3 className="font-semibold mb-4">New Alert</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm opacity-60 mb-1 block">Alert Name</label>
              <input
                type="text"
                placeholder="My Alert"
                value={newAlert.name || ''}
                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
              />
            </div>
            <div>
              <label className="text-sm opacity-60 mb-1 block">Chain</label>
              <select
                value={newAlert.chain || 'ethereum'}
                onChange={(e) => setNewAlert({ ...newAlert, chain: e.target.value as Chain })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
              >
                {chains.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm opacity-60 mb-1 block">Condition</label>
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as AlertCondition })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
              >
                {Object.entries(conditionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm opacity-60 mb-1 block">Threshold (USD)</label>
              <input
                type="number"
                placeholder="100000"
                value={newAlert.threshold || ''}
                onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm opacity-60 mb-1 block">Specific Address (optional)</label>
              <input
                type="text"
                placeholder="0x..."
                value={newAlert.address || ''}
                onChange={(e) => setNewAlert({ ...newAlert, address: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ background: colors.bgSecondary, borderColor: colors.border, color: colors.text }}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addAlert}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              style={{ background: colors.success, color: 'white' }}
            >
              <Check className="w-4 h-4" />
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4" style={{ color: colors.accent }} />
            <span className="text-sm opacity-60">Total Alerts</span>
          </div>
          <div className="text-2xl font-bold">{alerts.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-4 h-4" style={{ color: colors.warning }} />
            <span className="text-sm opacity-60">Triggered</span>
          </div>
          <div className="text-2xl font-bold">{alerts.filter(a => a.triggered).length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4" style={{ color: colors.success }} />
            <span className="text-sm opacity-60">Active</span>
          </div>
          <div className="text-2xl font-bold">{alerts.filter(a => a.enabled).length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" style={{ color: colors.danger }} />
            <span className="text-sm opacity-60">High Priority</span>
          </div>
          <div className="text-2xl font-bold">{alerts.filter(a => a.threshold && a.threshold > 500000).length}</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="rounded-xl border" style={{ background: colors.bgCard, borderColor: colors.border }}>
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <h3 className="font-semibold">All Alerts</h3>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto opacity-30 mb-3" />
            <p className="opacity-60">No alerts created yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 px-4 py-2 rounded-lg text-sm"
              style={{ background: colors.accent, color: 'white' }}
            >
              Create your first alert
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-center gap-4">
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    alert.enabled ? 'border-green-500 bg-green-500' : 'border-gray-500'
                  }`}
                >
                  {alert.enabled && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{alert.name}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ background: colors.accent + '20', color: colors.accent }}
                    >
                      {alert.chain}
                    </span>
                    {alert.triggered && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-500">
                        TRIGGERED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm opacity-60 mt-1">
                    <span>{conditionLabels[alert.condition]}</span>
                    <span>•</span>
                    <span>Threshold: {formatValue(alert.threshold || 0)}</span>
                    {alert.address && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{alert.address.slice(0, 8)}...</span>
                      </>
                    )}
                    {alert.lastTriggered && (
                      <>
                        <span>•</span>
                        <span>Last: {formatTime(alert.lastTriggered)}</span>
                      </>
                    )}
                  </div>
                </div>

                {alert.triggered && (
                  <a
                    href={`https://${alert.chain === 'ethereum' ? 'etherscan.io' : 'solscan.io'}/tx/${Date.now()}`}
                    target="_blank"
                    rel="noopener"
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 opacity-60" />
                  </a>
                )}

                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {alerts.some(a => a.triggered) && (
        <div className="rounded-xl border p-5" style={{ background: colors.bgCard, borderColor: colors.border }}>
          <h3 className="font-semibold mb-4">Recent Triggered Events</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: colors.bgSecondary }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Large ETH Transfer</span>
                  <span className="text-sm opacity-60">2h ago</span>
                </div>
                <p className="text-sm opacity-60">
                  1,250 ETH moved from Binance Hot Wallet
                </p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.warning + '20', color: colors.warning }}>
                  $3.2M Value
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: colors.bgSecondary }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20">
                <TrendingDown className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Exchange Outflow</span>
                  <span className="text-sm opacity-60">5h ago</span>
                </div>
                <p className="text-sm opacity-60">
                  850 ETH transferred to unknown wallet
                </p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.danger + '20', color: colors.danger }}>
                  $2.1M Value
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}