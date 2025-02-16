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

// Mock environment variables
process.env.MONGODB_URI_DEV =
  'mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin';
process.env.MONGODB_URI_PROD =
  'mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin';

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

let mockVoteHistory: MockVoteHistory[] = [];

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

// Mock the hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useLanguage');
jest.mock('@/hooks/useVoteManagement');

describe('VotePage', () => {
  const mockAuthHook = {
    isAuthenticated: true,
    loading: false,
  };

  const mockLanguageHook = {
    t: {
      selectThis: 'Select this logo',
      votes: 'votes',
      loginRequired: 'Please log in to vote',
      alreadyVoted: 'You have already voted for this logo',
    },
  };

  const mockVoteManagementHook = {
    selectedLogo: null,
    voteCount: {},
    loading: false,
    error: null,
    handleLogoSelection: jest.fn(),
    handleVoteSubmit: jest.fn(),
    getUserPreviousVote: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuthHook);
    (useLanguage as jest.Mock).mockReturnValue(mockLanguageHook);
    (useVoteManagement as jest.Mock).mockReturnValue(mockVoteManagementHook);

    // Mock localStorage with a working implementation
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

    // Mock navigator.language
    Object.defineProperty(window.navigator, 'language', {
      value: 'fr-FR', // Set default language to French
      configurable: true,
    });

    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)', // Match dark mode by default
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Reset document body and cleanup any previous renders
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');

    // Mock alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    // Reset vote history
    mockVoteHistory = [];
  });

  afterEach(() => {
    // Restore alert mock
    alertMock.mockRestore();
    // Clear localStorage
    window.localStorage.clear();
    // Reset document theme
    document.documentElement.removeAttribute('data-theme');
    // Clean up rendered components
    document.body.innerHTML = '';
    // Clean up any mounted components
    jest.clearAllMocks();
  });

  const switchToEnglish = async () => {
    // Set initial language to English
    window.localStorage.setItem('language', 'en');
    const { unmount } = render(<Vote />);

    // Wait for language effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('en');
    });

    // Wait for title to update
    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 1 });
      const titleParts = titles[0].textContent?.split('\n').map((part) => part.trim()) || [];
      expect(titleParts[1]).toBe('Logo Selection');
    });

    return unmount;
  };

  it('renders the title in English when switched', async () => {
    const unmount = await switchToEnglish();
    expect(screen.getByText(/Jardins du Lac Campion/)).toBeInTheDocument();
    expect(screen.getByText(/Logo Selection/)).toBeInTheDocument();
    unmount();
  });

  it('shows the mobile welcome message in English', async () => {
    const unmount = await switchToEnglish();
    expect(screen.getByText(/Welcome! Tap on a logo to vote./i)).toBeInTheDocument();
    unmount();
  });

  it('prevents voting for the same logo twice', async () => {
    const unmount = await switchToEnglish();

    // Wait for loading to finish
    await waitFor(() => {
      const logosContainer = screen.getByTestId('logos-container');
      expect(logosContainer.classList.contains('loading')).toBe(false);
    });

    // First vote
    await waitFor(() => {
      const logos = screen.getAllByRole('img');
      fireEvent.click(logos[0]);
    });

    // Wait for the modal to appear and be interactive
    await waitFor(() => {
      const nameInput = screen.getByTestId('name-input');
      expect(nameInput).not.toBeDisabled();
    });

    const nameInput = screen.getByTestId('name-input');
    await waitFor(() => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Submit|Soumettre/i });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Test User'));
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Logo #1'));
      });
    });

    unmount();
  });

  it('allows changing language between English and French', async () => {
    // Start with French (default)
    window.localStorage.removeItem('language'); // Ensure no language is set
    const { unmount } = render(<Vote />);

    // Wait for initial render and effects to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('fr');
    });

    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      const titleParts = title.textContent?.split('\n').map((part) => part.trim()) || [];
      expect(titleParts[0]).toBe('Jardins du Lac Campion');
      expect(titleParts[1]).toBe('Voté pour le plus beau logo');
    });

    // Switch to English
    const languageToggle = screen.getByText('EN');
    fireEvent.click(languageToggle);

    // Wait for language effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('en');
    });

    // Wait for title to update
    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      expect(title).toHaveTextContent('Jardins du Lac Campion');
    });

    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      expect(title).toHaveTextContent('Logo Selection');
    });

    // Switch back to French
    fireEvent.click(languageToggle);

    // Wait for language effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('fr');
    });

    // Wait for title to update
    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      expect(title).toHaveTextContent('Jardins du Lac Campion');
    });

    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      expect(title).toHaveTextContent('Voté pour le plus beau logo');
    });

    unmount();
  });

  it('maintains dark/light mode preference', async () => {
    // Start with dark theme
    window.localStorage.setItem('theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    const { unmount } = render(<Vote />);

    // Wait for initial render and effects to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('theme')).toBe('dark');
    });

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    // Find and click theme toggle
    const themeToggle = screen.getAllByRole('button', {
      name: /Light Mode|Mode Clair|Dark Mode|Mode Sombre/i,
    })[0];
    fireEvent.click(themeToggle);

    // Wait for theme effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('theme')).toBe('light');
    });

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    // Click again to toggle back to dark mode
    fireEvent.click(themeToggle);

    // Wait for theme effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('theme')).toBe('dark');
    });

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    unmount();
  });

  it('allows users to enter their name and vote', async () => {
    // Set initial language to English
    window.localStorage.setItem('language', 'en');
    const { unmount } = render(<Vote />);

    // Wait for language effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('en');
    });

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('logos-container')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('logos-container').classList.contains('loading')).toBe(false);
    });

    // Update mock vote history before submitting vote
    mockVoteHistory = [
      {
        userName: 'Test User',
        userId: 'test-user',
        logoId: '1',
        timestamp: new Date(),
      },
    ];

    // Click on a logo to vote
    const logos = screen.getAllByRole('img');
    fireEvent.click(logos[0]);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).not.toBeDisabled();
    });

    // Enter name in the modal
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    // Submit vote
    const submitButton = screen.getByRole('button', { name: /Submit|Soumettre/i });
    fireEvent.click(submitButton);

    // Wait for alert
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Test User'));
    });

    // Wait for vote history to update
    await waitFor(() => {
      expect(screen.getByTestId('vote-list')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('vote-list')).toHaveTextContent('Test User');
    });

    await waitFor(() => {
      expect(screen.getByTestId('vote-list')).toHaveTextContent(/Logo #1/);
    });

    // Wait for vote history to update
    await waitFor(
      () => {
        const voteList = screen.getByTestId('vote-list');
        expect(voteList).toHaveTextContent('Test User');
        expect(voteList).toHaveTextContent(/Logo #1/);
      },
      { timeout: 2000 }
    );

    unmount();
  });

  it('shows error message when present', () => {
    const error = 'Test error message';
    (useVoteManagement as jest.Mock).mockReturnValue({
      ...mockVoteManagementHook,
      error,
    });

    render(<Vote />);
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('calls getUserPreviousVote when selecting logo while not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthHook,
      isAuthenticated: false,
    });

    (useVoteManagement as jest.Mock).mockReturnValue({
      ...mockVoteManagementHook,
      selectedLogo: { id: '1', name: 'Test Logo', imageUrl: '/test.png' },
    });

    render(<Vote />);
    expect(mockVoteManagementHook.getUserPreviousVote).toHaveBeenCalled();
  });
});
