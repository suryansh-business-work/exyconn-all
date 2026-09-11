import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Logger } from './types';

interface Props {
  logger: Logger;
  /** What to show instead of the crashed tree; `reset` renders the children again. */
  fallback: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render error, sends it with its React component stack, and shows `fallback`
 * instead of a blank page. Each app supplies its own fallback in its own design system.
 */
export class LogErrorBoundary extends Component<Readonly<Props>, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.logger.capture(error, { componentStack: info.componentStack ?? null });
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return this.props.fallback(error, this.reset);
    }
    return this.props.children;
  }
}
