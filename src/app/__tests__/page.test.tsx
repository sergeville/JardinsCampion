import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Vote from '../page';
import { mockMatchMedia } from '../../test-utils/test-utils';

// Mock the Image component since we're using Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    width: number;
    height: number;
    priority?: boolean;
  }) => <img {...props} alt={props.alt || ''} />,
}));

describe('Page Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    // Setup matchMedia mock
    mockMatchMedia();
    // Reset document body
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    // Clear alert mock
    (window.alert as jest.Mock).mockClear();
  });

  const switchToEnglish = async () => {
    const languageToggle = screen.queryByText('EN');
    if (languageToggle) {
      fireEvent.click(languageToggle);
      await waitFor(() => {
        expect(screen.getByText(/Logo Selection/)).toBeInTheDocument();
      });
    }
  };

  it('renders the title in English when switched', async () => {
    render(<Vote />);
    await switchToEnglish();
    expect(screen.getByText(/Jardins du Lac Campion/)).toBeInTheDocument();
    expect(screen.getByText(/Logo Selection/)).toBeInTheDocument();
  });

  it('shows the mobile welcome message in English', async () => {
    render(<Vote />);
    await switchToEnglish();
    expect(screen.getByText(/Welcome! Tap on a logo to vote./i)).toBeInTheDocument();
  });

  it('allows users to enter their name and vote', async () => {
    render(<Vote />);
    await switchToEnglish();

    // Click on a logo to vote
    const logos = screen.getAllByRole('img');
    fireEvent.click(logos[0]);

    // Enter name in the modal
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    // Submit vote
    const submitButton = screen.getByRole('button', { name: /Submit Vote|Soumettre le Vote/i });
    fireEvent.click(submitButton);

    // Check for success message in alert
    expect(window.alert).toHaveBeenCalled();

    // Check vote history
    await waitFor(() => {
      const voteList = screen.getByTestId('vote-list');
      expect(voteList).toHaveTextContent('Test User');
      expect(voteList).toHaveTextContent(/Logo #1/);
    });
  });

  it('prevents voting for the same logo twice', async () => {
    render(<Vote />);
    await switchToEnglish();

    // First vote
    const logos = screen.getAllByRole('img');
    fireEvent.click(logos[0]);

    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    const submitButton = screen.getByRole('button', { name: /Submit Vote|Soumettre le Vote/i });
    fireEvent.click(submitButton);

    // Try to vote for the same logo again
    fireEvent.click(logos[0]);

    // Check for error message in alert
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Test User'));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Logo #1'));
  });

  it('allows changing language between English and French', async () => {
    render(<Vote />);

    // Start with English
    await switchToEnglish();
    expect(screen.getByText(/Logo Selection/)).toBeInTheDocument();

    // Switch to French
    const languageToggle = screen.getByText('FR');
    fireEvent.click(languageToggle);

    await waitFor(() => {
      expect(screen.getByText(/Voté pour le plus beau logo/)).toBeInTheDocument();
    });
  });

  it('maintains dark/light mode preference', async () => {
    render(<Vote />);
    await switchToEnglish();

    // Find and click dark mode toggle using aria-label
    const modeToggle = screen.getByRole('button', { name: /Dark Mode|Mode Sombre/i });
    fireEvent.click(modeToggle);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    // Toggle back to light mode
    fireEvent.click(modeToggle);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});
