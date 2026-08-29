import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { fetchPlayerDetail } from '../api/client';
import { PlayerDetail } from '../types/api';

export const PlayerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchPlayerDetail(parseInt(id, 10))
        .then((data) => {
          setPlayer(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Player not found or backend service unavailable.');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-white/5 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white font-mono">{error || 'Player not found'}</h2>
        <button
          onClick={() => navigate('/players')}
          className="px-4 py-2 bg-signal-cyan/20 border border-signal-cyan/40 text-signal-cyan rounded-xl text-xs font-mono"
        >
          RETURN TO PLAYERS
        </button>
      </div>
    );
  }

  const formatEuro = (val: number | null) => {
    if (!val && val !== 0) return 'N/A';
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  const pred = player.prediction;
  const perf = player.performance;
  const gap = pred ? pred.valuation_gap_eur : 0;
  const gapPct = pred ? pred.valuation_gap_pct : 0;

  // Prepare chart data from real valuation history
  const chartData = player.valuation_history.map((v) => ({
    date: v.valuation_date,
    value: v.market_value_eur / 1000000,
  }));

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Return to previous player list page"
        className="inline-flex items-center space-x-2 text-xs font-mono text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO PLAYERS</span>
      </button>

      {/* Hero Bio Card */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{player.name}</h1>
            <span className="px-3 py-1 bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan font-mono text-xs rounded-full">
              {player.position || 'Player'}
            </span>
          </div>
          <p className="text-sm text-gray-300 font-mono">
            {player.current_club ? player.current_club.name : 'Free Agent'} • Age: {player.age || 'N/A'} • Foot: {player.foot || 'N/A'} • Height: {player.height_in_cm ? `${player.height_in_cm} cm` : 'N/A'}
          </p>
        </div>

        {/* Signal Status Badge */}
        {pred && (
          <div className={`p-4 rounded-2xl border text-right font-mono ${gap > 0 ? 'bg-signal-emerald/10 border-signal-emerald/30 text-signal-emerald' : 'bg-signal-crimson/10 border-signal-crimson/30 text-signal-crimson'}`}>
            <p className="text-xs uppercase tracking-wider font-bold flex items-center justify-end space-x-1">
              {gap > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{gap > 0 ? 'UNDERVALUED SIGNAL' : 'OVERVALUED SIGNAL'}</span>
            </p>
            <p className="text-2xl font-extrabold">{gap > 0 ? `+${gapPct.toFixed(1)}%` : `${gapPct.toFixed(1)}%`}</p>
          </div>
        )}
      </div>

      {/* Valuation & Prediction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valuation Card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white font-sans flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-signal-cyan" />
            <span>Valuation Comparison</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-xs text-gray-400">Observed Market Value</p>
              <p className="text-2xl font-bold text-white">{formatEuro(player.latest_observed_market_value_eur)}</p>
              <p className="text-[10px] text-gray-500">Date: {player.latest_valuation_date}</p>
            </div>

            <div className="p-4 rounded-xl bg-signal-cyan/10 border border-signal-cyan/20 space-y-1">
              <p className="text-xs text-signal-cyan">Predicted Fair Value</p>
              <p className="text-2xl font-bold text-signal-cyan">{formatEuro(pred ? pred.predicted_fair_value_eur : null)}</p>
              <p className="text-[10px] text-signal-cyan/70">Model Version: xgboost-v1</p>
            </div>
          </div>

          {/* 80% Prediction Interval Bounds */}
          {pred && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>80% Prediction Interval Bounds</span>
                <span className="text-signal-cyan">[{formatEuro(pred.lower_bound_eur)} — {formatEuro(pred.upper_bound_eur)}]</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-signal-cyan/40 absolute"
                  style={{
                    left: '20%',
                    width: '60%'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Historical Valuation Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white font-sans flex items-center space-x-2">
            <Activity className="w-5 h-5 text-signal-emerald" />
            <span>Valuation Timeline (€ Millions)</span>
          </h2>

          <div className="h-48 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10, fill: '#6b7280' }} unit="M" />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f2937', color: '#fff' }} />
                  <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#valGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs font-mono text-gray-500 text-center pt-16">No historical valuation records available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Trailing Performance & Transfer History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white font-sans">Trailing 365-Day Performance</h2>
          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">Apps</p>
              <p className="text-xl font-bold text-white">{perf.apps_365d}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">Goals</p>
              <p className="text-xl font-bold text-signal-emerald">{perf.goals_365d}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">Assists</p>
              <p className="text-xl font-bold text-signal-cyan">{perf.assists_365d}</p>
            </div>
          </div>
        </div>

        {/* Transfer History */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white font-sans">Transfer Log</h2>
          {player.transfers.length > 0 ? (
            <div className="space-y-2 font-mono text-xs max-h-40 overflow-y-auto pr-2">
              {player.transfers.map((tr, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold">{tr.from_club_name || 'Unknown'} → {tr.to_club_name || 'Unknown'}</p>
                    <p className="text-gray-400 text-[10px]">{tr.transfer_date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] border uppercase ${tr.transfer_fee_status === 'disclosed' ? 'bg-signal-cyan/10 border-signal-cyan/30 text-signal-cyan' : tr.transfer_fee_status === 'free_transfer' ? 'bg-signal-emerald/10 border-signal-emerald/30 text-signal-emerald' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                    {tr.transfer_fee_status === 'disclosed' ? formatEuro(tr.transfer_fee_eur) : tr.transfer_fee_status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-gray-500">No transfer records found.</p>
          )}
        </div>
      </div>

      {/* ML Model Explanation Factors */}
      {pred && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white font-sans flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-signal-cyan" />
            <span>Why this valuation? (Model Factors)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 bg-signal-emerald/5 border border-signal-emerald/20 rounded-xl space-y-2">
              <p className="font-bold text-signal-emerald">Positive Model Signals</p>
              <ul className="space-y-1 text-gray-300">
                {pred.key_positive_factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-signal-crimson/5 border border-signal-crimson/20 rounded-xl space-y-2">
              <p className="font-bold text-signal-crimson">Negative / Risk Factors</p>
              <ul className="space-y-1 text-gray-300">
                {pred.key_negative_factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
