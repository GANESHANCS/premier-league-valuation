import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteVisualConfig {
  videoSrc: string;
  posterSrc: string;
  tintOverlay: string;
}

const ROUTE_VISUALS: Record<string, RouteVisualConfig> = {
  '/': {
    videoSrc: '/videos/stadium_ambient.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop',
    tintOverlay: 'from-[#05080d] via-[#05080d]/85 to-[#080c12]',
  },
  '/players': {
    videoSrc: '/videos/training_pitch.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1920&auto=format&fit=crop',
    tintOverlay: 'from-[#05080d] via-[#05080d]/85 to-[#080c12]',
  },
  '/compare': {
    videoSrc: '/videos/tactical_pitch.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1920&auto=format&fit=crop',
    tintOverlay: 'from-[#05080d] via-[#05080d]/85 to-[#080c12]',
  },
  '/transfers': {
    videoSrc: '/videos/tunnel_arrival.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1920&auto=format&fit=crop',
    tintOverlay: 'from-[#05080d] via-[#05080d]/85 to-[#080c12]',
  },
  '/model-analytics': {
    videoSrc: '/videos/model_grid.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&auto=format&fit=crop',
    tintOverlay: 'from-[#05080d] via-[#05080d]/90 to-[#080c12]',
  },
};

export const CinematicBackground: React.FC = () => {
  const location = useLocation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const fullVideoSrc = `${baseUrl}${currentVisual.videoSrc}`;

  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
    if (videoRef.current && !prefersReducedMotion) {
      videoRef.current.load();
      videoRef.current.play().catch(() => setVideoError(true));
    }
  }, [fullVideoSrc, prefersReducedMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Background Video Layer */}
      {!prefersReducedMotion && !videoError && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          poster={currentVisual.posterSrc}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-30 scale-105' : 'opacity-0'
          }`}
        >
          <source src={fullVideoSrc} type="video/mp4" />
        </video>
      )}

      {/* 2. Poster Fallback Layer (When video loading or loading error or reduced motion) */}
      {(prefersReducedMotion || videoError || !videoLoaded) && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{
            backgroundImage: `url(${currentVisual.posterSrc})`,
            filter: 'blur(3px) brightness(0.35) saturate(1.1)',
          }}
        />
      )}

      {/* 3. Dark Cinematic Layer */}
      <div className="absolute inset-0 bg-[#05080d]/80 backdrop-brightness-75" />

      {/* 4. Subtle Gradient Tint Layer */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentVisual.tintOverlay}`} />

      {/* 5. Technical Grid Pattern Layer */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* 6. Subconscious Atmospheric Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-signal-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-signal-emerald/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
