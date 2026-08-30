import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Cpu, Activity, BarChart2, CheckCircle, Info } from 'lucide-react';
import { fetchModelAnalytics } from '../api/client';
import { ModelAnalytics } from '../types/api';
import { AnimatedHeadline } from '../components/motion/AnimatedHeadline';
import { RevealOnScroll } from '../components/motion/RevealOnScroll';
import { AnimatedCounter } from '../components/motion/AnimatedCounter';

const FEATURE_LABEL_MAP: Record<string, string> = {
  prev_market_value_eur: 'Previous Market Value (€)',
  val_count_prior: 'Prior Valuation Count',
  prev_transfer_fee_eur: 'Previous Transfer Fee (€)',
  total_prior_transfers: 'Total Prior Transfers',
  apps_365d: 'Trailing 365d Appearances',
  age_at_valuation: 'Age at Valuation Date',
  minutes_365d: 'Trailing 365d Minutes',
  val_change_365d: 'Trailing 365d Value Change (€)',
  days_since_prev_val: 'Days Since Previous Valuation',
  days_since_prev_transfer: 'Days Since Previous Transfer',
  age_squared: 'Age Squared (Non-linear)',
  starts_365d: 'Trailing 365d Starts',
  goals_per90_365d: 'Trailing 365d Goals / 90',
  main_position: 'Main Position Code',
  val_growth_ratio_365d: '365d Valuation Growth Ratio',
};

export const ModelAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<ModelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelAnalytics()
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-6 select-none">
        <div className="h-48 bg-white/5 rounded-3xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const test = analytics.out_of_time_test_metrics;
  const val = analytics.validation_metrics;

  const topFeatures = (analytics.feature_importances || []).slice(0, 10);
  const maxImportance = topFeatures.length > 0 ? topFeatures[0].importance_mean : 1;

  const featureChartData = topFeatures.map((f) => {
    const displayName = FEATURE_LABEL_MAP[f.feature] || f.feature;
    const importancePct = +(f.importance_mean * 100).toFixed(2);
    return {
      rawFeature: f.feature,
      displayName,
      name: displayName.length > 22 ? `${displayName.substring(0, 20)}...` : displayName,
      importance: importancePct,
      std: +(f.importance_std * 100).toFixed(2),
    };
  });

  return (
    <div className="space-y-8 select-none">
      {/* Hero Title */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-signal-cyan/15 border border-signal-cyan/30 text-signal-cyan text-xs font-mono font-bold uppercase mb-4">
          <Cpu className="w-3.5 h-3.5" />
          <span>MODEL ARCHITECTURE: {analytics.model_name} ({analytics.model_version})</span>
        </div>

        <AnimatedHeadline
          categoryTag="QUANTITATIVE EVALUATION"
          mainTitle="MODEL"
          subTitle="INTELLIGENCE CORE"
          description="Evaluated strictly on held-out temporal out-of-time test records (2023–2026). Anti-leakage temporal feature engineering ensures zero target leakage."
        />
      </div>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Out of Time Test Metrics */}
        <RevealOnScroll delay={0.1}>
          <div className="glass-panel p-6 rounded-3xl border border-signal-emerald/30 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-signal-emerald" />
                <span>Out-of-Time Test Set (2023-2026)</span>
              </h2>
              <span className="text-[10px] font-mono font-bold bg-signal-emerald/15 text-signal-emerald px-2.5 py-1 rounded-full border border-signal-emerald/30 uppercase">
                AUTHORITATIVE TEST
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">Test WAPE</p>
                <p className="text-3xl font-black text-signal-emerald">{(test.WAPE * 100).toFixed(2)}%</p>
                <p className="text-[10px] text-gray-500 mt-1">Weighted Abs % Error</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">Model $R^2$</p>
                <p className="text-3xl font-black text-white">{(test.R2).toFixed(4)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Variance Explained</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">Test MAE</p>
                <p className="text-xl font-bold text-white">€{(test.MAE_EUR / 1000000).toFixed(2)}M</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">Median AE</p>
                <p className="text-xl font-bold text-signal-cyan">€{(test.MedAE_EUR / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Validation Set Metrics */}
        <RevealOnScroll delay={0.15}>
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide flex items-center space-x-2">
                <Activity className="w-5 h-5 text-signal-cyan" />
                <span>5-Fold TimeSeriesSplit CV Validation</span>
              </h2>
              <span className="text-[10px] font-mono font-bold bg-signal-cyan/15 text-signal-cyan px-2.5 py-1 rounded-full border border-signal-cyan/30 uppercase">
                CROSS-VALIDATION
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">CV WAPE</p>
                <p className="text-3xl font-black text-signal-cyan">{(val.WAPE * 100).toFixed(2)}%</p>
                <p className="text-[10px] text-gray-500 mt-1">Cross-Val Error</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">CV $R^2$</p>
                <p className="text-3xl font-black text-white">{(val.R2).toFixed(4)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Fold Avg $R^2$</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">CV MAE</p>
                <p className="text-xl font-bold text-white">€{(val.MAE_EUR / 1000000).toFixed(2)}M</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-400">Log RMSE</p>
                <p className="text-xl font-bold text-white">{val.Log_RMSE.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>

      {/* Feature Importance Section */}
      <RevealOnScroll delay={0.2}>
        <div aria-label="Top permutation feature importances chart" className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-signal-cyan" />
              <span>Top Permutation Feature Importances (%)</span>
            </h2>
            <span className="text-xs font-mono text-gray-400 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-signal-cyan" />
              <span>Relative Log-Error Sensitivity Score</span>
            </span>
          </div>

          {topFeatures.length > 0 ? (
            <div className="space-y-6">
              {/* Recharts Bar Visualizer */}
              <div className="h-80 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                  <BarChart data={featureChartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10, fill: '#6b7280' }} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} width={180} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#080c12', borderColor: '#1f2937', color: '#fff', borderRadius: '12px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`${val}%`, 'Permutation Importance']}
                    />
                    <Bar dataKey="importance" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Responsive Feature Cards & Signal Bars */}
              <div className="space-y-2.5 font-mono">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Feature Rank Breakdown</p>
                {topFeatures.map((f, idx) => {
                  const displayName = FEATURE_LABEL_MAP[f.feature] || f.feature;
                  const importancePct = (f.importance_mean * 100).toFixed(2);
                  const barWidth = Math.max(2, (f.importance_mean / maxImportance) * 100);

                  return (
                    <div key={f.feature} className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-2 hover:border-signal-cyan/30 transition duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-signal-cyan/15 border border-signal-cyan/30 text-signal-cyan text-[10px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-white font-bold">{displayName}</span>
                          <span className="text-gray-500 text-[10px]">({f.feature})</span>
                        </div>
                        <div className="flex items-center space-x-2 text-right">
                          <span className="text-signal-cyan font-bold">{importancePct}%</span>
                          <span className="text-gray-500 text-[10px]">±{(f.importance_std * 100).toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* Custom Signal Bar */}
                      <div className="h-2 bg-gray-800/80 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-signal-cyan to-signal-emerald rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/5 text-center font-mono space-y-2">
              <p className="text-sm font-bold text-gray-300 uppercase">No Feature Importance Data Available</p>
              <p className="text-xs text-gray-500">Feature importance metrics are initializing from model explainability pipeline.</p>
            </div>
          )}
        </div>
      </RevealOnScroll>

      {/* Prediction Interval Quantile Methodology */}
      <RevealOnScroll delay={0.25}>
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 font-mono text-xs">
          <h2 className="text-sm font-bold text-white font-display uppercase tracking-wide">Empirical Residual Quantile Methodology (80% Interval)</h2>
          <p className="text-gray-400">
            The 80% prediction interval bounds are calculated using log-space residual quantiles computed on out-of-fold validation predictions:
          </p>
          <div className="p-4 bg-white/5 rounded-2xl flex flex-col sm:flex-row justify-between gap-2 text-signal-cyan font-bold">
            <span>10th Percentile Residual (p10): {analytics.uncertainty_quantile_residuals_log.p10}</span>
            <span>90th Percentile Residual (p90): +{analytics.uncertainty_quantile_residuals_log.p90}</span>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
};

