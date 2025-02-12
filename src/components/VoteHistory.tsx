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
}

export const VoteHistory: React.FC<VoteHistoryProps> = ({ voteHistory, translations: t }) => {
  return (
    <div className="vote-history">
      <h2>{t.recentVotes}</h2>
      <div className="vote-list" data-testid="vote-list" role="list">
        {voteHistory.map((vote) => (
          <div
            key={`${vote.userId}-${vote.timestamp.getTime()}`}
            className="vote-item"
            role="listitem"
            aria-label={`${vote.userName} ${t.votedFor}${vote.logoId}`}
          >
            <span className="voter-name">{vote.userName}</span>
            <span className="vote-details">
              {t.votedFor}
              {vote.logoId}
            </span>
            <span className="vote-time">
              {new Date(vote.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        {voteHistory.length === 0 && (
          <div className="no-votes-message" role="listitem">
            No votes yet
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteHistory;
