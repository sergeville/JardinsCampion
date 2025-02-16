import {
  ErrorSeverity,
  ErrorCategory,
  DatabaseError,
  NetworkError,
  ValidationError,
  ERROR_METADATA,
} from '@/lib/errors/types';

describe('Error Types', () => {
  describe('DatabaseError', () => {
    it('creates error with correct metadata', () => {
      const metadata = {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.DATABASE,
        userMessage: 'Test message',
        recoverable: true,
      };

      const error = new DatabaseError('Test error', metadata);

      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Test error');
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('NetworkError', () => {
    it('creates error with correct metadata', () => {
      const metadata = {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        userMessage: 'Test message',
        recoverable: true,
      };

      const error = new NetworkError('Test error', metadata);

      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Test error');
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('ValidationError', () => {
    it('creates error with correct metadata', () => {
      const metadata = {
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.VALIDATION,
        userMessage: 'Test message',
        recoverable: true,
      };

      const error = new ValidationError('Test error', metadata);

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('ERROR_METADATA', () => {
    it('has correct metadata for DATABASE_ERROR', () => {
      const metadata = ERROR_METADATA.DATABASE_ERROR;
      expect(metadata.severity).toBe(ErrorSeverity.CRITICAL);
      expect(metadata.category).toBe(ErrorCategory.DATABASE);
      expect(metadata.recoverable).toBe(true);
      expect(metadata.icon).toBe('🔴');
      expect(metadata.action).toBeDefined();
      expect(metadata.action?.label).toBe('Retry');
    });

    it('has correct metadata for NETWORK_ERROR', () => {
      const metadata = ERROR_METADATA.NETWORK_ERROR;
      expect(metadata.severity).toBe(ErrorSeverity.ERROR);
      expect(metadata.category).toBe(ErrorCategory.NETWORK);
      expect(metadata.recoverable).toBe(true);
      expect(metadata.icon).toBe('🌐');
      expect(metadata.action).toBeDefined();
      expect(metadata.action?.label).toBe('Retry');
    });

    it('has correct metadata for VALIDATION_ERROR', () => {
      const metadata = ERROR_METADATA.VALIDATION_ERROR;
      expect(metadata.severity).toBe(ErrorSeverity.WARNING);
      expect(metadata.category).toBe(ErrorCategory.VALIDATION);
      expect(metadata.recoverable).toBe(true);
      expect(metadata.icon).toBe('⚠️');
    });

    it('has correct metadata for AUTH_ERROR', () => {
      const metadata = ERROR_METADATA.AUTH_ERROR;
      expect(metadata.severity).toBe(ErrorSeverity.ERROR);
      expect(metadata.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(metadata.recoverable).toBe(true);
      expect(metadata.icon).toBe('🔒');
      expect(metadata.action).toBeDefined();
      expect(metadata.action?.label).toBe('Log In');
    });

    it('has correct metadata for DEFAULT_ERROR', () => {
      const metadata = ERROR_METADATA.DEFAULT_ERROR;
      expect(metadata.severity).toBe(ErrorSeverity.ERROR);
      expect(metadata.category).toBe(ErrorCategory.SYSTEM);
      expect(metadata.recoverable).toBe(false);
      expect(metadata.icon).toBe('❌');
    });
  });

  describe('Error Handlers', () => {
    const originalLocation = window.location;

    beforeAll(() => {
      delete window.location;
      window.location = {
        ...originalLocation,
        reload: jest.fn(),
        href: '',
      };
    });

    afterAll(() => {
      window.location = originalLocation;
    });

    it('DATABASE_ERROR action handler reloads page', () => {
      ERROR_METADATA.DATABASE_ERROR.action?.handler();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('NETWORK_ERROR action handler reloads page', () => {
      ERROR_METADATA.NETWORK_ERROR.action?.handler();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('AUTH_ERROR action handler redirects to login', () => {
      ERROR_METADATA.AUTH_ERROR.action?.handler();
      expect(window.location.href).toBe('/login');
    });
  });
});
