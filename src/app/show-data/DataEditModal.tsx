'use client';

import { useState } from 'react';
import styles from './styles.module.css';

interface DataEditModalProps {
  data: any;
  type: 'user' | 'logo' | 'vote';
  schema: any;
  onSave: (editedData: any) => Promise<void>;
  onClose: () => void;
}

export default function DataEditModal({ data, type, schema, onSave, onClose }: DataEditModalProps) {
  const [editedData, setEditedData] = useState({ ...data });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(editedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!schema || !schema.paths) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <h2>Error</h2>
          <p>Schema information is not available</p>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        
        <form onSubmit={handleSubmit}>
          {Object.entries(schema.paths)
            .filter(([key]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key))
            .map(([key, field]: [string, any]) => (
              <div key={key} className={styles.formField}>
                <label htmlFor={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </label>
                {field.instance === 'String' ? (
                  <input
                    type="text"
                    id={key}
                    value={editedData[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    required={field.isRequired}
                  />
                ) : field.instance === 'Number' ? (
                  <input
                    type="number"
                    id={key}
                    value={editedData[key] || 0}
                    onChange={e => handleChange(key, Number(e.target.value))}
                    required={field.isRequired}
                  />
                ) : field.instance === 'Boolean' ? (
                  <input
                    type="checkbox"
                    id={key}
                    checked={editedData[key] || false}
                    onChange={e => handleChange(key, e.target.checked)}
                  />
                ) : field.instance === 'Date' ? (
                  <input
                    type="datetime-local"
                    id={key}
                    value={editedData[key] ? new Date(editedData[key]).toISOString().slice(0, 16) : ''}
                    onChange={e => handleChange(key, new Date(e.target.value))}
                    required={field.isRequired}
                  />
                ) : null}
              </div>
            ))}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
