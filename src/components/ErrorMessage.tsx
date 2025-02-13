import React from 'react';
import { ErrorMetadata, ERROR_METADATA, ErrorSeverity } from '@/lib/errors/types';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  error: Error | string;
  className?: string;
  showIcon?: boolean;
  showAction?: boolean;
  inline?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  className = '',
  showIcon = true,
  showAction = true,
  inline = false,
}) => {
  // Get error metadata
  const getErrorMetadata = (error: Error | string): ErrorMetadata => {
    // First check if error has metadata attached
    if (error instanceof Error && 'metadata' in error) {
      return error.metadata as ErrorMetadata;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const errorName = error instanceof Error ? error.name : '';

    // Try to find exact error type match
    for (const [errorType, metadata] of Object.entries(ERROR_METADATA)) {
      if (errorName.includes(errorType) || errorMessage.includes(errorType)) {
        return metadata;
      }
    }

    return ERROR_METADATA.DEFAULT_ERROR;
  };

  const metadata = getErrorMetadata(error);

  // Get severity-based styles
  const getSeverityClass = (): string => {
    switch (metadata.severity) {
      case ErrorSeverity.FATAL:
        return styles.fatal;
      case ErrorSeverity.CRITICAL:
        return styles.critical;
      case ErrorSeverity.ERROR:
        return styles.error;
      case ErrorSeverity.WARNING:
        return styles.warning;
      case ErrorSeverity.INFO:
        return styles.info;
      default:
        return styles.default;
    }
  };

  const containerClass = `${styles.container} ${getSeverityClass()} ${inline ? styles.inline : ''} ${className}`;

  const handleAction = () => {
    if (metadata.action?.handler) {
      metadata.action.handler();
    }
  };

  return (
    <div className={containerClass}>
      {showIcon && metadata.icon && <div className={styles.icon}>{metadata.icon}</div>}

      <div className={styles.content}>
        <p className={styles.message}>{metadata.userMessage}</p>

        {showAction && metadata.recoverable && metadata.action && (
          <button onClick={handleAction} className={styles.action}>
            {metadata.action.label}
          </button>
        )}
      </div>
    </div>
  );
};
