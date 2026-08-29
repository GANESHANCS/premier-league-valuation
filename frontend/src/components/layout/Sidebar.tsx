import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GitCompare, ArrowLeftRight, LineChart, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/players', label: 'Player Discovery', icon: Users },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { path: '/model-analytics', label: 'Model Analytics', icon: LineChart },
];

export const Sidebar: React.FC = () => {
  return (
    <aside aria-label="Main navigation sidebar" className="w-64 bg-background-dark/95 border-r border-white/10 flex flex-col justify-between hidden md:flex z-30 select-none backdrop-blur-xl">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-signal-cyan to-signal-emerald p-0.5 shadow-glow-cyan">
            <div className="w-full h-full bg-background-dark rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-signal-cyan" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide font-sans text-base">PL VALUEDGE</h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Valuation Intelligence</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Sidebar main navigation" className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={`Navigate to ${item.label}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/30 shadow-glow-cyan/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Model Badge */}
      <div className="p-4 border-t border-white/5 text-xs font-mono text-gray-400 space-y-2">
        <div className="flex items-center justify-between">
          <span>MODEL</span>
          <span className="text-signal-cyan bg-signal-cyan/10 px-2 py-0.5 rounded border border-signal-cyan/20">XGBOOST-V1</span>
        </div>
        <div className="flex items-center justify-between">
          <span>TEST WAPE</span>
          <span className="text-signal-emerald">12.89%</span>
        </div>
      </div>
    </aside>
  );
};
