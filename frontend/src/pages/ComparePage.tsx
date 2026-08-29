import React, { useState, useEffect } from 'react';
import { GitCompare, Plus, X, Search } from 'lucide-react';
import { fetchPlayers, fetchPlayerComparison } from '../api/client';
import { ComparisonPlayer, PlayerSummary } from '../types/api';

export const ComparePage: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([10, 11]); // Default to first 2 players
  const [comparedPlayers, setComparedPlayers] = useState<ComparisonPlayer[]>([]);
  const [searchResults, setSearchResults] = useState<PlayerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

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
    }
  }, [selectedIds]);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      fetchPlayers({ search: searchTerm.trim(), page_size: 5 })
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-sans flex items-center space-x-2">
            <GitCompare className="w-6 h-6 text-signal-cyan" />
            <span>PLAYER COMPARISON MATRIX</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">Compare up to 6 players side-by-side on market values & ML signals.</p>
        </div>

        {/* Add Player Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Add player to compare..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={selectedIds.length >= 6}
            className="w-full bg-background-dark/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-signal-cyan disabled:opacity-50 font-mono"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-background-dark border border-white/10 rounded-xl p-2 z-30 shadow-2xl space-y-1">
              {searchResults.map((p) => (
                <div
                  key={p.player_id}
                  onClick={() => addPlayer(p.player_id)}
                  className="p-2 hover:bg-white/10 rounded-lg cursor-pointer text-xs font-mono text-white flex justify-between"
                >
                  <span>{p.name} ({p.current_club_name || 'Free Agent'})</span>
                  <Plus className="w-3.5 h-3.5 text-signal-cyan" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Grid Table */}
      {loading ? (
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      ) : comparedPlayers.length < 2 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 font-mono">
          <p className="text-gray-400">Select at least 2 players to display comparison matrix.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-x-auto border border-white/10">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 text-gray-400 font-normal">Metric</th>
                {comparedPlayers.map((p) => (
                  <th key={p.player_id} className="p-4 min-w-[180px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.club_name || 'Free Agent'}</p>
                      </div>
                      {selectedIds.length > 2 && (
                        <button
                          onClick={() => removePlayer(p.player_id)}
                          className="p-1 text-gray-500 hover:text-signal-crimson transition"
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
                <td className="p-4 text-gray-400">Position</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-white font-bold">{p.position || 'N/A'}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-gray-400">Age</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-white">{p.age || 'N/A'}</td>
                ))}
              </tr>
              <tr className="bg-white/5">
                <td className="p-4 text-gray-400">Observed Market Value</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-white font-bold">{formatEuro(p.observed_market_value_eur)}</td>
                ))}
              </tr>
              <tr className="bg-signal-cyan/5">
                <td className="p-4 text-signal-cyan font-bold">Predicted Fair Value</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-signal-cyan font-bold text-sm">{formatEuro(p.predicted_fair_value_eur)}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-gray-400">Valuation Gap</td>
                {comparedPlayers.map((p) => {
                  const gap = p.valuation_gap_eur || 0;
                  return (
                    <td key={p.player_id} className={`p-4 font-bold ${gap > 0 ? 'text-signal-emerald' : gap < 0 ? 'text-signal-crimson' : 'text-gray-400'}`}>
                      {formatEuro(gap)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 text-gray-400">Trailing Apps (365d)</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-white">{p.apps_365d}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-gray-400">Trailing Goals (365d)</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-signal-emerald font-bold">{p.goals_365d}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-gray-400">Trailing Assists (365d)</td>
                {comparedPlayers.map((p) => (
                  <td key={p.player_id} className="p-4 text-signal-cyan font-bold">{p.assists_365d}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
