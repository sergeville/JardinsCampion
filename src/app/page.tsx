'use client'
import React, { useState } from 'react'
import Image from 'next/image'

interface VoteData {
  userName: string;
  logoId: string;
  timestamp: Date;
}

export default function Vote() {
  const [showModal, setShowModal] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});

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

  const handleModalSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedLogo && userName.trim()) {
      const voteData: VoteData = {
        userName: userName.trim(),
        logoId: selectedLogo,
        timestamp: new Date()
      };

      // Update vote count
      setVoteCount(prev => ({
        ...prev,
        [selectedLogo]: (prev[selectedLogo] || 0) + 1
      }));

      // You could send voteData to an API here
      console.log('Vote submitted:', voteData);
      
      alert(`Thank you ${userName}! Your vote for logo #${selectedLogo} has been recorded.`);
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