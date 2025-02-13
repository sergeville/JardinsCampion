import React from 'react';
import './VoteHistory.css';

interface VoteData {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

interface VoteHistoryProps {
  voteHistory: VoteData[];
  translations: {
    recentVotes: string;
    votedFor: string;
  };
  loading?: boolean;
}

export const VoteHistory: React.FC<VoteHistoryProps> = ({
  voteHistory,
  translations: t,
  loading = false,
}) => {
  // Sort votes in chronological order
  const sortedVotes = [...voteHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`vote-history ${loading ? 'loading' : ''}`}>
      <h2>{t.recentVotes}</h2>
      <div className="vote-list" data-testid="vote-list" role="list">
        {loading ? (
          <div className="loading-placeholder">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="vote-item placeholder">
                <div className="placeholder-text" />
              </div>
            ))}
          </div>
        ) : sortedVotes.length > 0 ? (
          sortedVotes.map((vote) => (
            <div
              key={`${vote.userId}-${new Date(vote.timestamp).getTime()}`}
              className="vote-item"
              role="listitem"
              aria-label={`${vote.userName} ${t.votedFor}${vote.logoId}`}
            >
              <span className="voter-name">{vote.userName}</span>
              <span className="vote-details">
                {t.votedFor}
                {vote.logoId}
              </span>
              <span className="vote-time">{formatTime(vote.timestamp)}</span>
            </div>
          ))
        ) : (
          <div className="no-votes-message" role="listitem">
            No votes yet
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteHistory;
