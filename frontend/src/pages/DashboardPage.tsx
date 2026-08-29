import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Cpu, ArrowRight } from 'lucide-react';
import { fetchDashboardSummary } from '../api/client';
import { DashboardSummary } from '../types/api';
import { AnimatedHeadline } from '../components/motion/AnimatedHeadline';
import { AnimatedCounter } from '../components/motion/AnimatedCounter';
import { RevealOnScroll } from '../components/motion/RevealOnScroll';
import { LiveTicker } from '../components/motion/LiveTicker';

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
      .catch(() => {
        setError('DATA LINK INTERRUPTED - Unable to connect to valuation engine.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-white/5 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-signal-crimson/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-signal-crimson/10 text-signal-crimson mx-auto flex items-center justify-center">
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

  const tickerItems = [
    { label: 'MODEL VERSION', value: summary.model_version.toUpperCase() },
    { label: 'PLAYERS TRACKED', value: summary.total_players.toLocaleString() },
    { label: 'HISTORICAL VALUATIONS', value: summary.total_valuations.toLocaleString() },
    { label: 'TEST WAPE', value: `${summary.model_out_of_time_wape_pct}%`, isPositive: true },
    { label: 'MODEL R²', value: `${summary.model_out_of_time_r2}`, isPositive: true },
    { label: 'LATEST OBSERVED DATE', value: summary.latest_valuation_date },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Live Broadcast Ticker */}
      <LiveTicker items={tickerItems} />

      {/* Cinematic Hero Section */}
      <div className="relative overflow-hidden glass-panel p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-signal-cyan/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full bg-signal-cyan/15 border border-signal-cyan/30 text-signal-cyan text-xs font-mono font-bold tracking-widest uppercase">
              MODEL: {summary.model_version}
            </span>
            <span className="px-3 py-1 rounded-full bg-signal-emerald/15 border border-signal-emerald/30 text-signal-emerald text-xs font-mono font-bold tracking-widest uppercase">
              TEST WAPE: {summary.model_out_of_time_wape_pct}%
            </span>
          </div>

          <AnimatedHeadline
            categoryTag="VALUATION INTELLIGENCE PLATFORM"
            mainTitle="PREMIER LEAGUE"
            subTitle="VALUATION INTELLIGENCE"
            description="Machine-learning player market valuation built from historical market values, performance statistics, transfer movements, and temporal features using strict anti-leakage governance."
          />

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-gray-300">
            <button
              onClick={() => navigate('/players')}
              className="px-6 py-3 rounded-xl bg-signal-cyan/20 border border-signal-cyan/40 text-signal-cyan font-bold hover:bg-signal-cyan/30 transition flex items-center space-x-2"
            >
              <span>EXPLORE PLAYERS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/model-analytics')}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition"
            >
              <span>MODEL METRICS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevealOnScroll delay={0.05}>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>PLAYERS TRACKED</span>
              <Users className="w-4 h-4 text-signal-cyan" />
            </div>
            <p className="text-3xl font-black text-white font-mono">
              <AnimatedCounter value={summary.total_players} />
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Premier League & Global Scope</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>HISTORICAL VALUATIONS</span>
              <DollarSign className="w-4 h-4 text-signal-emerald" />
            </div>
            <p className="text-3xl font-black text-white font-mono">
              <AnimatedCounter value={summary.total_valuations} />
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Latest: {summary.latest_valuation_date}</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>TEST WAPE SCORE</span>
              <Activity className="w-4 h-4 text-signal-cyan" />
            </div>
            <p className="text-3xl font-black text-signal-emerald font-mono">
              {summary.model_out_of_time_wape_pct}%
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Out-of-Time Held-Out Test Set</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.2}>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>MODEL $R^2$ VARIANCE</span>
              <Cpu className="w-4 h-4 text-signal-cyan" />
            </div>
            <p className="text-3xl font-black text-white font-mono">
              {summary.model_out_of_time_r2}
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Out-of-Time Test Set</p>
          </div>
        </RevealOnScroll>
      </div>

      {/* Undervalued vs Overvalued Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Undervalued */}
        <RevealOnScroll delay={0.25}>
          <div className="glass-panel p-6 rounded-3xl border border-signal-emerald/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-signal-emerald" />
                <h2 className="font-bold text-white font-display text-lg tracking-wide uppercase">Top Model Undervalued</h2>
              </div>
              <span className="text-[10px] font-mono text-signal-emerald bg-signal-emerald/10 px-2.5 py-1 rounded-full border border-signal-emerald/30 font-bold uppercase">
                FAIR VALUE &gt; OBSERVED
              </span>
            </div>

            <div className="space-y-3">
              {summary.top_undervalued.map((p) => (
                <motion.div
                  key={p.player_id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View valuation profile for ${p.name}`}
                  onClick={() => navigate(`/players/${p.player_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/players/${p.player_id}`);
                  }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-signal-emerald/50"
                >
                  <div>
                    <h3 className="font-bold text-white text-sm hover:text-signal-cyan transition">{p.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{p.position} • {p.club_name || 'Free Agent'}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-xs text-gray-400">Observed: {formatEuro(p.observed_market_value_eur)}</p>
                    <p className="text-sm font-bold text-signal-emerald">Fair Value: {formatEuro(p.predicted_fair_value_eur)}</p>
                    <p className="text-[11px] text-signal-emerald font-bold flex items-center justify-end space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{p.valuation_gap_pct.toFixed(1)}% (UNDERVALUED)</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {/* Top Overvalued */}
        <RevealOnScroll delay={0.3}>
          <div className="glass-panel p-6 rounded-3xl border border-signal-crimson/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-signal-crimson" />
                <h2 className="font-bold text-white font-display text-lg tracking-wide uppercase">Top Model Overvalued</h2>
              </div>
              <span className="text-[10px] font-mono text-signal-crimson bg-signal-crimson/10 px-2.5 py-1 rounded-full border border-signal-crimson/30 font-bold uppercase">
                FAIR VALUE &lt; OBSERVED
              </span>
            </div>

            <div className="space-y-3">
              {summary.top_overvalued.map((p) => (
                <motion.div
                  key={p.player_id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View valuation profile for ${p.name}`}
                  onClick={() => navigate(`/players/${p.player_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/players/${p.player_id}`);
                  }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-signal-crimson/50"
                >
                  <div>
                    <h3 className="font-bold text-white text-sm hover:text-signal-cyan transition">{p.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{p.position} • {p.club_name || 'Free Agent'}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-xs text-gray-400">Observed: {formatEuro(p.observed_market_value_eur)}</p>
                    <p className="text-sm font-bold text-signal-crimson">Fair Value: {formatEuro(p.predicted_fair_value_eur)}</p>
                    <p className="text-[11px] text-signal-crimson font-bold flex items-center justify-end space-x-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>{p.valuation_gap_pct.toFixed(1)}% (OVERVALUED)</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </div>
  );
};
