import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import VoteHistory from '@/components/VoteHistory';

const mockTranslations = {
  recentVotes: 'Recent Votes',
  votedFor: 'voted for Logo #',
  noVotes: 'No votes yet',
};

describe('VoteHistory', () => {
  const mockVotes = [
    {
      userName: 'John Doe',
      userId: 'john-doe',
      logoId: '1',
      timestamp: new Date('2024-02-20T10:00:00'),
      ownerId: 'owner1',
    },
    {
      userName: 'Jane Smith',
      userId: 'jane-smith',
      logoId: '2',
      timestamp: new Date('2024-02-20T11:00:00'),
      ownerId: 'owner2',
    },
  ];

  beforeEach(() => {
    // Mock scrollIntoView since it's not implemented in JSDOM
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders the title', () => {
    render(<VoteHistory voteHistory={[]} translations={mockTranslations} />);
    expect(screen.getByText('Recent Votes')).toBeInTheDocument();
  });

  it('renders empty state message when no votes', () => {
    render(<VoteHistory voteHistory={[]} translations={mockTranslations} />);
    expect(screen.getByText('No votes yet')).toBeInTheDocument();
  });

  it('renders vote history items with timestamps', () => {
    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    const voteItems = screen.getAllByRole('listitem');
    expect(voteItems[0]).toHaveTextContent('10:00:00');
    expect(voteItems[1]).toHaveTextContent('11:00:00');
  });

  it('shows loading state with spinner when loading prop is true', () => {
    render(<VoteHistory voteHistory={[]} translations={mockTranslations} loading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading vote history...')).toBeInTheDocument();
    expect(document.querySelector('.loadingSpinner')).toBeInTheDocument();
  });

  it('handles new vote updates with smooth scrolling', async () => {
    const { rerender } = render(
      <VoteHistory voteHistory={mockVotes} translations={mockTranslations} />
    );

    const newVote = {
      userName: 'New User',
      userId: 'new-user',
      logoId: '3',
      timestamp: new Date('2024-02-20T12:00:00'),
      ownerId: 'owner3',
    };

    const updatedVotes = [newVote, ...mockVotes];

    rerender(
      <VoteHistory voteHistory={updatedVotes} translations={mockTranslations} />
    );

    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it('optimizes rendering with memoization', () => {
    const { rerender } = render(
      <VoteHistory voteHistory={mockVotes} translations={mockTranslations} />
    );

    const initialHTML = document.body.innerHTML;

    // Rerender with same props
    rerender(
      <VoteHistory voteHistory={mockVotes} translations={mockTranslations} />
    );

    expect(document.body.innerHTML).toBe(initialHTML);
  });

  it('provides proper ARIA attributes for accessibility', () => {
    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-live', 'polite');
    expect(list).toHaveAttribute('aria-atomic', 'false');
    expect(list).toHaveAttribute('aria-relevant', 'additions');

    const items = screen.getAllByRole('listitem');
    items.forEach((item, index) => {
      expect(item).toHaveAttribute(
        'aria-label',
        `${mockVotes[index].userName} voted for Logo #${mockVotes[index].logoId}`
      );
    });
  });

  it('respects reduced motion preferences', () => {
    // Mock matchMedia for prefers-reduced-motion
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    const voteItems = screen.getAllByRole('listitem');
    voteItems.forEach(item => {
      const styles = window.getComputedStyle(item);
      expect(styles.animation).toBe('none');
    });
  });
});
