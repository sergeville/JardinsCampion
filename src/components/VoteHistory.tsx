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
  const processedVotesRef = useRef<Set<string>>(new Set());
  const lastVoteUpdateRef = useRef<string | null>(null);
  const lastProcessedTimestampRef = useRef<number>(0);
  const prevVoteHistoryRef = useRef<typeof voteHistory>([]);
  const processedVoteTimestampsRef = useRef<Set<number>>(new Set());

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reset processed votes when vote history changes
  useEffect(() => {
    processedVotesRef.current = new Set();
  }, [voteHistory]);

  // Handle vote updates and restrictions
  useEffect(() => {
    if (voteHistory.length === 0) return;

    const latestVote = voteHistory[0];
    const prevVoteHistory = prevVoteHistoryRef.current;

    // Skip if the vote history hasn't changed
    if (JSON.stringify(voteHistory) === JSON.stringify(prevVoteHistory)) return;

    // Check if owner is trying to vote for their own logo
    if (latestVote.userId === latestVote.ownerId) {
      onError?.(
        new Error(translations.ownerVoteError || 'Logo owners cannot vote for their own logos')
      );
      return;
    }

    // Find the user's previous vote in the previous vote history
    const userPreviousVote = prevVoteHistory.find((vote) => vote.userId === latestVote.userId);

    // Determine if this is a new vote or a vote change
    const isNewVote = !userPreviousVote;
    const isVoteChange = userPreviousVote && userPreviousVote.logoId !== latestVote.logoId;

    // Process the vote update
    if (isVoteChange) {
      // First decrement the previous vote
      onVoteUpdate?.({
        ...userPreviousVote,
        action: 'decrement',
      });

      // Then increment the new vote
      onVoteUpdate?.({
        ...latestVote,
        action: 'increment',
      });
    } else if (isNewVote) {
      // Only increment for new votes
      onVoteUpdate?.({
        ...latestVote,
        action: 'increment',
      });
    }

    // Update the previous vote history reference
    prevVoteHistoryRef.current = [...voteHistory];
  }, [voteHistory, onError, translations.ownerVoteError, onVoteUpdate]);

  // Handle smooth scrolling when new votes are added
  useEffect(() => {
    if (
      voteHistory.length > prevVoteCountRef.current &&
      voteListRef.current &&
      !prefersReducedMotion
    ) {
      const firstNewItem = voteListRef.current.firstElementChild;
      if (firstNewItem && typeof firstNewItem.scrollIntoView === 'function') {
        firstNewItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    prevVoteCountRef.current = voteHistory.length;
  }, [voteHistory.length, prefersReducedMotion]);

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
      const prevVote = index < voteHistory.length - 1 ? voteHistory[index + 1].logoId : null;

      const isVoteChange =
        prevVote && vote.userId === voteHistory[index + 1].userId && vote.logoId !== prevVote;

      return (
        <li
          key={`${vote.userId}-${vote.logoId}-${index}`}
          className={`${styles.voteItem} ${prefersReducedMotion ? styles.noAnimation : ''}`}
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
          <span className={styles.timestamp}>{new Date(vote.timestamp).toLocaleTimeString()}</span>
        </li>
      );
    });
  }, [voteHistory, translations, prefersReducedMotion]);

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
