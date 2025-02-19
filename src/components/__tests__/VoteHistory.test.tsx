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

  describe('Vote Count Management', () => {
    it('prevents logo owner from voting for their own logo', async () => {
      const ownerVote = {
        userName: 'Owner User',
        userId: 'owner1', // Same as ownerId of logo 1
        logoId: '1',
        timestamp: new Date(),
        ownerId: 'owner1',
      };

      const onError = jest.fn();

      render(
        <VoteHistory
          voteHistory={mockVotes}
          translations={mockTranslations}
          onError={onError}
        />
      );

      // Attempt to add owner vote
      act(() => {
        const updatedVotes = [ownerVote, ...mockVotes];
        render(
          <VoteHistory
            voteHistory={updatedVotes}
            translations={mockTranslations}
            onError={onError}
          />
        );
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Logo owners cannot vote for their own logos')
          })
        );
      });
    });

    it('handles vote count increment when new vote is added', async () => {
      const initialVotes = [...mockVotes];
      const newVote = {
        userName: 'New Voter',
        userId: 'new-voter',
        logoId: '1',
        timestamp: new Date(),
        ownerId: 'owner2', // Different from voter
      };

      const onVoteUpdate = jest.fn();

      const { rerender } = render(
        <VoteHistory
          voteHistory={initialVotes}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      // Add new vote
      const updatedVotes = [newVote, ...initialVotes];
      rerender(
        <VoteHistory
          voteHistory={updatedVotes}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      await waitFor(() => {
        expect(onVoteUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            logoId: '1',
            userId: 'new-voter',
          })
        );
      });
    });

    it('handles vote count changes when user changes their vote', async () => {
      const initialVote = {
        userName: 'Change Voter',
        userId: 'change-voter',
        logoId: '1',
        timestamp: new Date('2024-02-20T10:00:00'),
        ownerId: 'owner2',
      };

      const changedVote = {
        ...initialVote,
        logoId: '2',
        timestamp: new Date('2024-02-20T10:01:00'),
      };

      const onVoteUpdate = jest.fn();

      const { rerender } = render(
        <VoteHistory
          voteHistory={[initialVote, ...mockVotes]}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      // Change vote
      rerender(
        <VoteHistory
          voteHistory={[changedVote, initialVote, ...mockVotes]}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      await waitFor(() => {
        // Should be called twice: once for decrement, once for increment
        expect(onVoteUpdate).toHaveBeenCalledTimes(2);
        expect(onVoteUpdate).toHaveBeenNthCalledWith(1,
          expect.objectContaining({
            logoId: '1',
            userId: 'change-voter',
            action: 'decrement',
          })
        );
        expect(onVoteUpdate).toHaveBeenNthCalledWith(2,
          expect.objectContaining({
            logoId: '2',
            userId: 'change-voter',
            action: 'increment',
          })
        );
      });

      // Verify the vote change message is displayed
      const voteChangeMessage = screen.getByText(
        mockTranslations.voteChanged
          .replace('{previous}', '1')
          .replace('{current}', '2')
      );
      expect(voteChangeMessage).toBeInTheDocument();
    });

    it('maintains correct vote count history after multiple vote changes', async () => {
      const voter = {
        userName: 'Multiple Voter',
        userId: 'multiple-voter',
      };

      const voteSequence = [
        { ...voter, logoId: '1', timestamp: new Date('2024-02-20T10:00:00'), ownerId: 'owner2' },
        { ...voter, logoId: '2', timestamp: new Date('2024-02-20T10:01:00'), ownerId: 'owner1' },
        { ...voter, logoId: '3', timestamp: new Date('2024-02-20T10:02:00'), ownerId: 'owner3' },
      ];

      const onVoteUpdate = jest.fn();

      const { rerender } = render(
        <VoteHistory
          voteHistory={[voteSequence[0], ...mockVotes]}
          translations={mockTranslations}
          onVoteUpdate={onVoteUpdate}
        />
      );

      // Simulate vote changes
      for (let i = 1; i < voteSequence.length; i++) {
        rerender(
          <VoteHistory
            voteHistory={[voteSequence[i], ...voteSequence.slice(0, i), ...mockVotes]}
            translations={mockTranslations}
            onVoteUpdate={onVoteUpdate}
          />
        );
      }

      await waitFor(() => {
        // Should be called 4 times: 2 decrements and 2 increments
        expect(onVoteUpdate).toHaveBeenCalledTimes(4);
        
        // Verify the final vote state
        const voteItems = screen.getAllByRole('listitem');
        expect(voteItems[0]).toHaveTextContent('Multiple Voter');
        expect(voteItems[0]).toHaveTextContent('Logo #3');
      });
    });
  });
});
