"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="mag-card max-w-md w-full p-8 border-3 border-[#E3350D] shadow-[6px_6px_0px_#E3350D] bg-white">
            <div className="text-center space-y-4">
              <div className="text-5xl"><AlertTriangle className="w-12 h-12 text-[#E3350D] mx-auto" /></div>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a]">
                Something broke
              </h2>
              <p className="text-sm text-[#1a1a1a]/60 font-bold">
                An unexpected error occurred while rendering this page.
              </p>
              {this.state.error && (
                <details className="text-left text-xs bg-red-50 border border-red-200 rounded p-2 text-[#E3350D]">
                  <summary className="font-bold cursor-pointer">
                    {this.state.error.message}
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap text-[10px] opacity-70">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="mag-button mag-button-primary w-full text-sm font-black uppercase tracking-wider"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="mag-button w-full text-sm font-black uppercase tracking-wider border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
