import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import './LogoGrid.css';

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
}

const LogoGrid: React.FC<LogoGridProps> = ({
  logos,
  selectedLogo,
  voteCount,
  onLogoSelect,
  translations: t,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const basePath = pathname.startsWith('/JardinsCampion') ? '/JardinsCampion' : '';

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
    <div className="logos">
      {logos.map((logo) => (
        <div
          key={logo.value}
          className={`logo-container ${selectedLogo === logo.value ? 'selected' : ''}`}
          onClick={() => onLogoSelect(logo.value)}
          onKeyDown={(e) => handleKeyDown(e, logo.value)}
          tabIndex={0}
          role="button"
          aria-pressed={selectedLogo === logo.value}
        >
          <div className="logo-image">
            {!imageErrors[logo.value] ? (
              <Image
                src={`${basePath}${logo.src}`}
                alt={logo.alt}
                width={200}
                height={200}
                priority={logo.value === '1'}
                className="logo-image"
                onError={() => handleImageError(logo.value)}
              />
            ) : (
              <div className="image-error">Failed to load image</div>
            )}
          </div>
          <div className="vote-section">
            <label onClick={(e) => e.stopPropagation()}>
              <input
                type="radio"
                name="logo"
                value={logo.value}
                checked={selectedLogo === logo.value}
                onChange={() => onLogoSelect(logo.value)}
                aria-label={`${t.selectThis} ${logo.value}`}
              />
              {t.selectThis} ({voteCount[logo.value] || 0} {t.votes})
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LogoGrid;
