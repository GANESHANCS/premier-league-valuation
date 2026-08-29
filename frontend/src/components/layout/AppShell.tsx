import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CinematicBackground } from '../visuals/CinematicBackground';
import { InitializationScreen } from '../common/InitializationScreen';
import { PageTransition } from '../motion/PageTransition';
import { AnimatePresence } from 'framer-motion';
import { fetchDashboardSummary } from '../../api/client';
import { DashboardSummary } from '../../types/api';

interface Props {
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then((data) => setSummary(data))
      .catch((err) => console.error('Failed to load AppShell summary:', err));
  }, []);

  return (
    <div className="min-h-screen bg-[#05080d] text-gray-100 flex flex-col relative overflow-hidden font-sans select-none">
      <AnimatePresence>
        {!initialized && (
          <InitializationScreen onComplete={() => setInitialized(true)} />
        )}
      </AnimatePresence>

      <CinematicBackground />

      <div className="flex flex-1 z-10 relative">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>

          {/* Bottom Persistent Intelligence Footer */}
          <footer className="h-10 border-t border-white/5 bg-background-dark/80 px-6 flex items-center justify-between text-[11px] font-mono text-gray-400 backdrop-blur-xl z-20">
            <div>
              <span>SYSTEM: </span>
              <span className="text-signal-emerald">ONLINE ● {summary ? `${summary.total_players.toLocaleString()} PLAYERS TRACKED` : 'AUDITED DATASET'}</span>
            </div>
            <div className="hidden sm:block">
              <span>PROVENANCE: </span>
              <span className="text-gray-400">TRANSFERMARKT HISTORICAL DATASET • XGBOOST-V1 MODEL</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
