import React from 'react';

interface TickerItem {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

interface Props {
  items: TickerItem[];
}

export const LiveTicker: React.FC<Props> = ({ items }) => {
  if (!items || items.length === 0) return null;

  // Duplicate items array to ensure seamless infinite scroll loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-background-dark/90 border-y border-white/5 py-2 font-mono text-xs select-none relative z-10 backdrop-blur-md">
      <div className="flex space-x-8 animate-ticker whitespace-nowrap">
        {displayItems.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 text-gray-300">
            <span className="text-gray-500 font-semibold uppercase">{item.label}:</span>
            <span className="text-white font-bold">{item.value}</span>
            {item.change && (
              <span
                className={`text-[10px] font-bold ${
                  item.isPositive ? 'text-signal-emerald' : 'text-signal-crimson'
                }`}
              >
                {item.change}
              </span>
            )}
            <span className="text-gray-600 px-2">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};
