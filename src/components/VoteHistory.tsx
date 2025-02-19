import React, { useEffect, useCallback, useRef } from 'react';
import styles from './VoteHistory.module.css';

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
    noVotes?: string;
  };
  loading?: boolean;
  onVoteUpdate?: (vote: Vote) => void;
  onError?: (error: Error) => void;
}

export default function VoteHistory({
  voteHistory,
  translations,
  loading = false,
  onVoteUpdate,
  onError,
}: VoteHistoryProps) {
  const voteListRef = useRef<HTMLUListElement>(null);
  const prevVoteCountRef = useRef(voteHistory.length);

  // Handle smooth scrolling when new votes are added
  useEffect(() => {
    if (voteHistory.length > prevVoteCountRef.current && voteListRef.current) {
      const firstNewItem = voteListRef.current.children[0];
      firstNewItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevVoteCountRef.current = voteHistory.length;
  }, [voteHistory.length]);

  // Optimize re-renders by memoizing the vote list
  const renderVoteList = useCallback(() => {
    if (voteHistory.length === 0) {
      return (
        <li className={`${styles.voteItem} ${styles.emptyState}`}>
          {translations.noVotes || 'No votes yet'}
        </li>
      );
    }

    return voteHistory.map((vote, index) => (
      <li
        key={`${vote.userId}-${vote.logoId}-${index}`}
        className={styles.voteItem}
        aria-label={`${vote.userName} voted for Logo #${vote.logoId}`}
      >
        <span className={styles.voterName}>{vote.userName}</span>
        <span className={styles.voteAction}>
          {translations.votedFor}
          <span className={styles.logoId}>{vote.logoId}</span>
        </span>
        <span className={styles.timestamp}>
          {new Date(vote.timestamp).toLocaleTimeString()}
        </span>
      </li>
    ));
  }, [voteHistory, translations]);

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        <div className={styles.loadingSpinner} />
        Loading vote history...
      </div>
    );
  }

  return (
    <div className={styles.voteHistory}>
      <h2>{translations.recentVotes}</h2>
      <ul 
        ref={voteListRef}
        className={styles.voteList}
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {renderVoteList()}
      </ul>
    </div>
  );
}
