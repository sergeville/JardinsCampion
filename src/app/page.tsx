'use client';
import React, { useState, Suspense } from 'react';
import LogoGrid from '../components/LogoGrid';
import VoteHistory from '../components/VoteHistory';
import NameInputModal from '../components/NameInputModal';
import { useVoteManagement } from '../hooks/useVoteManagement';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import ErrorBoundary from '../components/ErrorBoundary';

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
  return <div className="loading">Loading...</div>;
}

export default function Vote() {
  const [showModal, setShowModal] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { voteCount, voteHistory, recordVote, getUserPreviousVote } = useVoteManagement();

  const handleLogoSelection = (logoId: string) => {
    setSelectedLogo(logoId);
    setShowModal(true);
  };

  const handleModalSubmit = (userName: string) => {
    if (selectedLogo) {
      const trimmedUserName = userName.trim();
      const generatedUserId = trimmedUserName.toLowerCase().replace(/\s+/g, '-');

      const selectedLogoData = logos.find((logo) => logo.value === selectedLogo);

      if (selectedLogoData?.ownerId === generatedUserId) {
        alert(t.cannotVoteOwn);
        return;
      }

      const previousVote = getUserPreviousVote(generatedUserId);

      if (previousVote && previousVote.logoId === selectedLogo) {
        alert(t.alreadyVoted(trimmedUserName, selectedLogo));
        return;
      }

      const voteData = {
        userName: trimmedUserName,
        userId: generatedUserId,
        logoId: selectedLogo,
        timestamp: new Date(),
        ownerId: selectedLogoData?.ownerId,
      };

      const prevVote = recordVote(voteData);

      const message = prevVote
        ? t.voteChanged(trimmedUserName, prevVote.logoId, selectedLogo)
        : t.voteRecorded(trimmedUserName, selectedLogo);

      alert(message);
      setShowModal(false);
      setSelectedLogo(null);
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <main>
          <div className="mobile-message">{t.mobileMessage}</div>
          <div className="header">
            <h1>{t.title}</h1>
            <div className="header-buttons">
              <button onClick={toggleLanguage} className="language-toggle">
                {language === 'en' ? 'FR' : 'EN'}
              </button>
              <button
                onClick={toggleTheme}
                className="theme-toggle"
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
          />

          <VoteHistory
            voteHistory={voteHistory}
            translations={{
              recentVotes: t.recentVotes,
              votedFor: t.votedFor,
            }}
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
          />
        </main>
      </Suspense>
    </ErrorBoundary>
  );
}
