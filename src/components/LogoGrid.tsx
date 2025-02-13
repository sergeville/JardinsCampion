import React, { useState } from 'react';
import Image from 'next/image';
import styles from './LogoGrid.module.css';

interface Logo {
  src: string;
  value: string;
  alt: string;
  ownerId?: string;
}

interface LogoGridProps {
  logos: Logo[];
  selectedLogo: string | null;
  voteCount: Record<string, number>;
  onLogoSelect: (logoId: string) => void;
  translations: {
    selectThis: string;
    votes: string;
  };
  loading?: boolean;
}

const LogoGrid: React.FC<LogoGridProps> = ({
  logos,
  selectedLogo,
  voteCount,
  onLogoSelect,
  translations: t,
  loading = false,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleKeyDown = (event: React.KeyboardEvent, logoId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLogoSelect(logoId);
    }
  };

  const handleImageError = (logoId: string) => {
    setImageErrors((prev) => ({ ...prev, [logoId]: true }));
    console.error(`Failed to load image for logo ${logoId}`);
  };

  return (
    <div className={`${styles.logos} ${loading ? styles.loading : ''}`} data-testid="logos-container">
      {logos.map((logo) => (
        <div
          key={logo.value}
          className={`${styles.logoContainer} ${selectedLogo === logo.value ? styles.selected : ''}`}
          onClick={() => !loading && onLogoSelect(logo.value)}
          onKeyDown={(e) => !loading && handleKeyDown(e, logo.value)}
          tabIndex={loading ? -1 : 0}
          role="button"
          aria-pressed={selectedLogo === logo.value}
          aria-disabled={loading}
        >
          <div className={styles.logoImage}>
            {!imageErrors[logo.value] ? (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={200}
                height={200}
                style={{ objectFit: 'contain' }}
                onError={() => handleImageError(logo.value)}
              />
            ) : (
              <div className={styles.imageError}>Failed to load image</div>
            )}
          </div>
          <div className={styles.voteSection}>
            <label onClick={(e) => !loading && e.stopPropagation()}>
              <input
                type="radio"
                name="logo"
                value={logo.value}
                checked={selectedLogo === logo.value}
                onChange={() => !loading && onLogoSelect(logo.value)}
                disabled={loading}
                aria-label={`${t.selectThis} ${logo.value}`}
              />
              {t.selectThis} ({voteCount[logo.value] || 0} {t.votes})
            </label>
          </div>
          {loading && <div className={styles.loadingOverlay} />}
        </div>
      ))}
    </div>
  );
};

export default LogoGrid;
