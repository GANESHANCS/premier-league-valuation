import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Download, Menu, X, LayoutDashboard, Users, GitCompare, ArrowLeftRight, LineChart } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/players', label: 'Players', icon: Users },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { path: '/model-analytics', label: 'Analytics', icon: LineChart },
];

export const Header: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  };

  return (
    <header aria-label="Global application navigation header" className="h-16 bg-background-dark/80 border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
      {/* System Status Indicators */}
      <div className="flex items-center space-x-6 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-signal-emerald animate-ping" />
          <span className="text-gray-300 font-semibold">DATA RETRIEVED</span>
          <span className="text-gray-400 font-normal">29 AUG 2026</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-gray-400">
          <span>LATEST OBSERVED VALUATION:</span>
          <span className="text-signal-cyan">12 JUN 2026</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            aria-label="Install Premier League Valuation Intelligence PWA"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan hover:bg-signal-cyan/20 transition text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>INSTALL PWA</span>
          </button>
        )}

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-background-dark border-b border-white/10 p-4 space-y-2 z-40 animate-in fade-in slide-in-from-top-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-signal-cyan/20 text-signal-cyan border border-signal-cyan/30' : 'text-gray-300 hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
