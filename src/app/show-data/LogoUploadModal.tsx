import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import styles from './styles.module.css';
import Image from 'next/image';

interface LogoUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LogoUploadModal({ onClose, onSuccess }: LogoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [alt, setAlt] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.match(/^image\/(jpeg|png|gif|svg\+xml)$/)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or SVG)');
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !name || !alt || !ownerId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('alt', alt);
      formData.append('ownerId', ownerId);

      const response = await fetch('/api/logos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.uploadModal} onClick={(e) => e.stopPropagation()}>
        <h2>Upload Logo</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.uploadArea}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/svg+xml"
              className={styles.fileInput}
            />
            <div className={styles.dropZone}>
              {preview ? (
                <div className={styles.previewContainer}>
                  <Image
                    src={preview}
                    alt="Preview"
                    width={200}
                    height={200}
                    style={{ objectFit: 'contain' }}
                    className={styles.preview}
                  />
                </div>
              ) : (
                <>
                  <p>Drag and drop an image here or click to select</p>
                  <small>Supported formats: JPEG, PNG, GIF, SVG</small>
                  <small>Maximum size: 5MB</small>
                </>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter logo name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="alt">Alt Text:</label>
            <textarea
              id="alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Enter descriptive alt text (min. 10 characters)"
              required
              minLength={10}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ownerId">Owner ID:</label>
            <input
              type="text"
              id="ownerId"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="Enter owner ID"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.uploadButton}
              disabled={loading || !file || !name || !alt || !ownerId}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
