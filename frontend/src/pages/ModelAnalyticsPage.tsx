import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Cpu, ShieldCheck, Activity, BarChart2, CheckCircle } from 'lucide-react';
import { fetchModelAnalytics } from '../api/client';
import { ModelAnalytics } from '../types/api';

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
      <div className="space-y-6">
        <div className="h-48 bg-white/5 rounded-3xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const test = analytics.out_of_time_test_metrics;
  const val = analytics.validation_metrics;

  const featureChartData = analytics.feature_importances.slice(0, 10).map((f) => ({
    name: f.feature,
    importance: +(f.importance_mean * 100).toFixed(2),
  }));

  return (
    <div className="space-y-8">
      {/* Hero Title */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan text-xs font-mono">
          <Cpu className="w-3.5 h-3.5" />
          <span>MODEL ARCHITECTURE: {analytics.model_name} ({analytics.model_version})</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">MACHINE LEARNING MODEL EVALUATION</h1>
        <p className="text-gray-300 text-sm font-sans max-w-3xl">
          Evaluated strictly on held-out temporal out-of-time test records (2023–2026). Anti-leakage temporal engineering ensures no future data is used in feature calculation.
        </p>
      </div>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Out of Time Test Metrics */}
        <div className="glass-panel p-6 rounded-2xl border border-signal-emerald/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-sans flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-signal-emerald" />
              <span>Out-of-Time Held-Out Test Set (2023-2026)</span>
            </h2>
            <span className="text-[10px] font-mono bg-signal-emerald/10 text-signal-emerald px-2 py-0.5 rounded border border-signal-emerald/20">PRIMARY REPORT SCORE</span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">WAPE Error</p>
              <p className="text-2xl font-bold text-signal-emerald">{(test.WAPE * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">$R^2$ Variance</p>
              <p className="text-2xl font-bold text-white">{(test.R2).toFixed(4)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">MAE (€)</p>
              <p className="text-xl font-bold text-white">€{(test.MAE_EUR / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">Median AE (€)</p>
              <p className="text-xl font-bold text-signal-cyan">€{(test.MedAE_EUR / 1000000).toFixed(2)}M</p>
            </div>
          </div>
        </div>

        {/* Validation Set Metrics */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white font-sans flex items-center space-x-2">
            <Activity className="w-5 h-5 text-signal-cyan" />
            <span>5-Fold TimeSeriesSplit CV Validation</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">WAPE Error</p>
              <p className="text-2xl font-bold text-signal-cyan">{(val.WAPE * 100).toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">$R^2$ Variance</p>
              <p className="text-2xl font-bold text-white">{(val.R2).toFixed(4)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">MAE (€)</p>
              <p className="text-xl font-bold text-white">€{(val.MAE_EUR / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400">Log RMSE</p>
              <p className="text-xl font-bold text-white">{val.Log_RMSE.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white font-sans flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-signal-cyan" />
          <span>Top Permutation Feature Importances (%)</span>
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureChartData} layout="vertical">
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10, fill: '#6b7280' }} unit="%" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 10, fill: '#9ca3af' }} width={140} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f2937', color: '#fff' }} />
              <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prediction Interval Quantile Methodology */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 font-mono text-xs">
        <h2 className="text-sm font-bold text-white font-sans">Empirical Residual Quantile Methodology (80% Interval)</h2>
        <p className="text-gray-400">
          The 80% prediction interval lower and upper bounds are calculated using log-space residual quantiles computed on out-of-fold validation predictions:
        </p>
        <div className="p-3 bg-white/5 rounded-xl flex justify-between text-signal-cyan">
          <span>10th Percentile Residual (p10): {analytics.uncertainty_quantile_residuals_log.p10}</span>
          <span>90th Percentile Residual (p90): +{analytics.uncertainty_quantile_residuals_log.p90}</span>
        </div>
      </div>
    </div>
  );
};
