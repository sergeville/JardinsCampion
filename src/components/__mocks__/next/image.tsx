import React from 'react';

interface MockImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  onError?: () => void;
  'data-testid'?: string;
}

const MockImage: React.FC<MockImageProps> = ({
  src,
  alt,
  width,
  height,
  style,
  onError,
  'data-testid': dataTestId,
}) => {
  const handleError = React.useCallback(() => {
    onError?.();
  }, [onError]);

  React.useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onerror = handleError;
  }, [src, handleError]);

  return (
    <div
      role="img"
      aria-label={alt}
      style={{
        width,
        height,
        ...style,
        backgroundImage: `url(${src})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      data-testid={dataTestId}
    />
  );
};

export default MockImage;
