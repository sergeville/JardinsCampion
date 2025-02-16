import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { ILogo } from '@/models/Logo';
import { IVote } from '@/models/Vote';
import { IUser } from '@/models/User';
import { Document } from 'mongoose';

type EditableData = Partial<ILogo | IVote | IUser>;
type FormData = Record<string, any>;

interface DataEditModalProps {
  data: EditableData;
  type: 'users' | 'votes' | 'logos' | null;
  onClose: () => void;
  onSave: (updatedData: EditableData) => void;
}

const DataEditModal: React.FC<DataEditModalProps> = ({ data, type, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>(() => {
    const plainData = JSON.parse(JSON.stringify(data));
    return plainData;
  });

  useEffect(() => {
    const plainData = JSON.parse(JSON.stringify(data));
    setFormData(plainData);
  }, [data]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: FormData) => ({ ...prev, [key]: value }));
  };

  const renderField = (key: string, value: any) => {
    // Skip internal fields
    if (key === '_id' || key === '__v' || key === 'createdAt') {
      return null;
    }

    // Handle different field types
    if (key === 'status') {
      const options =
        type === 'votes'
          ? ['confirmed', 'rejected']
          : type === 'logos'
            ? ['active', 'inactive']
            : ['active', 'inactive'];

      return (
        <div key={key} className={styles.formField}>
          <label>{key}:</label>
          <select value={value} onChange={(e) => handleChange(key, e.target.value)}>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Handle date fields
    if (key === 'timestamp') {
      return (
        <div key={key} className={styles.formField}>
          <label>{key}:</label>
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(key, new Date(e.target.value))}
          />
        </div>
      );
    }

    // Default text input
    return (
      <div key={key} className={styles.formField}>
        <label>{key}:</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
        />
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Edit {type}</h2>
        <form onSubmit={handleSubmit}>
          {Object.entries(formData).map(([key, value]) => renderField(key, value))}
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>
              Save
            </button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataEditModal;
