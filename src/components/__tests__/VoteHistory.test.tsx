import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import VoteHistory from '@/components/VoteHistory';

const mockTranslations = {
  recentVotes: 'Recent Votes',
  votedFor: 'voted for Logo #',
  noVotes: 'No votes yet',
  ownerVoteError: 'Logo owners cannot vote for their own logos',
  voteChanged: 'Vote changed from Logo #{previous} to Logo #{current}',
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

  // Add new mock data for vote count tests
  const mockVoteCounts = {
    '1': 5,
    '2': 3,
    '3': 0,
  };

  const mockUser = {
    id: 'test-user',
    name: 'Test User',
    currentVote: null,
  };

  beforeEach(() => {
    // Mock scrollIntoView since it's not implemented in JSDOM
    Element.prototype.scrollIntoView = jest.fn();

    // Mock matchMedia to return false for reduced motion
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
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

    rerender(<VoteHistory voteHistory={updatedVotes} translations={mockTranslations} />);

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
    rerender(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

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
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    const voteItems = screen.getAllByRole('listitem');
    voteItems.forEach((item) => {
      expect(item.className).toContain('voteItem');
      // Check that the element has the no-animation class
      expect(item.className).toContain('noAnimation');
    });
  });

  describe('Vote Count Management', () => {
    it('prevents logo owner from voting for their own logo', async () => {
      const onError = jest.fn();
      const ownerVote = {
        userName: 'Owner User',
        userId: 'owner1',
        logoId: '1',
        timestamp: new Date(),
        ownerId: 'owner1',
      };

      const { rerender } = render(
        <VoteHistory voteHistory={mockVotes} translations={mockTranslations} onError={onError} />
      );

      rerender(
        <VoteHistory
          voteHistory={[ownerVote, ...mockVotes]}
          translations={mockTranslations}
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          new Error('Logo owners cannot vote for their own logos')
        );
      });
    });

    it('handles vote count updates correctly', async () => {
      const onVoteUpdate = jest.fn();
      const initialVote = {
        userName: 'Test User',
        userId: 'test-user',
        logoId: '1',
        timestamp: new Date(),
        ownerId: 'owner2',
      };

      const { rerender } = render(
        <VoteHistory voteHistory={[]} translations={mockTranslations} onVoteUpdate={onVoteUpdate} />
      );

      // Add new vote
      rerender(
        <VoteHistory
          voteHistory={[initialVote]}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      // Change vote
      const changedVote = {
        ...initialVote,
        logoId: '2',
        timestamp: new Date(),
      };

      rerender(
        <VoteHistory
          voteHistory={[changedVote, initialVote]}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      await waitFor(() => {
        // Should be called twice: once for the initial vote and twice for the vote change
        expect(onVoteUpdate).toHaveBeenCalledTimes(3);

        // First call: increment initial vote
        expect(onVoteUpdate).toHaveBeenNthCalledWith(1, {
          ...initialVote,
          action: 'increment',
        });

        // Second call: decrement initial vote
        expect(onVoteUpdate).toHaveBeenNthCalledWith(2, {
          ...initialVote,
          action: 'decrement',
        });

        // Third call: increment new vote
        expect(onVoteUpdate).toHaveBeenNthCalledWith(3, {
          ...changedVote,
          action: 'increment',
        });
      });
    });
  });
});
