import { useCallback, useState } from 'react';
import Image from 'next/image';
import styles from './LogoGrid.module.css';
import { Logo } from '@/types/vote';
import ErrorMessage from './ErrorMessage';

interface LogoGridProps {
  logos: Logo[];
  selectedLogo: Logo | null;
  voteCount: Record<string, number>;
  loading: boolean;
  onLogoSelect: (logo: Logo) => void;
  t: {
    selectThis: string;
    votes: string;
  };
}

export function LogoGrid({
  logos,
  selectedLogo,
  voteCount,
  loading,
  onLogoSelect,
  t,
}: LogoGridProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const handleLogoClick = useCallback(
    (logo: Logo) => {
      if (!loading) {
        onLogoSelect(logo);
      }
    },
    [loading, onLogoSelect]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, logo: Logo) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleLogoClick(logo);
      }
    },
    [handleLogoClick]
  );

  return (
    <div>
      {errors.length > 0 && (
        <div className={styles.errorContainer}>
          {errors.map((error, index) => (
            <ErrorMessage
              key={index}
              error={error}
              className={styles.error}
              showIcon={true}
              inline={true}
            />
          ))}
        </div>
      )}

      <div className={styles.grid} role="radiogroup" aria-label="Select a logo to vote">
        {logos.map((logo) => {
          const isSelected = selectedLogo?.id === logo.id;
          const votes = voteCount[logo.id] || 0;
          const voteText = `${t.selectThis} (${votes} ${t.votes})`;
          const altText = logo.alt || `Les Jardins du Lac Campion logo ${logo.id}`;

          return (
            <div key={logo.id} className={styles.logoWrapper} aria-hidden={loading}>
              <div
                role="radio"
                aria-checked={isSelected}
                aria-label={`${altText} - ${voteText}`}
                tabIndex={loading ? -1 : 0}
                onClick={() => handleLogoClick(logo)}
                onKeyDown={(e) => handleKeyDown(e, logo)}
                className={`${styles.logo} ${isSelected ? styles.selected : ''}`}
              >
                <Image
                  src={logo.imageUrl}
                  alt={altText}
                  width={300}
                  height={300}
                  priority
                  style={{ objectFit: 'contain', backgroundColor: 'white', padding: '10px' }}
                  onError={() => {
                    const errorMessage = `Failed to load image for Logo #${logo.id}`;
                    if (!errors.includes(errorMessage)) {
                      setErrors((prev) => [...prev, errorMessage]);
                      // Remove the error after 3 seconds
                      setTimeout(() => {
                        setErrors((prev) => prev.filter((e) => e !== errorMessage));
                      }, 3000);
                    }
                  }}
                />
                <div className={styles.voteCount} aria-hidden="true">
                  {`${t.selectThis} (${votes} ${t.votes})`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
