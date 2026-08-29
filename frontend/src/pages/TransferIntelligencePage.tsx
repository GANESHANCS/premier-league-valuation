import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Search, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { fetchGlobalTransfers } from '../api/client';
import { Transfer, PaginationMeta } from '../types/api';

export const TransferIntelligencePage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchGlobalTransfers({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      page,
      page_size: 25,
    })
      .then((data) => {
        setTransfers(data.items);
        setMeta(data.meta);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, statusFilter, page]);

  const formatEuro = (val: number | null) => {
    if (!val && val !== 0) return 'N/A';
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-sans flex items-center space-x-2">
            <ArrowLeftRight className="w-6 h-6 text-signal-cyan" />
            <span>GLOBAL TRANSFER INTELLIGENCE</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            {meta ? `${meta.total.toLocaleString()} historical transfer records audited` : 'Loading transfer feed...'}
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            aria-label="Search transfer records by player name or club"
            placeholder="Search player or club..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background-dark/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-signal-cyan font-mono"
          />
        </div>

        <select
          value={statusFilter}
          aria-label="Filter transfer records by fee classification"
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-background-dark/80 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-signal-cyan font-mono"
        >
          <option value="">All Fee Classifications</option>
          <option value="disclosed">Disclosed Fee</option>
          <option value="free_transfer">Free Transfer (€0 Explicit)</option>
          <option value="undisclosed">Undisclosed Fee</option>
        </select>
      </div>

      {/* Transfers Feed Table */}
      {loading ? (
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      ) : transfers.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-2 font-mono">
          <p className="text-gray-400">No transfer records match query.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-x-auto border border-white/10">
          <table aria-label="Global historical transfer records table" className="w-full text-left font-mono text-xs">
            <thead className="bg-white/5 text-gray-400 border-b border-white/10 uppercase">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Player</th>
                <th className="p-4">From Club</th>
                <th className="p-4">To Club</th>
                <th className="p-4 text-right">Transfer Fee</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-white/5 transition">
                  <td className="p-4 text-gray-400">{tr.transfer_date}</td>
                  <td className="p-4 font-bold text-white">{tr.player_name || `Player #${tr.player_id}`}</td>
                  <td className="p-4 text-gray-300">{tr.from_club_name || 'Free Agent / Youth'}</td>
                  <td className="p-4 text-gray-300">{tr.to_club_name || 'Free Agent'}</td>
                  <td className="p-4 text-right font-bold text-white">
                    {tr.transfer_fee_status === 'disclosed' ? formatEuro(tr.transfer_fee_eur) : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                      tr.transfer_fee_status === 'disclosed'
                        ? 'bg-signal-cyan/10 border-signal-cyan/30 text-signal-cyan'
                        : tr.transfer_fee_status === 'free_transfer'
                        ? 'bg-signal-emerald/10 border-signal-emerald/30 text-signal-emerald'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}>
                      {tr.transfer_fee_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-gray-400">
          <span>Page {meta.page} of {meta.total_pages}</span>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              aria-label="Navigate to previous page"
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= meta.total_pages}
              aria-label="Navigate to next page"
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
