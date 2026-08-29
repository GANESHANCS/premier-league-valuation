import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface VideoSource {
  route: string;
  poster: string;
  gradient: string;
}

const ROUTE_VISUALS: Record<string, VideoSource> = {
  '/': {
    route: 'dashboard',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop',
    gradient: 'from-[#0b0f19]/90 via-[#0b0f19]/80 to-[#090d16]',
  },
  '/players': {
    route: 'players',
    poster: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1920&auto=format&fit=crop',
    gradient: 'from-[#0b0f19]/90 via-[#0b0f19]/85 to-[#090d16]',
  },
  '/compare': {
    route: 'compare',
    poster: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1920&auto=format&fit=crop',
    gradient: 'from-[#0b0f19]/90 via-[#0b0f19]/85 to-[#090d16]',
  },
  '/transfers': {
    route: 'transfers',
    poster: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1920&auto=format&fit=crop',
    gradient: 'from-[#0b0f19]/90 via-[#0b0f19]/85 to-[#090d16]',
  },
  '/model-analytics': {
    route: 'model-analytics',
    poster: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&auto=format&fit=crop',
    gradient: 'from-[#0b0f19]/92 via-[#0b0f19]/88 to-[#090d16]',
  },
};

export const BackgroundVideoEngine: React.FC = () => {
  const location = useLocation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const routePath = location.pathname.startsWith('/players/') && location.pathname !== '/players'
    ? '/players'
    : location.pathname;

  const currentVisual = ROUTE_VISUALS[routePath] || ROUTE_VISUALS['/'];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background Poster & Atmospheric Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
        style={{
          backgroundImage: `url(${currentVisual.poster})`,
          filter: 'blur(4px) brightness(0.4) saturate(1.2)'
        }}
      />

      {/* Layered Technical Grid and Radial Glows */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentVisual.gradient}`} />
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Radial Atmospheric Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-signal-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-signal-emerald/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
