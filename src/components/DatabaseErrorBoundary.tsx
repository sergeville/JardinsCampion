import React from 'react';
import ErrorMessage from './ErrorMessage';
import styles from './DatabaseErrorBoundary.module.css';
import { DatabaseError } from '@/lib/errors/types';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class DatabaseErrorBoundary extends React.Component<Props, State> {
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call onError prop if provided
    this.props.onError?.(error);

    // Log the error
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
        <div className={styles.errorContainer} data-testid="error-container">
          <ErrorMessage
            error={error}
            showIcon={true}
            showAction={true}
            className={styles.errorMessage}
          />
        </div>
      );
    }

    return children;
  }
}

export default DatabaseErrorBoundary;
