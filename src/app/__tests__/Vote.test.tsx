import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Vote from '@/app/page';
import { useVoteManagement } from '@/hooks/useVoteManagement';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { ImageProps } from 'next/image';

// Mock the hooks
jest.mock('@/hooks/useVoteManagement', () => ({
  useVoteManagement: jest.fn(),
}));

jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../hooks/useLanguage', () => ({
  useLanguage: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: ImageProps) {
    const { priority, ...rest } = props;
    return <div data-testid={`mock-image-${props.alt?.match(/\d+/)?.[0] || ''}`} {...rest} />;
  },
}));

describe('Vote Page', () => {
  const mockUsers = [{ id: 'user1', name: 'Test User' }];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ userId: 'user1', name: 'Test User' }]),
      })
    ) as jest.Mock;

    // Mock useVoteManagement
    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: jest.fn().mockResolvedValue({ status: 'confirmed' }),
      refreshData: jest.fn(),
      selectedLogo: null,
      handleLogoSelection: jest.fn(),
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
      logos: [
        {
          id: '1',
          alt: 'Les Jardins du Lac Campion logo 1',
          imageUrl: '/logos/Logo1.png',
          ownerId: 'owner1',
        },
        {
          id: '2',
          alt: 'Les Jardins du Lac Campion logo 2',
          imageUrl: '/logos/Logo2.png',
          ownerId: 'owner2',
        },
        {
          id: '3',
          alt: 'Les Jardins du Lac Campion logo 3',
          imageUrl: '/logos/Logo3.png',
          ownerId: 'owner3',
        },
        {
          id: '4',
          alt: 'Les Jardins du Lac Campion logo 4',
          imageUrl: '/logos/Logo4.png',
          ownerId: 'owner4',
        },
        {
          id: '5',
          alt: 'Les Jardins du Lac Campion logo 5',
          imageUrl: '/logos/Logo5.png',
          ownerId: 'owner5',
        },
      ],
    });

    // Mock useTheme
    (useTheme as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: jest.fn(),
    });

    // Mock useLanguage
    (useLanguage as jest.Mock).mockReturnValue({
      t: {
        title: 'Vote for Logo',
        mobileMessage: 'Welcome! Tap on a logo to vote.',
        selectThis: 'Select this',
        votes: 'votes',
        submit: 'Submit Vote',
        cancel: 'Cancel',
        selectUser: 'Select who is voting',
        selectUserRequired: 'Please select who is voting',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        voteFailed: 'Vote submission failed',
        recentVotes: 'Recent Votes',
        votedFor: 'voted for Logo #',
        alreadyVoted: (name: string, logo: string) =>
          `${name} has already voted for Logo #${logo}!`,
        failedToLoadUsers: 'Failed to load users',
      },
      language: 'en',
      toggleLanguage: jest.fn(),
    });
  });

  it('renders the page with all components', async () => {
    await act(async () => {
      render(<Vote />);
    });

    expect(screen.getByText('Vote for Logo')).toBeInTheDocument();
    expect(screen.getByText('Welcome! Tap on a logo to vote.')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('handles logo selection and vote submission', async () => {
    const mockLogo = {
      id: '1',
      alt: 'Les Jardins du Lac Campion logo 1',
      imageUrl: '/logos/Logo1.png',
      ownerId: 'owner1',
    };

    const mockRecordVote = jest.fn().mockResolvedValue({ status: 'confirmed' });
    const mockRefreshData = jest.fn();
    const mockHandleLogoSelection = jest.fn();

    // Initial state
    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: mockRecordVote,
      refreshData: mockRefreshData,
      selectedLogo: null,
      handleLogoSelection: mockHandleLogoSelection,
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
      logos: [mockLogo],
    });

    render(<Vote />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('Welcome! Tap on a logo to vote.')).toBeInTheDocument();
    });

    // Select a logo
    const logo = screen.getAllByRole('radio')[0];

    // Update the mock to simulate the selected logo
    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: mockRecordVote,
      refreshData: mockRefreshData,
      selectedLogo: mockLogo,
      handleLogoSelection: mockHandleLogoSelection,
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
      logos: [mockLogo],
    });

    await act(async () => {
      fireEvent.click(logo);
    });

    // Check if handleLogoSelection was called
    expect(mockHandleLogoSelection).toHaveBeenCalledWith(mockLogo);

    // Wait for the modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Now the modal should be open and we can find the user select
    const userSelect = screen.getByTestId('user-select');
    expect(userSelect).toBeInTheDocument();

    // Select a user
    await act(async () => {
      fireEvent.change(userSelect, { target: { value: 'user1' } });
    });

    // Submit the vote
    const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Check if recordVote was called
    expect(mockRecordVote).toHaveBeenCalledWith({
      userId: 'user1',
      logoId: mockLogo.id,
      timestamp: expect.any(Date),
      ownerId: mockLogo.ownerId,
      userName: 'Test User',
    });

    // Check if refreshData was called
    expect(mockRefreshData).toHaveBeenCalled();

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    (useVoteManagement as jest.Mock).mockReturnValue({
      loading: true,
      error: null,
      recordVote: jest.fn(),
      refreshData: jest.fn(),
      selectedLogo: null,
      handleLogoSelection: jest.fn(),
      voteHistory: [],
      voteCount: {},
      voteStats: [],
    });

    await act(async () => {
      render(<Vote />);
    });

    expect(screen.getByText('Loading vote history...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    const errorMessage = 'An unexpected error occurred. Please try again later.';
    (useVoteManagement as jest.Mock).mockReturnValue({
      loading: false,
      error: errorMessage,
      recordVote: jest.fn(),
      refreshData: jest.fn(),
      selectedLogo: null,
      handleLogoSelection: jest.fn(),
      voteHistory: [],
      voteCount: {},
      voteStats: [],
      logos: [],
    });

    await act(async () => {
      render(<Vote />);
    });

    const errorElements = screen.getAllByText(errorMessage);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('handles theme toggle', async () => {
    const mockToggleTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
    });

    await act(async () => {
      render(<Vote />);
    });

    const themeButton = screen.getByRole('button', { name: /Dark Mode|Light Mode/i });

    await act(async () => {
      fireEvent.click(themeButton);
    });

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('handles language toggle', async () => {
    const mockToggleLanguage = jest.fn();
    (useLanguage as jest.Mock).mockReturnValue({
      t: {
        title: 'Vote for Logo',
        mobileMessage: 'Welcome! Tap on a logo to vote.',
        selectThis: 'Select this',
        votes: 'votes',
        submit: 'Submit Vote',
        cancel: 'Cancel',
        selectUser: 'Select who is voting',
        selectUserRequired: 'Please select who is voting',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        voteFailed: 'Vote submission failed',
        recentVotes: 'Recent Votes',
        votedFor: 'voted for Logo #',
        alreadyVoted: (name: string, logo: string) =>
          `${name} has already voted for Logo #${logo}!`,
        failedToLoadUsers: 'Failed to load users',
      },
      language: 'en',
      toggleLanguage: mockToggleLanguage,
    });

    await act(async () => {
      render(<Vote />);
    });

    const languageButton = screen.getByRole('button', { name: /FR|EN/i });

    await act(async () => {
      fireEvent.click(languageButton);
    });

    expect(mockToggleLanguage).toHaveBeenCalled();
  });

  it('handles modal cancellation', async () => {
    const mockHandleLogoSelection = jest.fn();
    const mockRecordVote = jest.fn().mockResolvedValue({ status: 'confirmed' });
    const mockRefreshData = jest.fn();

    const mockLogo = {
      id: '1',
      alt: 'Les Jardins du Lac Campion logo 1',
      imageUrl: '/logos/Logo1.png',
      ownerId: 'owner1',
    };

    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: mockRecordVote,
      refreshData: mockRefreshData,
      selectedLogo: null,
      handleLogoSelection: mockHandleLogoSelection,
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
    });

    render(<Vote />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('Welcome! Tap on a logo to vote.')).toBeInTheDocument();
    });

    // Select a logo first
    const logo = screen.getAllByRole('radio')[0];
    await act(async () => {
      fireEvent.click(logo);
    });

    // Check if handleLogoSelection was called
    expect(mockHandleLogoSelection).toHaveBeenCalledWith(mockLogo);

    // Update the mock to simulate the selected logo
    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: mockRecordVote,
      refreshData: mockRefreshData,
      selectedLogo: mockLogo,
      handleLogoSelection: mockHandleLogoSelection,
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
    });

    // Wait for the modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('validates user input', async () => {
    const mockHandleLogoSelection = jest.fn();
    const mockRecordVote = jest.fn().mockResolvedValue({ status: 'confirmed' });
    const mockRefreshData = jest.fn();

    const mockLogo = {
      id: '1',
      alt: 'Les Jardins du Lac Campion logo 1',
      imageUrl: '/logos/Logo1.png',
      ownerId: 'owner1',
    };

    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: mockRecordVote,
      refreshData: mockRefreshData,
      selectedLogo: null,
      handleLogoSelection: mockHandleLogoSelection,
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
    });

    render(<Vote />);

    // Wait for users to be loaded
    await waitFor(() => {
      expect(screen.getByText('Welcome! Tap on a logo to vote.')).toBeInTheDocument();
    });

    // Select a logo first
    const logo = screen.getAllByRole('radio')[0];
    await act(async () => {
      fireEvent.click(logo);
    });

    // Check if handleLogoSelection was called
    expect(mockHandleLogoSelection).toHaveBeenCalledWith(mockLogo);

    // Update the mock to simulate the selected logo
    (useVoteManagement as jest.Mock).mockReturnValue({
      voteHistory: [],
      loading: false,
      error: null,
      recordVote: mockRecordVote,
      refreshData: mockRefreshData,
      selectedLogo: mockLogo,
      handleLogoSelection: mockHandleLogoSelection,
      voteCount: {
        '1': 5,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
      },
      voteStats: [
        { logoId: '1', voteCount: 5 },
        { logoId: '2', voteCount: 0 },
        { logoId: '3', voteCount: 0 },
        { logoId: '4', voteCount: 0 },
        { logoId: '5', voteCount: 0 },
      ],
    });

    // Wait for the modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Try to submit without selecting a user
    const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for the validation error to appear
    await waitFor(() => {
      expect(screen.getByText('Please select who is voting')).toBeInTheDocument();
    });
  });
});
