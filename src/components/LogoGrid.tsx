import React, { useEffect, useState, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import styles from './LogoGrid.module.css';
import type { Logo } from '@/types/vote';

interface LogoGridProps {
  logos: Logo[];
  selectedLogo: Logo | null;
  onSelectLogo: (logo: Logo) => void;
  voteCount: Record<string, number>;
  loading?: boolean;
  error?: string | null;
  t: {
    selectThis: string;
    votes: string;
  };
}

export const LogoGrid: React.FC<LogoGridProps> = ({
  logos,
  selectedLogo,
  onSelectLogo,
  voteCount,
  loading = false,
  error = null,
  t,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleImageError = (logoId: string) => {
    setImageErrors((prev) => ({ ...prev, [logoId]: true }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (loading) return;

    const validLogos = logos.filter((logo) => logo.id);
    const maxIndex = validLogos.length - 1;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((prev) => Math.min(prev + 1, maxIndex));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusIndex(maxIndex);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelectLogo(validLogos[index]);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const gridElement = gridRef.current;
    if (gridElement) {
      const focusableElements = gridElement.querySelectorAll('[role="radio"]');
      const elementToFocus = focusableElements[focusIndex] as HTMLElement;
      elementToFocus?.focus();
    }
  }, [focusIndex, loading]);

  const validLogos = logos.filter((logo) => logo.id);

  return (
    <div
      ref={gridRef}
      role="radiogroup"
      aria-label="Select a logo to vote"
      className={styles.grid}
      aria-busy={loading}
    >
      {logos.map((logo, index) => (
        <div
          key={logo.id}
          role="radio"
          aria-checked={selectedLogo?.id === logo.id}
          tabIndex={loading ? -1 : index === focusIndex ? 0 : -1}
          className={`${styles.logoWrapper} ${selectedLogo?.id === logo.id ? styles.selected : ''}`}
          onClick={() => !loading && onSelectLogo(logo)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          aria-label={`${logo.alt} - ${t.selectThis} (${voteCount[logo.id] || 0} ${t.votes})`}
        >
          <div className={`${styles.logo} ${loading ? styles.disabled : ''}`}>
            <Image
              src={imageErrors[logo.id] ? '/placeholder.png' : logo.imageUrl}
              alt={logo.alt}
              width={300}
              height={300}
              onError={() => handleImageError(logo.id)}
            />
            <div className={styles.voteCount}>
              {t.selectThis} ({voteCount[logo.id] || 0} {t.votes})
            </div>
          </div>
        </div>
      ))}
      {errorMessage && (
        <div className={styles.error} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
