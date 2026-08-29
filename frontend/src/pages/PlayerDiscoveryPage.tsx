import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchPlayers } from '../api/client';
import { PlayerSummary, PaginationMeta } from '../types/api';
import { AnimatedHeadline } from '../components/motion/AnimatedHeadline';
import { RevealOnScroll } from '../components/motion/RevealOnScroll';

export const PlayerDiscoveryPage: React.FC = () => {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<string>('');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [leagueScope, setLeagueScope] = useState<string>('GB1');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchPlayers({
      search: search.trim() || undefined,
      position: position || undefined,
      league: leagueScope,
      page,
      page_size: 24,
    })
      .then((data) => {
        let items = data.items;
        if (signalFilter === 'UNDERVALUED') {
          items = items.filter((p) => (p.valuation_gap_eur || 0) > 0);
        } else if (signalFilter === 'OVERVALUED') {
          items = items.filter((p) => (p.valuation_gap_eur || 0) < 0);
        }
        setPlayers(items);
        setMeta(data.meta);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, position, leagueScope, signalFilter, page]);

  const formatEuro = (val: number | null) => {
    if (!val) return 'N/A';
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <AnimatedHeadline
          categoryTag="SCOUTING INTELLIGENCE"
          mainTitle="PLAYER"
          subTitle="DISCOVERY TERMINAL"
          description={meta ? `${meta.total.toLocaleString()} players tracked (${leagueScope === 'GB1' ? 'Premier League Universe' : 'Global Scope'})` : 'Searching valuation database...'}
        />

        {/* View Toggle */}
        <div className="flex items-center space-x-2" role="group" aria-label="Layout view mode">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Switch to grid layout view"
            aria-pressed={viewMode === 'grid'}
            className={`p-2.5 rounded-xl border transition ${
              viewMode === 'grid'
                ? 'bg-signal-cyan/20 border-signal-cyan/40 text-signal-cyan font-bold'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="Switch to table layout view"
            aria-pressed={viewMode === 'table'}
            className={`p-2.5 rounded-xl border transition ${
              viewMode === 'table'
                ? 'bg-signal-cyan/20 border-signal-cyan/40 text-signal-cyan font-bold'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Domain Scope Select */}
        <select
          value={leagueScope}
          aria-label="Filter player domain scope"
          onChange={(e) => {
            setLeagueScope(e.target.value);
            setPage(1);
          }}
          className="bg-background-dark/80 border border-signal-cyan/40 rounded-2xl px-4 py-2.5 text-xs text-signal-cyan font-mono font-bold focus:outline-none focus:border-signal-cyan"
        >
          <option value="GB1">Premier League Universe (Default)</option>
          <option value="all">Global Players Scope</option>
        </select>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            aria-label="Search player name or club"
            placeholder="Search player or club..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background-dark/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-signal-cyan font-mono"
          />
        </div>

        {/* Position Select */}
        <select
          value={position}
          aria-label="Filter players by position"
          onChange={(e) => {
            setPosition(e.target.value);
            setPage(1);
          }}
          className="bg-background-dark/80 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-signal-cyan"
        >
          <option value="">All Positions</option>
          <option value="Attack">Attack</option>
          <option value="Midfield">Midfield</option>
          <option value="Defender">Defender</option>
          <option value="Goalkeeper">Goalkeeper</option>
        </select>

        {/* Signal Select */}
        <select
          value={signalFilter}
          aria-label="Filter players by model valuation signal"
          onChange={(e) => setSignalFilter(e.target.value)}
          className="bg-background-dark/80 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-signal-cyan"
        >
          <option value="ALL">All Valuation Signals</option>
          <option value="UNDERVALUED">Model Undervalued</option>
          <option value="OVERVALUED">Model Overvalued</option>
        </select>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-3 font-mono">
          <Filter className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="text-lg font-bold text-white uppercase">NO PLAYERS MATCH FILTERS</h3>
          <p className="text-xs text-gray-400">Try adjusting your search query or position selections.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {players.map((p) => {
              const gap = p.valuation_gap_eur || 0;
              const isUndervalued = gap > 0;
              const isOvervalued = gap < 0;
              const signalText = isUndervalued ? 'UNDERVALUED' : isOvervalued ? 'OVERVALUED' : 'FAIR VALUE';

              return (
                <motion.div
                  key={p.player_id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View detail profile for ${p.name}, ${signalText}`}
                  onClick={() => navigate(`/players/${p.player_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/players/${p.player_id}`);
                  }}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel p-5 rounded-3xl cursor-pointer space-y-4 flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 border border-white/10 hover:border-signal-cyan/40 hover:bg-[#0f1520]/90 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base hover:text-signal-cyan transition leading-snug">{p.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{p.position || 'Unknown'} • {p.current_club_name || 'Free Agent'}</p>
                      </div>
                      {isUndervalued ? (
                        <span className="px-2 py-0.5 rounded-full bg-signal-emerald/15 text-signal-emerald border border-signal-emerald/30 text-[9px] font-mono font-bold flex items-center space-x-1 uppercase">
                          <TrendingUp className="w-3 h-3" />
                          <span>UNDERVALUED</span>
                        </span>
                      ) : isOvervalued ? (
                        <span className="px-2 py-0.5 rounded-full bg-signal-crimson/15 text-signal-crimson border border-signal-crimson/30 text-[9px] font-mono font-bold flex items-center space-x-1 uppercase">
                          <TrendingDown className="w-3 h-3" />
                          <span>OVERVALUED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[9px] font-mono flex items-center space-x-1 uppercase">
                          <Minus className="w-3 h-3" />
                          <span>FAIR</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Observed Value</span>
                      <span>{formatEuro(p.latest_observed_market_value_eur)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-300">Predicted Fair Value</span>
                      <span className={isUndervalued ? 'text-signal-emerald' : isOvervalued ? 'text-signal-crimson' : 'text-signal-cyan'}>
                        {formatEuro(p.predicted_fair_value_eur)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </RevealOnScroll>
      ) : (
        /* Table View */
        <RevealOnScroll>
          <div className="glass-panel rounded-3xl overflow-x-auto border border-white/10 shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-gray-400 border-b border-white/10 uppercase">
                <tr>
                  <th className="p-4">Player</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Club</th>
                  <th className="p-4 text-right">Observed Value</th>
                  <th className="p-4 text-right">Predicted Fair Value</th>
                  <th className="p-4 text-right">Valuation Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((p) => {
                  const gap = p.valuation_gap_eur || 0;
                  return (
                    <tr
                      key={p.player_id}
                      onClick={() => navigate(`/players/${p.player_id}`)}
                      className="hover:bg-white/5 cursor-pointer transition"
                    >
                      <td className="p-4 font-bold text-white">{p.name}</td>
                      <td className="p-4 text-gray-300">{p.position}</td>
                      <td className="p-4 text-gray-400">{p.current_club_name || 'Free Agent'}</td>
                      <td className="p-4 text-right text-gray-300">{formatEuro(p.latest_observed_market_value_eur)}</td>
                      <td className="p-4 text-right font-bold text-signal-cyan">{formatEuro(p.predicted_fair_value_eur)}</td>
                      <td className={`p-4 text-right font-bold ${gap > 0 ? 'text-signal-emerald' : gap < 0 ? 'text-signal-crimson' : 'text-gray-400'}`}>
                        {formatEuro(gap)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </RevealOnScroll>
      )}

      {/* Pagination Bar */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-gray-400">
          <span>Page {meta.page} of {meta.total_pages}</span>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= meta.total_pages}
              onClick={() => setPage(page + 1)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
