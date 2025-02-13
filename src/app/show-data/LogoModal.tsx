import Image from 'next/image';
import styles from './LogoModal.module.css';

interface Logo {
  src: string;
  alt: string;
  value: string;
}

interface LogoModalProps {
  logo: Logo;
  onClose: () => void;
}

export function LogoModal({ logo, onClose }: LogoModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.imageContainer}>
          <Image
            src={logo.src}
            alt={logo.alt}
            width={500}
            height={500}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className={styles.logoInfo}>
          <h3>{logo.value}</h3>
          <p>{logo.alt}</p>
        </div>
      </div>
    </div>
  );
}
