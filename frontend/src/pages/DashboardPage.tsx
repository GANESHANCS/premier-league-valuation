import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Cpu, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { fetchDashboardSummary, API_BASE_URL } from '../api/client';
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
      <div className="p-8 rounded-3xl bg-[#080c12]/90 backdrop-blur-md border border-signal-crimson/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-signal-crimson/10 text-signal-crimson mx-auto flex items-center justify-center">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white font-mono">{error || 'Failed to load data.'}</h2>
        <p className="text-xs text-gray-400 font-mono">Ensure backend API engine is accessible ({API_BASE_URL})</p>
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
    <div className="space-y-10 select-none">
      {/* Live Broadcast Ticker */}
      <LiveTicker items={tickerItems} />

      {/* Hero Section — Directly over left-side background gradient (UNBOXED so Footballer on Right is 100% visible) */}
      <div className="relative py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Hero Content & Broadcast Typography (60% width max) */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 text-xs font-mono"
            >
              <span className="px-3 py-1 rounded-full bg-signal-emerald/15 border border-signal-emerald/30 text-signal-emerald text-[11px] font-bold tracking-widest uppercase flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-signal-emerald animate-pulse" />
                <span>SYSTEM ONLINE</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold tracking-widest uppercase flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-signal-cyan" />
                <span>{summary.model_version}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold tracking-widest uppercase flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-signal-emerald" />
                <span>TEST WAPE: {summary.model_out_of_time_wape_pct}%</span>
              </span>
            </motion.div>

            <AnimatedHeadline
              categoryTag="VALUATION INTELLIGENCE PLATFORM"
              mainTitle="PREMIER LEAGUE"
              subTitle="VALUATION INTELLIGENCE"
              description="Machine-learning player market valuation built from historical market values, performance statistics, transfer movements, and temporal features using strict anti-leakage governance."
            />

            {/* Broadcast Technical Metadata Stream */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap items-center gap-6 pt-1 text-xs font-mono text-gray-300"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-signal-cyan" />
                <span className="font-bold text-white"><AnimatedCounter value={summary.total_players} /></span>
                <span className="text-gray-400">PLAYERS</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-signal-emerald" />
                <span className="font-bold text-white"><AnimatedCounter value={summary.total_valuations} /></span>
                <span className="text-gray-400">VALUATIONS</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-signal-cyan" />
                <span className="font-bold text-white">{summary.model_out_of_time_r2}</span>
                <span className="text-gray-400">$R^2$ ACCURACY</span>
              </div>
            </motion.div>

            {/* Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="pt-3 flex flex-wrap gap-4 text-xs font-mono"
            >
              <button
                onClick={() => navigate('/players')}
                className="px-6 py-3 rounded-xl bg-signal-cyan/20 border border-signal-cyan/40 text-signal-cyan font-bold hover:bg-signal-cyan/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <span>EXPLORE PLAYERS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/model-analytics')}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>MODEL METRICS</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Completely open viewport space (40% width) for the stadium footballer to walk unobstructed */}
          <div className="lg:col-span-5 hidden lg:block" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      {/* Real Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevealOnScroll delay={0.05}>
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-2xl bg-[#080c12]/80 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-[#0f1520]/90 transition-all duration-300 space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>PLAYERS TRACKED</span>
              <Users className="w-4 h-4 text-signal-cyan" />
            </div>
            <p className="text-3xl font-black text-white font-mono">
              <AnimatedCounter value={summary.total_players} />
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Premier League & Global Scope</p>
          </motion.div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-2xl bg-[#080c12]/80 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-[#0f1520]/90 transition-all duration-300 space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>HISTORICAL VALUATIONS</span>
              <DollarSign className="w-4 h-4 text-signal-emerald" />
            </div>
            <p className="text-3xl font-black text-white font-mono">
              <AnimatedCounter value={summary.total_valuations} />
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Latest: {summary.latest_valuation_date}</p>
          </motion.div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-2xl bg-[#080c12]/80 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-[#0f1520]/90 transition-all duration-300 space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>TEST WAPE SCORE</span>
              <Activity className="w-4 h-4 text-signal-cyan" />
            </div>
            <p className="text-3xl font-black text-signal-emerald font-mono">
              {summary.model_out_of_time_wape_pct}%
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Out-of-Time Held-Out Test Set</p>
          </motion.div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.2}>
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-2xl bg-[#080c12]/80 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-[#0f1520]/90 transition-all duration-300 space-y-2 shadow-xl"
          >
            <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
              <span>MODEL $R^2$ VARIANCE</span>
              <Cpu className="w-4 h-4 text-signal-cyan" />
            </div>
            <p className="text-3xl font-black text-white font-mono">
              {summary.model_out_of_time_r2}
            </p>
            <p className="text-[11px] text-gray-400 font-mono">Out-of-Time Test Set</p>
          </motion.div>
        </RevealOnScroll>
      </div>

      {/* Undervalued vs Overvalued Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Undervalued */}
        <RevealOnScroll delay={0.25}>
          <div className="p-6 rounded-3xl bg-[#080c12]/85 backdrop-blur-md border border-signal-emerald/20 space-y-4 shadow-xl">
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
                  whileHover={{ y: -3, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-signal-emerald/50"
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
          <div className="p-6 rounded-3xl bg-[#080c12]/85 backdrop-blur-md border border-signal-crimson/20 space-y-4 shadow-xl">
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
                  whileHover={{ y: -3, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-signal-crimson/50"
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
