import React from 'react';
import { ErrorMessage } from './ErrorMessage';
import styles from './DatabaseErrorBoundary.module.css';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DatabaseErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Database Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className={styles.errorContainer}>
          <ErrorMessage error={error} showIcon={true} showAction={true} />
        </div>
      );
    }

    return children;
  }
}
