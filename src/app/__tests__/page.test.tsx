import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Vote from '../page';
import { mockMatchMedia } from '../../test-utils/test-utils';
import Image from 'next/image';
import { AuthProvider } from '@/contexts/AuthContext';
import { VoteProvider } from '@/contexts/VoteContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { Logo } from '@/types/database';
import { User } from '@/types/auth';
import { VoteData } from '@/types/vote';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoteManagement } from '@/hooks/useVoteManagement';
import { useTheme } from '@/hooks/useTheme';
import type { ImageProps } from 'next/image';
import { NetworkError } from '@/lib/errors/types';

// Mock environment variables
process.env.MONGODB_URI_DEV =
  'mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin';
process.env.MONGODB_URI_PROD =
  'mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin';

// Mock all hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useLanguage');
jest.mock('@/hooks/useVoteManagement');
jest.mock('@/hooks/useTheme');

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: ImageProps) {
    return <div data-testid="mock-image" alt={props.alt} {...props} />;
  },
}));

interface MockVoteHistory {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
}

const mockVoteHistory: MockVoteHistory[] = [];

// Mock the useVoteManagement hook
const mockRecordVote = jest.fn().mockImplementation(async (voteData: VoteData) => {
  alert(`Vote recorded for ${voteData.userName} on Logo #${voteData.logoId}`);
  return { status: 'confirmed' };
});

jest.mock('@/hooks/useVoteManagement', () => ({
  useVoteManagement: () => ({
    voteCount: {},
    voteHistory: mockVoteHistory,
    recordVote: mockRecordVote,
    getUserPreviousVote: jest.fn(),
    loading: false,
    error: null,
  }),
}));

interface MockContextProps {
  children: React.ReactNode;
  mockUser?: User | null;
  mockIsAuthenticated?: boolean;
  mockLoading?: boolean;
}

const MockAuthProvider: React.FC<MockContextProps> = ({
  children,
  mockUser = null,
  mockIsAuthenticated = false,
  mockLoading = false,
}) => <AuthProvider>{children}</AuthProvider>;

// Replace img with next/image
const LogoImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <Image src={src} alt={alt} width={200} height={200} priority />
);

// Mock the hooks with proper imports
import * as useAuthModule from '@/hooks/useAuth';
import * as useLanguageModule from '@/hooks/useLanguage';
import * as useVoteManagementModule from '@/hooks/useVoteManagement';
import * as useThemeModule from '@/hooks/useTheme';

// Consolidated mockLanguageHook
const mockLanguageHook = {
  t: {
    selectThis: 'Select this logo',
    votes: 'votes',
    loginRequired: 'Please log in to vote',
    alreadyVoted: 'You have already voted for this logo',
    welcome: 'Welcome! Tap on a logo to vote.',
    title: 'Jardins du Lac Campion',
    subtitle: 'Logo Selection',
    mobileMessage: 'Welcome! Tap on a logo to vote.',
    failedToLoadUsers: 'Failed to load users',
    selectUserRequired: 'Please select a user',
    voteFailed: 'Failed to submit vote',
    alreadyVoted: (userId: string, logoId: string) =>
      `User ${userId} has already voted for logo ${logoId}!`,
    loading: 'Loading...',
    errorMessage: 'An error occurred',
    submit: 'Submit',
    cancel: 'Cancel',
  },
  language: 'en',
  setLanguage: jest.fn(),
  toggleLanguage: jest.fn(),
};

// Consolidated useVoteManagement mock
const mockVoteManagementHook = {
  selectedLogo: null,
  voteCount: {},
  voteHistory: [],
  loading: false,
  error: null,
  handleLogoSelection: jest.fn(),
  handleVoteSubmit: jest.fn(),
  getUserPreviousVote: jest.fn(),
  recordVote: jest.fn().mockImplementation(async (voteData: VoteData) => {
    alert(`Vote recorded for ${voteData.userName} on Logo #${voteData.logoId}`);
    return { status: 'confirmed' };
  }),
  refreshData: jest.fn(),
  voteStats: [],
  statsLoading: false,
  statsError: null,
  isLoading: false,
  hasVoted: false,
  currentVote: null,
};

jest.mock('@/hooks/useVoteManagement', () => ({
  __esModule: true,
  useVoteManagement: jest.fn(() => mockVoteManagementHook),
}));

jest.mock('@/hooks/useLanguage', () => ({
  __esModule: true,
  useLanguage: jest.fn(() => mockLanguageHook),
}));

jest.mock('@/hooks/useTheme', () => ({
  __esModule: true,
  useTheme: jest.fn(() => ({
    theme: 'light',
    isDarkMode: false,
    toggleTheme: jest.fn(),
  })),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <VoteProvider>
      <DatabaseProvider>{children}</DatabaseProvider>
    </VoteProvider>
  </AuthProvider>
);

describe('VotePage', () => {
  let alertMock: jest.SpyInstance;

  const mockAuthHook = {
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  };

  const customRender = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize alert mock
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Setup hook mocks
    (useAuth as jest.Mock).mockImplementation(() => mockAuthHook);
    (useLanguage as jest.Mock).mockImplementation(() => mockLanguageHook);
    (useVoteManagement as jest.Mock).mockImplementation(() => mockVoteManagementHook);
    (useTheme as jest.Mock).mockImplementation(() => ({
      theme: 'light',
      isDarkMode: false,
      toggleTheme: jest.fn(),
    }));

    // Mock localStorage
    const localStorageData: { [key: string]: string } = {};
    const localStorageMock = {
      getItem: jest.fn((key: string) => localStorageData[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageData[key] = value;
      }),
      clear: jest.fn(() => {
        Object.keys(localStorageData).forEach((key) => delete localStorageData[key]);
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageData[key];
      }),
      length: 0,
      key: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset document body and cleanup
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    // Restore all mocks
    alertMock.mockRestore();
    jest.clearAllMocks();

    // Clear localStorage
    window.localStorage.clear();

    // Reset document theme
    document.documentElement.removeAttribute('data-theme');

    // Clean up rendered components
    document.body.innerHTML = '';
  });

  it('renders the title in English when switched', async () => {
    const { unmount } = customRender(<Vote />);
    expect(screen.getByText(mockLanguageHook.t.title)).toBeInTheDocument();
    expect(screen.getByText(mockLanguageHook.t.mobileMessage)).toBeInTheDocument();
    unmount();
  });

  it('shows error message when present', async () => {
    const testError = 'Test error message';
    (useVoteManagement as jest.Mock).mockImplementationOnce(() => ({
      ...mockVoteManagementHook,
      error: testError,
    }));

    const { unmount } = customRender(<Vote />);
    expect(screen.getByText(testError)).toBeInTheDocument();
    unmount();
  });

  it('handles network error during vote submission', async () => {
    const networkError = new NetworkError('Network error during vote');
    mockVoteManagementHook.recordVote.mockRejectedValueOnce(networkError);

    const { unmount } = customRender(<Vote />);

    // Click on a logo
    const logo = screen.getByTestId('logo-1');
    fireEvent.click(logo);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('vote-modal')).toBeInTheDocument();
    });

    // Enter user name
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    // Submit vote
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Network error during vote')).toBeInTheDocument();
    });

    unmount();
  });

  it('handles failed user fetch', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const { unmount } = customRender(<Vote />);

    await waitFor(() => {
      expect(screen.getByText(mockLanguageHook.t.failedToLoadUsers)).toBeInTheDocument();
    });

    unmount();
  });

  it('prevents voting for the same logo twice', async () => {
    mockVoteManagementHook.recordVote.mockImplementationOnce(async (voteData: VoteData) => ({
      status: 'rejected',
      conflictResolution: {
        originalVote: {
          userId: voteData.userId,
          logoId: voteData.logoId,
          userName: voteData.userName,
          timestamp: new Date(),
        },
        newVote: voteData,
        resolution: 'keep-original',
      },
    }));

    const { unmount } = customRender(<Vote />);

    // Click on a logo
    const logo = screen.getByTestId('logo-1');
    fireEvent.click(logo);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('vote-modal')).toBeInTheDocument();
    });

    // Enter user name
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    // Submit vote
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Verify duplicate vote message
    await waitFor(() => {
      expect(
        screen.getByText(mockLanguageHook.t.alreadyVoted('Test User', '1'))
      ).toBeInTheDocument();
    });

    unmount();
  });

  it('shows loading state when fetching data', async () => {
    (useVoteManagement as jest.Mock).mockImplementationOnce(() => ({
      ...mockVoteManagementHook,
      loading: true,
    }));

    const { unmount } = customRender(<Vote />);
    expect(screen.getByText(mockLanguageHook.t.loading)).toBeInTheDocument();
    unmount();
  });

  it('handles successful vote submission', async () => {
    const { unmount } = customRender(<Vote />);

    // Click on a logo
    const logo = screen.getByTestId('logo-1');
    fireEvent.click(logo);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('vote-modal')).toBeInTheDocument();
    });

    // Enter user name
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    // Submit vote
    const submitButton = screen.getByText(mockLanguageHook.t.submit);
    fireEvent.click(submitButton);

    // Verify vote was recorded and modal was closed
    await waitFor(() => {
      expect(mockVoteManagementHook.recordVote).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'Test User',
          logoId: '1',
        })
      );
      expect(screen.queryByTestId('vote-modal')).not.toBeInTheDocument();
    });

    unmount();
  });

  it('handles modal close', async () => {
    const { unmount } = customRender(<Vote />);

    // Click on a logo
    const logo = screen.getByTestId('logo-1');
    fireEvent.click(logo);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('vote-modal')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText(mockLanguageHook.t.cancel);
    fireEvent.click(cancelButton);

    // Verify modal was closed
    await waitFor(() => {
      expect(screen.queryByTestId('vote-modal')).not.toBeInTheDocument();
    });

    unmount();
  });
});

// Mock fetch API
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        { userId: '1', name: 'Test User' },
        { userId: '2', name: 'Jane Smith' },
      ]),
  })
);

global.fetch = mockFetch;

// Mock components
jest.mock('@/components/LogoGrid', () => ({
  LogoGrid: ({ logos, onSelectLogo, loading, t }: any) => (
    <div data-testid="logos-container" className={loading ? 'loading' : ''}>
      {loading ? (
        <div>{t.loading}</div>
      ) : (
        logos.map((logo: any) => (
          <div
            key={logo.id}
            role="img"
            onClick={() => onSelectLogo(logo)}
            data-testid={`logo-${logo.id}`}
          />
        ))
      )}
    </div>
  ),
}));

jest.mock('@/components/VoteModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSubmit, error, t }: any) =>
    isOpen ? (
      <div data-testid="vote-modal">
        <input data-testid="name-input" type="text" />
        {error && <div role="alert">{error}</div>}
        <button onClick={onSubmit}>{t.submit}</button>
        <button onClick={onClose}>{t.cancel}</button>
      </div>
    ) : null,
}));

// Add ErrorMessage mock
jest.mock('@/components/ErrorMessage', () => ({
  __esModule: true,
  default: ({ error, isUserMessage }: any) => (
    <div role="alert" className={isUserMessage ? 'user-message' : 'error'}>
      {error}
    </div>
  ),
}));
