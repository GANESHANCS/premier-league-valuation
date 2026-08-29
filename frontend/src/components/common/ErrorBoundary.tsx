import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-dark text-white flex items-center justify-center p-6 font-sans select-none">
          <div className="glass-panel p-8 rounded-3xl border border-signal-crimson/40 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-signal-crimson/10 border border-signal-crimson/30 flex items-center justify-center mx-auto text-signal-crimson">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-white">SYSTEM CONNECTION ERROR</h2>
              <p className="text-xs font-mono text-gray-400 mt-2">
                An unexpected operational state occurred. No fake data was generated.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] font-mono text-signal-crimson text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleRetry}
              className="w-full py-3 rounded-xl bg-signal-cyan/20 border border-signal-cyan/40 text-signal-cyan font-mono text-xs font-bold hover:bg-signal-cyan/30 transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RECONNECT SYSTEM</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
