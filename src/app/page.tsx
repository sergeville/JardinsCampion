'use client';
import React, { useState, Suspense, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoteManagement } from '@/hooks/useVoteManagement';
import { LogoGrid } from '@/components/LogoGrid';
import VoteHistory from '@/components/VoteHistory';
import VoteModal from '@/components/VoteModal';
import { useTheme } from '@/hooks/useTheme';
import ErrorBoundary from '@/components/ErrorBoundary';
import DatabaseErrorBoundary from '@/components/DatabaseErrorBoundary';
import styles from './styles.module.css';
import ErrorMessage from '@/components/ErrorMessage';
import { NetworkError } from '@/lib/errors/types';
import type { Logo } from '@/types/vote';

function LoadingFallback() {
  return <div className={styles.loading}>Loading...</div>;
}

export default function Vote() {
  const { t, language, toggleLanguage } = useLanguage();
  const {
    voteHistory,
    loading: voteLoading,
    error: voteError,
    recordVote,
    refreshData,
    selectedLogo,
    voteCount,
    handleLogoSelection,
    voteStats,
    loading: statsLoading,
    error: statsError,
  } = useVoteManagement();

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(
          data.map((user: { userId: string; name: string }) => ({
            id: user.userId,
            name: user.name,
          }))
        );
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(t.failedToLoadUsers);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [t.failedToLoadUsers]);

  const [selectedUserId, setSelectedUserId] = useState('');

  const handleModalSubmit = useCallback(async () => {
    if (!selectedLogo) {
      setError('No logo selected');
      return;
    }

    if (!selectedUserId) {
      setError(t.selectUserRequired);
      return;
    }

    // Find the selected user's name
    const selectedUser = users.find((user) => user.id === selectedUserId);
    if (!selectedUser) {
      setError('Selected user not found');
      return;
    }

    try {
      const result = await recordVote({
        userId: selectedUserId,
        logoId: selectedLogo.id,
        timestamp: new Date(),
        ownerId: selectedLogo.ownerId,
        userName: selectedUser.name,
      });

      if (!result) return;

      if (result.status === 'confirmed') {
        refreshData();
        setShowModal(false);
        setSelectedUserId('');
      } else if (result.status === 'rejected' && result.conflictResolution) {
        setError(t.alreadyVoted(selectedUserId, selectedLogo.id));
        setTimeout(() => {
          setError(null);
          setShowModal(false);
          setSelectedUserId('');
        }, 3000);
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError(t.voteFailed);
      }
      console.error('Error submitting vote:', err);
    }
  }, [selectedLogo, selectedUserId, recordVote, refreshData, t, users]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSelectedUserId('');
    setError(null);
  }, []);

  useEffect(() => {
    if (voteError || statsError) {
      setError(voteError || statsError);
    }
  }, [voteError, statsError]);

  const isLoading = voteLoading || loadingUsers || statsLoading;

  const handleLanguageToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('Language toggle button clicked');
      toggleLanguage();
    },
    [toggleLanguage]
  );

  // Convert voteStats array to a Record<string, number> for the LogoGrid
  const voteCountMap = useMemo(() => {
    if (!voteStats || !Array.isArray(voteStats)) return {};

    return voteStats.reduce(
      (acc, stat) => {
        if (!stat || !stat.logoId) return acc;

        // Extract the numeric ID from the logoId
        const numericId = stat.logoId.toString().replace(/.*?(\d+)$/, '$1');
        acc[numericId] = stat.voteCount || 0;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [voteStats]);

  const handleLogoSelect = useCallback((logo: Logo) => {
    handleLogoSelection(logo);
    setShowModal(true);
  }, [handleLogoSelection]);

  return (
    <ErrorBoundary>
      <DatabaseErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <main className={styles.main}>
            {error && !error.includes(t.alreadyVoted?.('', '')?.split('!')[0] || '') && (
              <div className={styles.errorMessage}>
                <ErrorMessage error={error} />
              </div>
            )}

            {error && error.includes(t.alreadyVoted('', '').split('!')[0]) && (
              <div className={styles.userMessageContainer}>
                <ErrorMessage error={error} isUserMessage={true} />
              </div>
            )}

            <header className={styles.header}>
              <h1>{t.title}</h1>
              <div className={styles.headerButtons}>
                <button
                  type="button"
                  className={styles.languageToggle}
                  onClick={toggleLanguage}
                  aria-label={language === 'en' ? 'Switch to French' : 'Switch to English'}
                >
                  {language === 'en' ? 'FR' : 'EN'}
                </button>
                <button
                  type="button"
                  className={styles.themeToggle}
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </header>

            <div className={styles.welcomeMessage}>
              {t.mobileMessage}
            </div>

            <LogoGrid
              logos={[
                {
                  id: '1',
                  alt: 'Les Jardins du Lac Campion logo 1',
                  imageUrl: '/logos/Logo1.png',
                  ownerId: 'owner1',
                },
                {
                  id: '2',
                  alt: 'Les Jardins du Lac Campion logo 2',
                  imageUrl: '/logos/Logo2.png',
                  ownerId: 'owner2',
                },
                {
                  id: '3',
                  alt: 'Les Jardins du Lac Campion logo 3',
                  imageUrl: '/logos/Logo3.png',
                  ownerId: 'owner3',
                },
                {
                  id: '4',
                  alt: 'Les Jardins du Lac Campion logo 4',
                  imageUrl: '/logos/Logo4.png',
                  ownerId: 'owner4',
                },
                {
                  id: '5',
                  alt: 'Les Jardins du Lac Campion logo 5',
                  imageUrl: '/logos/Logo5.png',
                  ownerId: 'owner5',
                },
                {
                  id: '6',
                  alt: 'Les Jardins du Lac Campion logo 6',
                  imageUrl: '/logos/Logo6.png',
                  ownerId: 'owner6',
                },
              ]}
              voteCount={voteCount}
              onSelectLogo={handleLogoSelect}
              selectedLogo={selectedLogo}
              loading={isLoading}
              error={statsError}
              t={t}
            />

            <VoteModal
              isOpen={showModal}
              onClose={() => {
                setShowModal(false);
                setError(null);
              }}
              onSubmit={handleModalSubmit}
              selectedUserId={selectedUserId}
              onUserSelect={setSelectedUserId}
              error={error}
              users={users}
              t={t}
            />

            <VoteHistory
              voteHistory={voteHistory}
              translations={{
                recentVotes: t.recentVotes,
                votedFor: t.votedFor,
              }}
              loading={voteLoading}
            />
          </main>
        </Suspense>
      </DatabaseErrorBoundary>
    </ErrorBoundary>
  );
}
