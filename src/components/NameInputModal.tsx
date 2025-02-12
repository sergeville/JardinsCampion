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
}

const NameInputModal: React.FC<NameInputModalProps> = ({
  isOpen,
  onSubmit,
  onCancel,
  translations: t,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onSubmit(trimmedName);
      setName('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{t.enterName}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name-input">{t.nameLabel}</label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              required
            />
          </div>
          <div className="button-group">
            <button type="submit">{t.submit}</button>
            <button type="button" onClick={onCancel}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NameInputModal;
