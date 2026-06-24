'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  blockName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.blockName ? `: ${this.props.blockName}` : ''}]`, error, errorInfo);
    // TODO: отправить ошибку в телеметрию
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="card border-error/30 bg-error/5 text-center py-8">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-sm text-text-secondary mb-2">
            {this.props.blockName
              ? `Не удалось загрузить блок «${this.props.blockName}»`
              : 'Не удалось загрузить блок'}
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-outline text-sm py-1.5 px-4"
          >
            Повторить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}