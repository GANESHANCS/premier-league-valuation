import React, { useEffect, useState, useRef } from 'react';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatter?: (val: number) => string;
}

export const AnimatedCounter: React.FC<Props> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  formatter,
}) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const elementRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeProgress * value));

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(value);
            }
          };

          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [value, duration]);

  const displayString = formatter ? formatter(count) : count.toLocaleString();

  return (
    <span ref={elementRef} className="font-mono">
      {prefix}
      {displayString}
      {suffix}
    </span>
  );
};
