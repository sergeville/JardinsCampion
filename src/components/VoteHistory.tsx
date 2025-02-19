import React, { useEffect, useCallback, useRef } from 'react';
import styles from './VoteHistory.module.css';

interface Vote {
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
  userName: string;
  action?: 'increment' | 'decrement';
}

interface VoteHistoryProps {
  voteHistory: Vote[];
  translations: {
    recentVotes: string;
    votedFor: string;
    noVotes?: string;
    ownerVoteError?: string;
    voteChanged?: string;
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
  const prevVotesRef = useRef<{ [key: string]: string }>({});

  // Handle vote updates and restrictions
  useEffect(() => {
    if (voteHistory.length === 0) return;

    const latestVote = voteHistory[0];
    
    // Check if owner is trying to vote for their own logo
    if (latestVote.userId === latestVote.ownerId) {
      onError?.(new Error(translations.ownerVoteError || 'Logo owners cannot vote for their own logos'));
      return;
    }

    // Check for vote changes
    const prevVote = prevVotesRef.current[latestVote.userId];
    if (prevVote && prevVote !== latestVote.logoId) {
      // Decrement previous vote
      onVoteUpdate?.({
        ...latestVote,
        logoId: prevVote,
        action: 'decrement',
      });
      
      // Increment new vote
      onVoteUpdate?.({
        ...latestVote,
        action: 'increment',
      });
    } else if (!prevVote) {
      // New vote
      onVoteUpdate?.({
        ...latestVote,
        action: 'increment',
      });
    }

    // Update previous votes record
    prevVotesRef.current[latestVote.userId] = latestVote.logoId;
  }, [voteHistory, onVoteUpdate, onError, translations.ownerVoteError]);

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

    return voteHistory.map((vote, index) => {
      const prevVote = index < voteHistory.length - 1 ? 
        voteHistory[index + 1].logoId : null;
      
      const isVoteChange = prevVote && 
        vote.userId === voteHistory[index + 1].userId &&
        vote.logoId !== prevVote;

      return (
        <li
          key={`${vote.userId}-${vote.logoId}-${index}`}
          className={styles.voteItem}
          aria-label={`${vote.userName} voted for Logo #${vote.logoId}`}
        >
          <span className={styles.voterName}>{vote.userName}</span>
          <span className={styles.voteAction}>
            {isVoteChange ? (
              translations.voteChanged
                ?.replace('{previous}', prevVote)
                .replace('{current}', vote.logoId)
            ) : (
              <>
                {translations.votedFor}
                <span className={styles.logoId}>{vote.logoId}</span>
              </>
            )}
          </span>
          <span className={styles.timestamp}>
            {new Date(vote.timestamp).toLocaleTimeString()}
          </span>
        </li>
      );
    });
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
