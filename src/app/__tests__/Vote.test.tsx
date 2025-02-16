import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Vote from '../page';
import { useVoteManagement } from '@/hooks/useVoteManagement';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { ImageProps } from 'next/image';

// Mock the hooks
jest.mock('@/hooks/useVoteManagement');
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useTheme');
jest.mock('@/hooks/useLanguage');

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: ImageProps) {
    return <div data-testid="mock-image" {...props} />;
  },
}));

describe('Vote Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    (useVoteManagement as jest.Mock).mockImplementation(() => ({
      voteStats: {
        '1': { totalVotes: 5, uniqueVoters: 3 },
        '2': { totalVotes: 10, uniqueVoters: 8 },
      },
      voteHistory: [
        {
          userName: 'Test User',
          userId: 'test-user',
          logoId: '1',
          timestamp: new Date(),
        },
      ],
      loading: false,
      error: null,
      refreshData: jest.fn(),
      recordVote: jest.fn().mockResolvedValue({ status: 'confirmed' }),
      getUserPreviousVote: jest.fn().mockResolvedValue(null),
      cancelPendingRequests: jest.fn(),
    }));

    (useAuth as jest.Mock).mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: 'test-user', name: 'Test User' },
      isLoading: false,
    }));

    (useTheme as jest.Mock).mockImplementation(() => ({
      isDarkMode: false,
      toggleTheme: jest.fn(),
    }));

    (useLanguage as jest.Mock).mockImplementation(() => ({
      language: 'en',
      toggleLanguage: jest.fn(),
      t: {
        title: 'Vote for Logo',
        selectThis: 'Select this logo',
        votes: 'votes',
        mobileMessage: 'Welcome! Tap on a logo to vote.',
        voteRecorded: (name: string, logo: string) => `Vote recorded for ${name} on Logo #${logo}`,
        alreadyVoted: 'You have already voted for this logo',
        cannotVoteOwn: 'You cannot vote for your own logo',
        error: 'Error',
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',
        loginRequired: 'Please log in to vote',
        nameRequired: 'Please enter your name',
        voteFailed: 'Vote failed',
        enterName: 'Enter your name',
        nameLabel: 'Name',
        namePlaceholder: 'Your name',
        submit: 'Submit',
        cancel: 'Cancel',
        recentVotes: 'Recent Votes',
        votedFor: 'voted for',
      },
    }));
  });

  it('renders the page with all components', () => {
    render(<Vote />);

    expect(screen.getByText('Vote for Logo')).toBeInTheDocument();
    expect(screen.getByText('Welcome! Tap on a logo to vote.')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4); // 4 logos
  });

  it('handles logo selection and vote submission', async () => {
    const mockRecordVote = jest.fn().mockResolvedValue({ status: 'confirmed' });
    (useVoteManagement as jest.Mock).mockImplementation(() => ({
      ...useVoteManagement(),
      recordVote: mockRecordVote,
    }));

    render(<Vote />);

    // Select a logo
    const firstLogoRadio = screen.getAllByRole('radio')[0];
    fireEvent.click(firstLogoRadio);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Enter your name')).toBeInTheDocument();
    });

    // Enter name and submit
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.click(submitButton);

    // Verify vote was recorded
    await waitFor(() => {
      expect(mockRecordVote).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'Test User',
          logoId: '1',
        })
      );
    });

    // Verify vote history update
    await waitFor(() => {
      expect(screen.getByTestId('vote-list')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('vote-list')).toHaveTextContent('Test User');
    });

    await waitFor(() => {
      expect(screen.getByTestId('vote-list')).toHaveTextContent(/Logo #1/);
    });
  });

  it('shows error message for duplicate votes', async () => {
    const mockGetUserPreviousVote = jest.fn().mockResolvedValue({
      logoId: '1',
      userId: 'test-user',
    });
    (useVoteManagement as jest.Mock).mockImplementation(() => ({
      ...useVoteManagement(),
      getUserPreviousVote: mockGetUserPreviousVote,
    }));

    render(<Vote />);

    // Select logo and try to vote
    const firstLogoRadio = screen.getAllByRole('radio')[0];
    fireEvent.click(firstLogoRadio);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Enter your name')).toBeInTheDocument();
    });

    // Enter name and submit
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.click(submitButton);

    // Verify error message
    expect(screen.getByText('You have already voted for this logo')).toBeInTheDocument();
  });

  it('handles theme toggle', () => {
    const mockToggleTheme = jest.fn();
    (useTheme as jest.Mock).mockImplementation(() => ({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
    }));

    render(<Vote />);

    const themeButton = screen.getByRole('button', { name: /Dark Mode/i });
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('handles language toggle', () => {
    const mockToggleLanguage = jest.fn();
    (useLanguage as jest.Mock).mockImplementation(() => ({
      ...useLanguage(),
      toggleLanguage: mockToggleLanguage,
    }));

    render(<Vote />);

    const languageButton = screen.getByRole('button', { name: /Switch to French/i });
    fireEvent.click(languageButton);

    expect(mockToggleLanguage).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    (useVoteManagement as jest.Mock).mockImplementation(() => ({
      ...useVoteManagement(),
      loading: true,
    }));

    render(<Vote />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useVoteManagement as jest.Mock).mockImplementation(() => ({
      ...useVoteManagement(),
      error: 'Test error message',
    }));

    render(<Vote />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('handles modal cancellation', async () => {
    render(<Vote />);

    // Open modal
    const firstLogoRadio = screen.getAllByRole('radio')[0];
    fireEvent.click(firstLogoRadio);

    await waitFor(() => {
      expect(screen.getByText('Enter your name')).toBeInTheDocument();
    });

    // Cancel modal
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Enter your name')).not.toBeInTheDocument();
    });
  });

  it('validates user input', async () => {
    render(<Vote />);

    // Open modal
    const firstLogoRadio = screen.getAllByRole('radio')[0];
    fireEvent.click(firstLogoRadio);

    await waitFor(() => {
      expect(screen.getByText('Enter your name')).toBeInTheDocument();
    });

    // Try to submit without name
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    });
  });
});
