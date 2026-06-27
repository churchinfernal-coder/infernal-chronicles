// 
// ERROR BOUNDARY - Landing Pages
// Graceful error handling for production
// 

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Flame, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class LandingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Landing page error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service (e.g., Sentry) if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <Flame className="w-24 h-24 text-red-600 animate-pulse" />
                <AlertTriangle className="w-12 h-12 text-yellow-500 absolute top-0 right-0" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-gothic font-bold text-white">
                The Darkness Has Encountered an Error
              </h1>
              <p className="text-xl text-gray-400">
                An unexpected error has occurred in the infernal realm.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-left">
                <p className="text-red-400 font-mono text-sm">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="text-red-300 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-gray-400 mt-2 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-red-600 text-red-500 hover:bg-red-900/20"
              >
                Return Home
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              If this error persists, contact support at{' '}
              <a
                href="https://infernalsocial.com"
                className="text-red-500 hover:text-red-400"
              >
                infernalsocial.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
