import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Cpu, Database } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { text: 'INITIALIZING DATA PIPELINE...', icon: Database },
  { text: 'CONNECTING DATABASE LAYER...', icon: ShieldCheck },
  { text: 'LOADING VALUATION MODEL (XGBOOST-V1)...', icon: Cpu },
  { text: 'CALIBRATING MARKET SIGNALS...', icon: Activity },
  { text: 'SYSTEM ONLINE', icon: ShieldCheck },
];

export const InitializationScreen: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has initialized previously
    const hasInitialized = localStorage.getItem('pl_valuedge_initialized');
    const delay = hasInitialized ? 250 : 350;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            localStorage.setItem('pl_valuedge_initialized', 'true');
            onComplete();
          }, 300);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(timer);
  }, [onComplete]);

  const StepIcon = STEPS[currentStep].icon;

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="w-full max-w-md bg-background-card/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-signal-cyan via-signal-emerald to-signal-cyan animate-pulse" />

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-signal-cyan/10 border border-signal-cyan/30 flex items-center justify-center text-signal-cyan">
            <Cpu className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider font-sans">PL VALUEDGE</h1>
            <p className="text-xs text-gray-400 font-mono">VALUATION INTELLIGENCE v1.0</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-4 mb-6">
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-signal-cyan to-signal-emerald"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <div className="flex items-center space-x-3 text-sm font-mono text-signal-cyan">
            <StepIcon className="w-4 h-4 animate-pulse" />
            <AnimatePresence mode="wait">
              <motion.span 
                key={currentStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-gray-200"
              >
                {STEPS[currentStep].text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-500">
          <span>DATA RETRIEVAL: 29 AUG 2026</span>
          <span className="text-signal-emerald">TEMPORAL SAFETY: 100%</span>
        </div>
      </div>
    </motion.div>
  );
};
