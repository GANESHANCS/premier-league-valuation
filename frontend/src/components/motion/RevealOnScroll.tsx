import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const RevealOnScroll: React.FC<Props> = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
