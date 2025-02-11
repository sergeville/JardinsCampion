'use client'
import React, { useState } from 'react'
import Image from 'next/image'

interface VoteData {
  userName: string;
  logoId: string;
  timestamp: Date;
}

interface UserVote {
  userName: string;
  logoId: string;
}

export default function Vote() {
  const [showModal, setShowModal] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [voteHistory, setVoteHistory] = useState<VoteData[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const logoId = formData.get('logo-selection') as string;
    if (logoId) {
      setSelectedLogo(logoId);
      setShowModal(true);
    }
  };

  const getUserPreviousVote = (userName: string): UserVote | undefined => {
    return userVotes.find(vote => vote.userName.toLowerCase() === userName.toLowerCase());
  };

  const handleModalSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedLogo && userName.trim()) {
      const trimmedUserName = userName.trim();
      const previousVote = getUserPreviousVote(trimmedUserName);
      
      // If user has already voted for this same logo, prevent duplicate vote
      if (previousVote && previousVote.logoId === selectedLogo) {
        alert(`${trimmedUserName}, you have already voted for Logo #${selectedLogo}!`);
        setShowModal(false);
        setUserName('');
        setSelectedLogo(null);
        const form = document.querySelector('form');
        if (form) form.reset();
        return;
      }

      // If user is changing their vote
      if (previousVote) {
        // Decrement the previous logo's vote count
        setVoteCount(prev => ({
          ...prev,
          [previousVote.logoId]: Math.max((prev[previousVote.logoId] || 0) - 1, 0)
        }));
        
        // Remove the previous vote from userVotes
        setUserVotes(prev => prev.filter(vote => 
          vote.userName.toLowerCase() !== trimmedUserName.toLowerCase()
        ));
      }

      const voteData: VoteData = {
        userName: trimmedUserName,
        logoId: selectedLogo,
        timestamp: new Date()
      };

      // Update vote count for the new selection
      setVoteCount(prev => ({
        ...prev,
        [selectedLogo]: (prev[selectedLogo] || 0) + 1
      }));

      // Track user's new vote
      setUserVotes(prev => [...prev, { userName: trimmedUserName, logoId: selectedLogo }]);

      // Add vote to history
      setVoteHistory(prev => [...prev, voteData]);

      console.log('Vote submitted:', voteData);
      
      const message = previousVote 
        ? `Thank you ${trimmedUserName}! Your vote has been changed from Logo #${previousVote.logoId} to Logo #${selectedLogo}.`
        : `Thank you ${trimmedUserName}! Your vote for Logo #${selectedLogo} has been recorded.`;
      
      alert(message);
      setShowModal(false);
      setUserName('');
      setSelectedLogo(null);
      const form = document.querySelector('form');
      if (form) form.reset();
    }
  };

  return (
    <main>
      <h1>Choose Your Favorite Logo Design</h1>
      <form onSubmit={handleSubmit}>
        <div className="card-container">
          {[
            { src: '/logos/Logo2.png', value: '1', alt: 'Elegant floral logo with intertwined leaves and vines in a circular design' },
            { src: '/logos/Logo3.png', value: '2', alt: 'Modern minimalist garden logo with stylized plant elements' },
            { src: '/logos/Logo4.png', value: '3', alt: 'Nature-inspired logo featuring delicate leaf patterns' },
            { src: '/logos/Logo1.jpeg', value: '4', alt: 'Classic garden design logo with ornate botanical details' }
          ].map((logo) => (
            <label key={logo.value} className="card">
              <div className="logo">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={250}
                  height={250}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className="radio-container">
                <input type="radio" name="logo-selection" value={logo.value} required />
                <span>Select this (Votes: {voteCount[logo.value] || 0})</span>
              </div>
            </label>
          ))}
        </div>
        <button type="submit" className="submit-button">Submit Vote</button>
      </form>

      {/* Vote History Section */}
      <div className="vote-history">
        <h2>Recent Votes</h2>
        <div className="vote-list">
          {voteHistory.map((vote, index) => (
            <div key={index} className="vote-item">
              <span className="voter-name">{vote.userName}</span>
              <span className="vote-details">voted for Logo #{vote.logoId}</span>
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
            <h2>Almost Done!</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="input-group">
                <label htmlFor="userName">Please enter your name:</label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Your name"
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
                  Cancel
                </button>
                <button type="submit" className="modal-button primary">
                  Submit Vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 