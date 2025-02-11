'use client'
import React, { useState } from 'react'
import Image from 'next/image'

interface VoteData {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

interface UserVote {
  userName: string;
  userId: string;
  logoId: string;
}

const translations = {
  en: {
    title: 'Jardins du Lac Campion - Logo Selection',
    selectThis: 'Select this',
    votes: 'Votes',
    recentVotes: 'Recent Votes',
    votedFor: 'voted for Logo #',
    enterName: 'Please enter your name:',
    namePlaceholder: 'Your name',
    submit: 'Submit Vote',
    cancel: 'Cancel',
    alreadyVoted: (name: string, logo: string) => `${name}, you have already voted for Logo #${logo}!`,
    cannotVoteOwn: 'Sorry, you cannot vote for your own logo!',
    voteRecorded: (name: string, logo: string) => `Thank you ${name}! Your vote for Logo #${logo} has been recorded.`,
    voteChanged: (name: string, oldLogo: string, newLogo: string) => 
      `Thank you ${name}! Your vote has been changed from Logo #${oldLogo} to Logo #${newLogo}.`,
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode'
  },
  fr: {
    title: 'Jardins du Lac Campion - Sélection du Logo',
    selectThis: 'Sélectionner',
    votes: 'Votes',
    recentVotes: 'Votes Récents',
    votedFor: 'a voté pour le Logo #',
    enterName: 'Veuillez entrer votre nom:',
    namePlaceholder: 'Votre nom',
    submit: 'Soumettre le Vote',
    cancel: 'Annuler',
    alreadyVoted: (name: string, logo: string) => `${name}, vous avez déjà voté pour le Logo #${logo}!`,
    cannotVoteOwn: 'Désolé, vous ne pouvez pas voter pour votre propre logo!',
    voteRecorded: (name: string, logo: string) => `Merci ${name}! Votre vote pour le Logo #${logo} a été enregistré.`,
    voteChanged: (name: string, oldLogo: string, newLogo: string) => 
      `Merci ${name}! Votre vote a été changé du Logo #${oldLogo} au Logo #${newLogo}.`,
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair'
  }
};

export default function Vote() {
  const [showModal, setShowModal] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [voteHistory, setVoteHistory] = useState<VoteData[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  };

  // Initialize theme on component mount
  React.useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }, []);

  const handleLogoSelection = (logoId: string) => {
    setSelectedLogo(logoId);
    setShowModal(true);
  };

  const getUserPreviousVote = (userId: string): UserVote | undefined => {
    return userVotes.find(vote => vote.userId === userId);
  };

  const handleModalSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedLogo && userName.trim()) {
      const trimmedUserName = userName.trim();
      const generatedUserId = trimmedUserName.toLowerCase().replace(/\s+/g, '-');
      setUserId(generatedUserId);
      
      const selectedLogoData = logos.find(logo => logo.value === selectedLogo);
      
      if (selectedLogoData?.ownerId === generatedUserId) {
        alert(t.cannotVoteOwn);
        setShowModal(false);
        setUserName('');
        setSelectedLogo(null);
        const form = document.querySelector('form');
        if (form) form.reset();
        return;
      }

      const previousVote = getUserPreviousVote(generatedUserId);
      
      if (previousVote && previousVote.logoId === selectedLogo) {
        alert(t.alreadyVoted(trimmedUserName, selectedLogo));
        setShowModal(false);
        setUserName('');
        setSelectedLogo(null);
        const form = document.querySelector('form');
        if (form) form.reset();
        return;
      }

      if (previousVote) {
        setVoteCount(prev => ({
          ...prev,
          [previousVote.logoId]: Math.max((prev[previousVote.logoId] || 0) - 1, 0)
        }));
        
        setUserVotes(prev => prev.filter(vote => vote.userId !== generatedUserId));
      }

      const voteData: VoteData = {
        userName: trimmedUserName,
        userId: generatedUserId,
        logoId: selectedLogo,
        timestamp: new Date(),
        ownerId: selectedLogoData?.ownerId
      };

      setVoteCount(prev => ({
        ...prev,
        [selectedLogo]: (prev[selectedLogo] || 0) + 1
      }));

      setUserVotes(prev => [...prev, { userName: trimmedUserName, userId: generatedUserId, logoId: selectedLogo }]);
      setVoteHistory(prev => [...prev, voteData]);

      const message = previousVote 
        ? t.voteChanged(trimmedUserName, previousVote.logoId, selectedLogo)
        : t.voteRecorded(trimmedUserName, selectedLogo);
      
      alert(message);
      setShowModal(false);
      setUserName('');
      setSelectedLogo(null);
      const form = document.querySelector('form');
      if (form) form.reset();
    }
  };

  const logos = [
    { 
      src: '/logos/Logo2.png',
      value: '1', 
      alt: 'Elegant floral logo with intertwined leaves and vines in a circular design',
      ownerId: 'owner123'
    },
    { 
      src: '/logos/Logo3.png',
      value: '2', 
      alt: 'Modern minimalist garden logo with stylized plant elements',
      ownerId: 'owner456'
    },
    { 
      src: '/logos/Logo4.png',
      value: '3', 
      alt: 'Nature-inspired logo featuring delicate leaf patterns',
      ownerId: 'owner789'
    },
    { 
      src: '/logos/Logo1.jpeg',
      value: '4', 
      alt: 'Classic garden design logo with ornate botanical details',
      ownerId: 'owner012'
    }
  ];

  return (
    <main>
      <div className="header">
        <h1>{t.title}</h1>
        <div className="header-buttons">
          <button onClick={toggleLanguage} className="language-toggle">
            {language === 'en' ? 'FR' : 'EN'}
          </button>
          <button onClick={toggleTheme} className="theme-toggle" aria-label={isDarkMode ? t.lightMode : t.darkMode}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      <div className="logo-grid">
        {logos.map((logo) => (
          <div key={logo.value} className="logo-container">
            <div className="logo-image">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={300}
                height={300}
                priority
              />
            </div>
            <div className="vote-section">
              <label>
                <input
                  type="radio"
                  name="logo"
                  value={logo.value}
                  checked={selectedLogo === logo.value}
                  onChange={() => handleLogoSelection(logo.value)}
                />
                {t.selectThis} ({voteCount[logo.value] || 0} {t.votes})
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="vote-history">
        <h2>{t.recentVotes}</h2>
        <div className="vote-list">
          {voteHistory.map((vote, index) => (
            <div key={index} className="vote-item">
              <span className="voter-name">{vote.userName}</span>
              <span className="vote-details">{t.votedFor}{vote.logoId}</span>
              <span className="vote-time">
                {new Date(vote.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{t.enterName}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="input-group">
                <label htmlFor="userName">{t.enterName}</label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  autoFocus
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={() => {
                    setShowModal(false);
                    setUserName('');
                  }}
                >
                  {t.cancel}
                </button>
                <button type="submit" className="modal-button primary">
                  {t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 