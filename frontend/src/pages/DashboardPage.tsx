import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Cpu, ArrowRight } from 'lucide-react';
import { fetchDashboardSummary } from '../api/client';
import { DashboardSummary } from '../types/api';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardSummary()
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('DATA LINK INTERRUPTED - Unable to connect to valuation engine.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-signal-crimson/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-signal-crimson/10 text-signal-crimson mx-auto flex items-center justify-center">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white font-mono">{error || 'Failed to load data.'}</h2>
        <p className="text-xs text-gray-400 font-mono">Ensure FastAPI backend is running at http://127.0.0.1:8000</p>
      </div>
    );
  }

  const formatEuro = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-signal-cyan/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan text-xs font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>MODEL VERSION: {summary.model_version}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-sans">
            PREMIER LEAGUE <br />
            <span className="bg-gradient-to-r from-signal-cyan via-white to-signal-emerald bg-clip-text text-transparent">
              VALUATION INTELLIGENCE
            </span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base font-sans leading-relaxed">
            Machine-learning player market valuation system built from historical market values, performance statistics, and temporal features using strict anti-leakage governance.
          </p>
        </div>
      </div>

      {/* Real Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>PLAYERS TRACKED</span>
            <Users className="w-4 h-4 text-signal-cyan" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{summary.total_players.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 font-mono">Across Premier League & Global Leagues</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>HISTORICAL VALUATIONS</span>
            <DollarSign className="w-4 h-4 text-signal-emerald" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{summary.total_valuations.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 font-mono">Latest Date: {summary.latest_valuation_date}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>MODEL TEST WAPE</span>
            <Activity className="w-4 h-4 text-signal-cyan" />
          </div>
          <p className="text-3xl font-extrabold text-signal-emerald font-mono">{summary.model_out_of_time_wape_pct}%</p>
          <p className="text-[11px] text-gray-400 font-mono">Out-of-Time Held-Out Test Set</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>MODEL $R^2$ SCORE</span>
            <Cpu className="w-4 h-4 text-signal-cyan" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{summary.model_out_of_time_r2}</p>
          <p className="text-[11px] text-gray-400 font-mono">Out-of-Time Test Set</p>
        </div>
      </div>

      {/* Undervalued vs Overvalued Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Undervalued */}
        <div className="glass-panel p-6 rounded-2xl border border-signal-emerald/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-signal-emerald" />
              <h2 className="font-bold text-white font-sans text-lg">Top Model Undervalued</h2>
            </div>
            <span className="text-xs font-mono text-signal-emerald bg-signal-emerald/10 px-2.5 py-1 rounded-full border border-signal-emerald/30">
              FAIR VALUE &gt; OBSERVED
            </span>
          </div>

          <div className="space-y-3">
            {summary.top_undervalued.map((p) => (
              <motion.div
                key={p.player_id}
                onClick={() => navigate(`/players/${p.player_id}`)}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex items-center justify-between transition"
              >
                <div>
                  <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{p.position} • {p.club_name || 'Free Agent'}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs text-gray-400">Observed: {formatEuro(p.observed_market_value_eur)}</p>
                  <p className="text-sm font-bold text-signal-emerald">Fair Value: {formatEuro(p.predicted_fair_value_eur)}</p>
                  <p className="text-[11px] text-signal-emerald font-bold">+{p.valuation_gap_pct.toFixed(1)}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top Overvalued */}
        <div className="glass-panel p-6 rounded-2xl border border-signal-crimson/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-signal-crimson" />
              <h2 className="font-bold text-white font-sans text-lg">Top Model Overvalued</h2>
            </div>
            <span className="text-xs font-mono text-signal-crimson bg-signal-crimson/10 px-2.5 py-1 rounded-full border border-signal-crimson/30">
              FAIR VALUE &lt; OBSERVED
            </span>
          </div>

          <div className="space-y-3">
            {summary.top_overvalued.map((p) => (
              <motion.div
                key={p.player_id}
                onClick={() => navigate(`/players/${p.player_id}`)}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex items-center justify-between transition"
              >
                <div>
                  <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{p.position} • {p.club_name || 'Free Agent'}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs text-gray-400">Observed: {formatEuro(p.observed_market_value_eur)}</p>
                  <p className="text-sm font-bold text-signal-crimson">Fair Value: {formatEuro(p.predicted_fair_value_eur)}</p>
                  <p className="text-[11px] text-signal-crimson font-bold">{p.valuation_gap_pct.toFixed(1)}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
