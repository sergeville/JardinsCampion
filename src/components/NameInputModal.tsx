import React, { useState } from 'react';
import './NameInputModal.css';

interface NameInputModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  translations: {
    enterName: string;
    nameLabel: string;
    namePlaceholder: string;
    submit: string;
    cancel: string;
  };
  loading?: boolean;
}

const NameInputModal: React.FC<NameInputModalProps> = ({
  isOpen,
  onSubmit,
  onCancel,
  translations: t,
  loading = false,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName && !loading) {
      onSubmit(trimmedName);
      setName('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  return (
    <div className={`modal-overlay ${loading ? 'loading' : ''}`} onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{t.enterName}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name-input">{t.nameLabel}</label>
            <input
              id="name-input"
              type="text"
              data-testid="name-input"
              value={name}
              onChange={(e) => !loading && setName(e.target.value)}
              placeholder={t.namePlaceholder}
              required
              disabled={loading}
              aria-disabled={loading}
            />
          </div>
          <div className="button-group">
            <button type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? 'Submitting...' : t.submit}
            </button>
            <button type="button" onClick={onCancel} disabled={loading} aria-disabled={loading}>
              {t.cancel}
            </button>
          </div>
        </form>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        )}
      </div>
    </div>
  );
};

export default NameInputModal;
