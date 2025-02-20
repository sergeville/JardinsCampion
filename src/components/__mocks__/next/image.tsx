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
  React.useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onerror = () => {
      onError?.();
    };
  }, [src, onError]);

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width,
        height,
        ...style,
        objectFit: 'contain',
      }}
      data-testid={dataTestId}
      onError={() => onError?.()}
    />
  );
};

export default MockImage; 