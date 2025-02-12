import React from 'react';
import { render, screen } from '@testing-library/react';
import { VoteHistory } from '../VoteHistory';

const mockTranslations = {
  recentVotes: 'Recent Votes',
  votedFor: 'voted for Logo #',
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

  it('renders the title', () => {
    render(<VoteHistory voteHistory={[]} translations={mockTranslations} />);

    expect(screen.getByText('Recent Votes')).toBeInTheDocument();
  });

  it('renders empty state message when no votes', () => {
    render(<VoteHistory voteHistory={[]} translations={mockTranslations} />);

    expect(screen.getByText('No votes yet')).toBeInTheDocument();
  });

  it('renders vote history items', () => {
    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('voted for Logo #1'))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('voted for Logo #2'))
    ).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    const times = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(times).toHaveLength(2);
  });

  it('renders votes in chronological order', () => {
    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    const voteItems = screen.getAllByRole('listitem');
    expect(voteItems[0]).toHaveTextContent('John Doe');
    expect(voteItems[1]).toHaveTextContent('Jane Smith');
  });

  it('applies correct ARIA labels', () => {
    render(<VoteHistory voteHistory={mockVotes} translations={mockTranslations} />);

    expect(screen.getByLabelText('John Doe voted for Logo #1')).toBeInTheDocument();
    expect(screen.getByLabelText('Jane Smith voted for Logo #2')).toBeInTheDocument();
  });
});
