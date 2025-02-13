import React, { useEffect, useState } from 'react';
import styles from './TempMessage.module.css';

interface TempMessageProps {
  message: string;
  duration?: number; // Duration in milliseconds
  onClose?: () => void;
}

const TempMessage: React.FC<TempMessageProps> = ({
  message,
  duration = 15000, // Default 15 seconds
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={styles.messageContainer}>
      <div className={styles.message}>{message}</div>
    </div>
  );
};

export default TempMessage;
