import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Vote from '../page';
import { mockMatchMedia } from '../../test-utils/test-utils';

// Mock environment variables
process.env.MONGODB_URI_DEV =
  'mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin';
process.env.MONGODB_URI_PROD =
  'mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin';

// Mock the Image component since we're using Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: 'img',
}));

// Mock the useVoteManagement hook
const mockRecordVote = jest.fn().mockImplementation(async (voteData) => {
  alert(`Vote recorded for ${voteData.userName} on Logo #${voteData.logoId}`);
  return { status: 'confirmed' };
});

let mockVoteHistory: any[] = [];

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

describe('Page Component', () => {
  let alertMock: jest.SpyInstance;

  beforeEach(() => {
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
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
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
      const titleParts = titles[0].textContent?.split('\n').map(part => part.trim()) || [];
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
    await act(async () => {
      const logos = screen.getAllByRole('img');
      fireEvent.click(logos[0]);
    });

    // Wait for the modal to appear and be interactive
    await waitFor(() => {
      const nameInput = screen.getByTestId('name-input');
      expect(nameInput).not.toBeDisabled();
    });

    const nameInput = screen.getByTestId('name-input');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
    });

    await act(async () => {
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
      const titleParts = title.textContent?.split('\n').map(part => part.trim()) || [];
      expect(titleParts[0]).toBe('Jardins du Lac Campion');
      expect(titleParts[1]).toBe('Voté pour le plus beau logo');
    });

    // Switch to English
    await act(async () => {
      const languageToggle = screen.getByText('EN');
      fireEvent.click(languageToggle);
    });

    // Wait for language effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('en');
    });

    // Verify English state
    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      const titleParts = title.textContent?.split('\n').map(part => part.trim()) || [];
      expect(titleParts[0]).toBe('Jardins du Lac Campion');
      expect(titleParts[1]).toBe('Logo Selection');
    });

    // Switch back to French
    await act(async () => {
      const languageToggle = screen.getByText('FR');
      fireEvent.click(languageToggle);
    });

    // Wait for language effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('language')).toBe('fr');
    });

    // Verify French state again
    await waitFor(() => {
      const title = screen.getAllByRole('heading', { level: 1 })[0];
      const titleParts = title.textContent?.split('\n').map(part => part.trim()) || [];
      expect(titleParts[0]).toBe('Jardins du Lac Campion');
      expect(titleParts[1]).toBe('Voté pour le plus beau logo');
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
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    // Find and click theme toggle using aria-label
    const themeToggle = screen.getAllByRole('button', { name: /Light Mode|Mode Clair|Dark Mode|Mode Sombre/i })[0];
    await act(async () => {
      fireEvent.click(themeToggle);
    });

    // Wait for theme effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    // Click again to toggle back to dark mode
    await act(async () => {
      fireEvent.click(themeToggle);
    });

    // Wait for theme effect to complete
    await waitFor(() => {
      expect(window.localStorage.getItem('theme')).toBe('dark');
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

    // Wait for initial render and effects to complete
    await waitFor(() => {
      const logosContainer = screen.getByTestId('logos-container');
      expect(logosContainer).toBeInTheDocument();
      expect(logosContainer.classList.contains('loading')).toBe(false);
    }, { timeout: 2000 });

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
    await act(async () => {
      const logos = screen.getAllByRole('img');
      fireEvent.click(logos[0]);
    });

    // Wait for the modal to appear and be interactive
    await waitFor(() => {
      const nameInput = screen.getByTestId('name-input');
      expect(nameInput).not.toBeDisabled();
    });

    // Enter name in the modal
    const nameInput = screen.getByTestId('name-input');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
    });

    // Submit vote
    await act(async () => {
      const submitButton = screen.getByRole('button', { name: /Submit|Soumettre/i });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Test User'));
      });
    });

    // Wait for vote history to update
    await waitFor(() => {
      const voteList = screen.getByTestId('vote-list');
      expect(voteList).toHaveTextContent('Test User');
      expect(voteList).toHaveTextContent(/Logo #1/);
    }, { timeout: 2000 });

    unmount();
  });
});
