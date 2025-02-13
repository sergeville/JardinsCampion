'use client';
import React, { useState, Suspense } from 'react';
import LogoGrid from '../components/LogoGrid';
import VoteHistory from '../components/VoteHistory';
import NameInputModal from '../components/NameInputModal';
import TempMessage from '../components/TempMessage';
import { useVoteManagement } from '../hooks/useVoteManagement';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import ErrorBoundary from '../components/ErrorBoundary';
import { DatabaseErrorBoundary } from '@/components/DatabaseErrorBoundary';
import styles from './styles.module.css';

const logos = [
  {
    src: '/logos/Logo2.png',
    value: '1',
    alt: 'Elegant floral logo with intertwined leaves and vines in a circular design',
    ownerId: 'owner123',
  },
  {
    src: '/logos/Logo3.png',
    value: '2',
    alt: 'Modern minimalist garden logo with stylized plant elements',
    ownerId: 'owner456',
  },
  {
    src: '/logos/Logo4.png',
    value: '3',
    alt: 'Nature-inspired logo featuring delicate leaf patterns',
    ownerId: 'owner789',
  },
  {
    src: '/logos/Logo1.jpeg',
    value: '4',
    alt: 'Classic garden design logo with ornate botanical details',
    ownerId: 'owner012',
  },
];

function LoadingFallback() {
  return <div className={styles.loading}>Loading...</div>;
}

export default function Vote() {
  const [showModal, setShowModal] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const { voteCount, voteHistory, recordVote, getUserPreviousVote, loading, error } =
    useVoteManagement({
      onError: (error) => {
        console.error('Vote management error:', error);
        if (error.message === 'already-voted') {
          setErrorMessage(t.alreadyVoted);
          setShowMessage(true);
        } else {
          setErrorMessage(error.message);
          setShowMessage(true);
        }
      },
    });

  const handleLogoSelection = (logoId: string) => {
    setSelectedLogo(logoId);
    setShowModal(true);
  };

  const handleModalSubmit = async (userName: string) => {
    if (selectedLogo) {
      try {
        const trimmedUserName = userName.trim();
        const generatedUserId = trimmedUserName.toLowerCase().replace(/\s+/g, '-');

        const selectedLogoData = logos.find((logo) => logo.value === selectedLogo);

        if (selectedLogoData?.ownerId === generatedUserId) {
          setErrorMessage(t.cannotVoteOwn);
          setShowMessage(true);
          return;
        }

        const previousVote = await getUserPreviousVote(generatedUserId);
        console.log('Previous vote:', previousVote);

        if (previousVote && previousVote.logoId === selectedLogo) {
          setErrorMessage(t.alreadyVoted(trimmedUserName, selectedLogo));
          setShowMessage(true);
          return;
        }

        const voteData = {
          userName: trimmedUserName,
          userId: generatedUserId,
          logoId: selectedLogo,
          timestamp: new Date(),
          ownerId: selectedLogoData?.ownerId,
        };

        console.log('Submitting vote:', voteData);
        const result = await recordVote(voteData);
        console.log('Vote result:', result);

        if (result?.status === 'confirmed') {
          setErrorMessage(t.voteRecorded(trimmedUserName, selectedLogo));
        } else if (result?.conflictResolution) {
          setErrorMessage(
            t.voteChanged(trimmedUserName, result.conflictResolution.originalVote, selectedLogo)
          );
        }
        setShowMessage(true);
        setShowModal(false);
        setSelectedLogo(null);
      } catch (err) {
        console.error('Error submitting vote:', err);
        setErrorMessage(err instanceof Error ? err.message : t.voteFailed);
        setShowMessage(true);
      }
    }
  };

  if (error) {
    return (
      <div className={styles.errorMessage}>
        <h2>{t.error}</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DatabaseErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <main className={styles.main}>
            {showMessage && (
              <TempMessage message={errorMessage} onClose={() => setShowMessage(false)} />
            )}
            <div className={styles.mobileMessage}>{t.mobileMessage}</div>
            <div className={styles.header}>
              <h1>{t.title}</h1>
              <div className={styles.headerButtons}>
                <button onClick={toggleLanguage} className={styles.languageToggle}>
                  {language === 'en' ? 'FR' : 'EN'}
                </button>
                <button
                  onClick={toggleTheme}
                  className={styles.themeToggle}
                  aria-label={isDarkMode ? t.lightMode : t.darkMode}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>

            <LogoGrid
              logos={logos}
              selectedLogo={selectedLogo}
              voteCount={voteCount}
              onLogoSelect={handleLogoSelection}
              translations={{
                selectThis: t.selectThis,
                votes: t.votes,
              }}
              loading={loading}
            />

            <VoteHistory
              voteHistory={voteHistory}
              translations={{
                recentVotes: t.recentVotes,
                votedFor: t.votedFor,
              }}
              loading={loading}
            />

            <NameInputModal
              isOpen={showModal}
              onCancel={() => {
                setShowModal(false);
                setSelectedLogo(null);
              }}
              onSubmit={handleModalSubmit}
              translations={{
                enterName: t.enterName,
                nameLabel: t.nameLabel,
                namePlaceholder: t.namePlaceholder,
                submit: t.submit,
                cancel: t.cancel,
              }}
              loading={loading}
            />
          </main>
        </Suspense>
      </DatabaseErrorBoundary>
    </ErrorBoundary>
  );
}
