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
    <div className="space-y-2 select-none">
      {categoryTag && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white leading-none uppercase"
        >
          {mainTitle}
        </motion.h1>
      </div>

      {subTitle && (
        <div className="overflow-hidden">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display text-gray-300 uppercase"
          >
            {subTitle}
          </motion.h2>
        </div>
      )}

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xs sm:text-sm text-gray-400 font-mono max-w-2xl mt-2 leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};
