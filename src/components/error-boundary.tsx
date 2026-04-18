"use client";

import { ReactNode } from "react";
import React from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Қиындықтар туындады</h1>
            <p className="text-slate-600 mb-4">Сәтсіздік болды. Бетті қайта жүктеп көруіңіз немесе қолдауға хабарласыңыз.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition"
            >
              Қайта жүктеу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
