import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  mainTitle: string;
  subTitle?: string;
  categoryTag?: string;
  description?: string;
}

export const AnimatedHeadline: React.FC<Props> = ({
  mainTitle,
  subTitle,
  categoryTag,
  description,
}) => {
  return (
    <div className="space-y-3 select-none">
      {categoryTag && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center space-x-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-signal-cyan uppercase">
            {categoryTag}
          </span>
        </motion.div>
      )}

      <div className="overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-white leading-none uppercase drop-shadow-md"
        >
          {mainTitle}
        </motion.h1>
      </div>

      {subTitle && (
        <div className="overflow-hidden">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display text-gray-300 uppercase"
          >
            {subTitle}
          </motion.h2>
        </div>
      )}

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm text-gray-300 font-mono max-w-2xl mt-2 leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};
