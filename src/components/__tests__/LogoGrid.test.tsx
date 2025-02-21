import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogoGrid } from '../LogoGrid';
import type { Logo } from '@/types/vote';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    const { onError, src } = props;

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
        data-testid="mock-image"
        role="img"
        aria-label={props.alt}
        style={{
          width: props.width,
          height: props.height,
          ...props.style,
          backgroundImage: `url(${src})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  },
}));

// Mock data based on database schema
const mockLogos: Logo[] = [
  {
    id: '1',
    alt: 'Classic garden design logo with ornate botanical details',
    imageUrl: '/logos/Logo1.png',
    ownerId: 'pierre-gagnon',
  },
  {
    id: '2',
    alt: 'Elegant floral logo with intertwined leaves and vines in a circular design',
    imageUrl: '/logos/Logo2.png',
    ownerId: 'marie-dubois',
  },
  {
    id: '3',
    alt: 'Modern minimalist garden logo with stylized plant elements',
    imageUrl: '/logos/Logo3.png',
    ownerId: 'jean-tremblay',
  },
  {
    id: '4',
    alt: 'Nature-inspired logo featuring delicate leaf patterns',
    imageUrl: '/logos/Logo4.png',
    ownerId: 'sophie-laurent',
  },
  {
    id: '5',
    alt: 'Contemporary garden logo with abstract plant motifs',
    imageUrl: '/logos/Logo5.png',
    ownerId: 'marie-dubois',
  },
];

const mockTranslations = {
  selectThis: 'Select this logo',
  votes: 'votes',
};

const mockVoteCount = {
  '1': 5,
  '2': 8,
  '3': 3,
  '4': 6,
  '5': 4,
};

const defaultProps = {
  logos: mockLogos,
  selectedLogo: null,
  onSelectLogo: jest.fn(),
  voteCount: mockVoteCount,
  loading: false,
  error: null,
  t: mockTranslations,
};

describe('LogoGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all logos with correct vote counts', () => {
    render(<LogoGrid {...defaultProps} />);

    mockLogos.forEach((logo, index) => {
      const voteText = `Select this logo (${mockVoteCount[logo.id]} votes)`;
      expect(screen.getByText(voteText)).toBeInTheDocument();

      const image = screen.getAllByRole('img')[index];
      expect(image).toHaveAttribute('alt', logo.alt);
      expect(image).toHaveAttribute('src', logo.imageUrl);
    });
  });

  it('handles logo selection', () => {
    render(<LogoGrid {...defaultProps} />);

    const firstLogo = screen.getByRole('radio', {
      name: new RegExp(`${mockLogos[0].alt} - Select this logo \\(${mockVoteCount['1']} votes\\)`),
    });
    fireEvent.click(firstLogo);

    expect(defaultProps.onSelectLogo).toHaveBeenCalledWith(mockLogos[0]);
  });

  it('disables interaction when loading', () => {
    render(<LogoGrid {...defaultProps} loading={true} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading logos...');
    const logos = screen.queryAllByRole('radio');
    logos.forEach((logo) => {
      expect(logo).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('keyboard navigation', () => {
    it('handles basic keyboard navigation', () => {
      render(<LogoGrid {...defaultProps} />);

      const logos = screen.getAllByRole('radio');
      logos[0].focus();
      expect(logos[0]).toHaveFocus();

      // Test arrow right navigation
      fireEvent.keyDown(logos[0], { key: 'ArrowRight' });
      expect(logos[1]).toHaveFocus();

      // Test arrow left navigation
      fireEvent.keyDown(logos[1], { key: 'ArrowLeft' });
      expect(logos[0]).toHaveFocus();
    });

    it('handles vertical keyboard navigation', () => {
      render(<LogoGrid {...defaultProps} />);

      const logos = screen.getAllByRole('radio');
      logos[0].focus();
      expect(logos[0]).toHaveFocus();

      // Test arrow down navigation
      fireEvent.keyDown(logos[0], { key: 'ArrowDown' });
      expect(logos[1]).toHaveFocus();

      // Test arrow up navigation
      fireEvent.keyDown(logos[1], { key: 'ArrowUp' });
      expect(logos[0]).toHaveFocus();
    });

    it('handles Home and End keys', () => {
      render(<LogoGrid {...defaultProps} />);

      const logos = screen.getAllByRole('radio');
      logos[0].focus();
      expect(logos[0]).toHaveFocus();

      // Test End key
      fireEvent.keyDown(logos[0], { key: 'End' });
      expect(logos[logos.length - 1]).toHaveFocus();

      // Test Home key
      fireEvent.keyDown(logos[logos.length - 1], { key: 'Home' });
      expect(logos[0]).toHaveFocus();
    });

    it('handles Enter and Space for selection', () => {
      render(<LogoGrid {...defaultProps} />);

      const logos = screen.getAllByRole('radio');
      logos[0].focus();
      expect(logos[0]).toHaveFocus();

      // Test Enter key
      fireEvent.keyDown(logos[0], { key: 'Enter' });
      expect(defaultProps.onSelectLogo).toHaveBeenCalledWith(mockLogos[0]);

      defaultProps.onSelectLogo.mockClear();

      // Test Space key
      fireEvent.keyDown(logos[0], { key: ' ' });
      expect(defaultProps.onSelectLogo).toHaveBeenCalledWith(mockLogos[0]);
    });

    it('maintains focus when loading state changes', () => {
      const { rerender } = render(<LogoGrid {...defaultProps} />);

      const logos = screen.getAllByRole('radio');
      logos[1].focus();
      expect(logos[1]).toHaveFocus();

      rerender(<LogoGrid {...defaultProps} loading={true} />);
      rerender(<LogoGrid {...defaultProps} loading={false} />);

      const updatedLogos = screen.getAllByRole('radio');
      updatedLogos[1].focus();
      expect(updatedLogos[1]).toHaveFocus();
    });
  });

  it('handles image loading errors', async () => {
    render(<LogoGrid {...defaultProps} />);

    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.error(firstImage);

    expect(screen.getByText('Error loading image')).toBeInTheDocument();
  });

  it('displays error message and clears it after timeout', async () => {
    jest.useFakeTimers();

    render(<LogoGrid {...defaultProps} error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('handles missing vote counts', () => {
    render(<LogoGrid {...defaultProps} voteCount={{}} />);

    const voteTexts = screen.getAllByText('Select this logo (0 votes)');
    expect(voteTexts).toHaveLength(mockLogos.length);
  });

  it('handles invalid logo data', () => {
    const invalidLogos = [
      { id: '', alt: 'Invalid Logo', imageUrl: '/invalid.png', ownerId: '' },
      ...mockLogos,
    ];

    render(<LogoGrid {...defaultProps} logos={invalidLogos} />);
    expect(screen.getAllByRole('radio')).toHaveLength(mockLogos.length);
  });

  it('applies correct ARIA attributes', () => {
    render(<LogoGrid {...defaultProps} />);

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-label', 'Select a logo to vote');

    mockLogos.forEach((logo, index) => {
      const logoElement = screen.getAllByRole('radio')[index];
      expect(logoElement).toHaveAttribute(
        'aria-label',
        `${logo.alt} - Select this logo (${mockVoteCount[logo.id]} votes)`
      );
    });
  });
});
