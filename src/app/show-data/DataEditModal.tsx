import { useState } from 'react';
import styles from './DataEditModal.module.css';
import { DatabaseDocument, DatabaseEditModalProps } from '@/types/database';

export function DataEditModal({
  isOpen,
  onClose,
  mode,
  collectionName,
  initialData,
  onSave,
}: DatabaseEditModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(
    initialData ? { ...initialData } : {}
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2>
          {mode === 'add' ? 'Add New' : 'Edit'} {collectionName}
        </h2>
        <form onSubmit={handleSubmit}>
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className={styles.formGroup}>
              <label htmlFor={key}>{key}</label>
              <input
                type="text"
                id={key}
                value={String(value)}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={loading}
              />
            </div>
          ))}
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
