import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BackgroundVideoEngine } from '../visuals/BackgroundVideoEngine';
import { InitializationScreen } from '../common/InitializationScreen';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col relative overflow-hidden font-sans">
      <AnimatePresence>
        {!initialized && (
          <InitializationScreen onComplete={() => setInitialized(true)} />
        )}
      </AnimatePresence>

      <BackgroundVideoEngine />

      <div className="flex flex-1 z-10 relative">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>

          {/* Bottom Persistent Intelligence Footer */}
          <footer className="h-10 border-t border-white/5 bg-background-dark/80 px-6 flex items-center justify-between text-[11px] font-mono text-gray-400 backdrop-blur-xl z-20">
            <div>
              <span>SYSTEM: </span>
              <span className="text-signal-emerald">ONLINE ● 50,149 PLAYERS TRACKED</span>
            </div>
            <div className="hidden sm:block">
              <span>PROVENANCE: </span>
              <span className="text-gray-400">THIRD-PARTY TRANSFERMARKT-DERIVED DATASET</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
