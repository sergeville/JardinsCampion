import React from 'react';
import './VoteHistory.css';

interface Vote {
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
  userName: string;
}

interface VoteHistoryProps {
  voteHistory: Vote[];
  translations: {
    recentVotes: string;
    votedFor: string;
  };
  loading?: boolean;
}

export default function VoteHistory({
  voteHistory,
  translations,
  loading = false,
}: VoteHistoryProps) {
  if (loading) {
    return <div className="loading">Loading vote history...</div>;
  }

  return (
    <div className="vote-history">
      <h2>{translations.recentVotes}</h2>
      <ul className="vote-list">
        {voteHistory.map((vote, index) => (
          <li
            key={`${vote.userId}-${vote.logoId}-${index}`}
            className="vote-item"
            aria-label={`${vote.userName} ${translations.votedFor} ${vote.logoId}`}
          >
            <span className="voter-name">{vote.userName}</span> {translations.votedFor}{' '}
            <span className="logo-id">Logo #{vote.logoId}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
