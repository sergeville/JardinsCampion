import React from 'react';
import styles from './VoteModal.module.css';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
  error?: string | null;
  users: Array<{ id: string; name: string }>;
  t: {
    selectUser: string;
    submit: string;
    cancel: string;
  };
}

const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedUserId,
  onUserSelect,
  error,
  users,
  t,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">{t.selectUser}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <select
              value={selectedUserId}
              onChange={(e) => onUserSelect(e.target.value)}
              className={styles.select}
              data-testid="user-select"
              aria-label={t.selectUser}
            >
              <option value="">{t.selectUser}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <div className={styles.buttonContainer}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              {t.cancel}
            </button>
            <button type="submit" className={styles.submitButton} disabled={!selectedUserId}>
              {t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoteModal;
