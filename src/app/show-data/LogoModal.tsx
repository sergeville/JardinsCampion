import Image from 'next/image';
import styles from './LogoModal.module.css';

interface Logo {
  src: string;
  alt: string;
  title?: string;
  details?: string;
}

interface LogoModalProps {
  logo: Logo;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  showNavigation?: boolean;
}

export default function LogoModal({
  logo,
  onClose,
  onPrev,
  onNext,
  showNavigation = false,
}: LogoModalProps) {
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        {logo.title && <h3 className={styles.title}>{logo.title}</h3>}
        <div className={styles.imageContainer}>
          <Image
            src={logo.src}
            alt={logo.alt}
            className={styles.image}
            width={800}
            height={600}
            priority
          />
          {showNavigation && (
            <>
              {onPrev && (
                <button className={styles.prevButton} onClick={onPrev}>
                  ‹
                </button>
              )}
              {onNext && (
                <button className={styles.nextButton} onClick={onNext}>
                  ›
                </button>
              )}
            </>
          )}
        </div>
        {logo.details && <p className={styles.details}>{logo.details}</p>}
      </div>
    </>
  );
}
