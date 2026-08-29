import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

interface RouteVisualConfig {
  videoSrc: string;
  posterSrc: string;
}

const ROUTE_VISUALS: Record<string, RouteVisualConfig> = {
  '/': {
    videoSrc: '/videos/stadium_ambient.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop',
  },
  '/players': {
    videoSrc: '/videos/training_pitch.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1920&auto=format&fit=crop',
  },
  '/compare': {
    videoSrc: '/videos/tactical_pitch.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1920&auto=format&fit=crop',
  },
  '/transfers': {
    videoSrc: '/videos/tunnel_arrival.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1920&auto=format&fit=crop',
  },
  '/model-analytics': {
    videoSrc: '/videos/model_grid.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&auto=format&fit=crop',
  },
};

export const CinematicBackground: React.FC = () => {
  const location = useLocation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0px', '40px']);

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
      {/* Layer 1: Background Video Layer with Color Grading & Subtle Parallax */}
      {!prefersReducedMotion && !videoError && (
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-0 w-full h-full"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            poster={currentVisual.posterSrc}
            style={{
              filter: 'brightness(0.82) contrast(1.12) saturate(0.85)',
            }}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-90 scale-100' : 'opacity-0'
            }`}
          >
            <source src={fullVideoSrc} type="video/mp4" />
          </video>
        </motion.div>
      )}

      {/* Fallback Poster Layer */}
      {(prefersReducedMotion || videoError || !videoLoaded) && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-100"
          style={{
            backgroundImage: `url(${currentVisual.posterSrc})`,
            filter: 'blur(2px) brightness(0.4) saturate(1.1)',
          }}
        />
      )}

      {/* Layer 2: Left-to-Right Directional Gradient (Dark on left for text readability, clear on right for footballer) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05080d]/95 via-[#05080d]/40 to-transparent pointer-events-none" />

      {/* Layer 3: Top-to-Bottom Subtle Dark Tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05080d]/60 via-transparent to-[#05080d]/80 pointer-events-none" />

      {/* Layer 4: Subtle Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/10 to-[#05080d]/70 pointer-events-none" />

      {/* Layer 5: Technical Grid Pattern (Low opacity) */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
    </div>
  );
};
