import React, { useState, useEffect } from 'react';
import { GitCompare, Plus, X, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchPlayers, fetchPlayerComparison } from '../api/client';
import { ComparisonPlayer, PlayerSummary } from '../types/api';
import { AnimatedHeadline } from '../components/motion/AnimatedHeadline';
import { RevealOnScroll } from '../components/motion/RevealOnScroll';

export const ComparePage: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparedPlayers, setComparedPlayers] = useState<ComparisonPlayer[]>([]);
  const [searchResults, setSearchResults] = useState<PlayerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Dynamically resolve initial comparison players from Premier League API top results
  useEffect(() => {
    fetchPlayers({ league: 'GB1', page_size: 2 })
      .then((res) => {
        if (res.items && res.items.length >= 2) {
          setSelectedIds([res.items[0].player_id, res.items[1].player_id]);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setLoading(true);
      fetchPlayerComparison(selectedIds)
        .then((players) => {
          setComparedPlayers(players);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setComparedPlayers([]);
      setLoading(false);
    }
  }, [selectedIds]);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      fetchPlayers({ search: searchTerm.trim(), league: 'GB1', page_size: 5 })
        .then((res) => setSearchResults(res.items))
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const addPlayer = (id: number) => {
    if (!selectedIds.includes(id) && selectedIds.length < 6) {
      setSelectedIds([...selectedIds, id]);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const removePlayer = (id: number) => {
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter((pId) => pId !== id));
    }
  };

  const formatEuro = (val: number | null) => {
    if (val === null || val === undefined) return 'N/A';
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}€${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${sign}€${(absVal / 1000).toFixed(0)}K`;
    return `${sign}€${absVal.toFixed(0)}`;
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <AnimatedHeadline
          categoryTag="SCOUTING MATRIX"
          mainTitle="PLAYER"
          subTitle="COMPARISON MATRIX"
          description="Side-by-side machine learning valuation signals, market values, and trailing performance analytics."
        />

        {/* Add Player Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            aria-label="Search and add player to comparison matrix"
            placeholder="Add player to compare..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={selectedIds.length >= 6}
            className="w-full bg-background-dark/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-signal-cyan disabled:opacity-50 font-mono"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-14 left-0 right-0 bg-background-dark border border-white/10 rounded-2xl p-2 z-30 shadow-2xl space-y-1">
              {searchResults.map((p) => (
                <div
                  key={p.player_id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Add ${p.name} to comparison`}
                  onClick={() => addPlayer(p.player_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') addPlayer(p.player_id);
                  }}
                  className="p-2.5 hover:bg-white/10 rounded-xl cursor-pointer text-xs font-mono text-white flex justify-between items-center"
                >
                  <span>{p.name} ({p.current_club_name || 'Free Agent'})</span>
                  <Plus className="w-4 h-4 text-signal-cyan" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {loading ? (
        <div className="h-96 bg-white/5 rounded-3xl animate-pulse" />
      ) : comparedPlayers.length < 2 ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-3 font-mono">
          <p className="text-gray-400">Select at least 2 players to display comparison matrix.</p>
        </div>
      ) : (
        <RevealOnScroll>
          <div className="glass-panel rounded-3xl overflow-x-auto border border-white/10 shadow-2xl">
            <table aria-label="Player comparison matrix table" className="w-full text-left font-mono text-xs">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-5 text-gray-400 font-bold uppercase tracking-wider">Analytical Metric</th>
                  {comparedPlayers.map((p) => (
                    <th key={p.player_id} className="p-5 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-base hover:text-signal-cyan transition">{p.name}</p>
                          <p className="text-[11px] text-gray-400 font-normal">{p.club_name || 'Free Agent'}</p>
                        </div>
                        {selectedIds.length > 2 && (
                          <button
                            onClick={() => removePlayer(p.player_id)}
                            aria-label={`Remove ${p.name} from comparison matrix`}
                            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-signal-crimson hover:bg-white/10 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-5 text-gray-400 font-semibold">Position</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-white font-bold">{p.position || 'N/A'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 text-gray-400 font-semibold">Age</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-white font-bold">{p.age || 'N/A'}</td>
                  ))}
                </tr>
                <tr className="bg-white/5">
                  <td className="p-5 text-gray-400 font-semibold uppercase">Observed Market Value</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-white font-black text-sm">{formatEuro(p.observed_market_value_eur)}</td>
                  ))}
                </tr>
                <tr className="bg-signal-cyan/10">
                  <td className="p-5 text-signal-cyan font-extrabold uppercase">Predicted Fair Value</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-signal-cyan font-black text-base">{formatEuro(p.predicted_fair_value_eur)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 text-gray-400 font-semibold uppercase">Valuation Signal</td>
                  {comparedPlayers.map((p) => {
                    const gap = p.valuation_gap_eur || 0;
                    const isUndervalued = gap > 0;
                    const isOvervalued = gap < 0;
                    return (
                      <td key={p.player_id} className="p-5 font-bold">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-mono ${
                          isUndervalued
                            ? 'bg-signal-emerald/15 text-signal-emerald border border-signal-emerald/30'
                            : isOvervalued
                            ? 'bg-signal-crimson/15 text-signal-crimson border border-signal-crimson/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {formatEuro(gap)} {isUndervalued ? '(UNDERVALUED)' : isOvervalued ? '(OVERVALUED)' : '(FAIR)'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-5 text-gray-400 font-semibold">Trailing Apps (365d)</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-white font-bold">{p.apps_365d}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 text-gray-400 font-semibold">Trailing Goals (365d)</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-signal-emerald font-extrabold">{p.goals_365d}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-5 text-gray-400 font-semibold">Trailing Assists (365d)</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.player_id} className="p-5 text-signal-cyan font-extrabold">{p.assists_365d}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </RevealOnScroll>
      )}
    </div>
  );
};
