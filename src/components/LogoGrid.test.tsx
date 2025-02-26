import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogoGrid } from './LogoGrid';
import type { Logo } from '@/types/vote';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    const { onError, src } = props;

    React.useEffect(() => {
      if (src === '/logo1.png') {
        onError?.();
      }
    }, [src, onError]);

    return (
      <div
        data-testid="mock-image"
        role="img"
        alt={props.alt}
        aria-label={props.alt}
        style={{
          width: props.width,
          height: props.height,
          backgroundImage: `url(${src})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  },
}));

const mockLogos: Logo[] = [
  {
    id: '1',
    alt: 'Logo 1',
    imageUrl: '/logo1.png',
    ownerId: 'owner1',
  },
  {
    id: '2',
    alt: 'Logo 2',
    imageUrl: '/logo2.png',
    ownerId: 'owner2',
  },
  {
    id: '3',
    alt: 'Logo 3',
    imageUrl: '/logo3.png',
    ownerId: 'owner3',
  },
];

const mockTranslations = {
  selectThis: 'Select this logo',
  votes: 'votes',
};

const defaultProps = {
  logos: mockLogos,
  selectedLogo: null,
  onSelectLogo: jest.fn(),
  voteCount: { '1': 5, '2': 1, '3': 3 },
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

    expect(screen.getByText('Select this logo (5 votes)')).toBeInTheDocument();
    expect(screen.getByText('Select this logo (1 votes)')).toBeInTheDocument();
    expect(screen.getByText('Select this logo (3 votes)')).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('alt', 'Logo 1');
    expect(images[1]).toHaveAttribute('alt', 'Logo 2');
    expect(images[2]).toHaveAttribute('alt', 'Logo 3');
  });

  it('handles logo selection', () => {
    render(<LogoGrid {...defaultProps} />);

    const firstLogo = screen.getByRole('radio', { name: /Logo 1 - Select this logo \(5 votes\)/i });
    fireEvent.click(firstLogo);

    expect(defaultProps.onSelectLogo).toHaveBeenCalledWith(mockLogos[0]);
  });

  it('disables interaction when loading', () => {
    render(<LogoGrid {...defaultProps} loading={true} />);

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-busy', 'true');

    const logos = screen.getAllByRole('radio');
    logos.forEach((logo) => {
      expect(logo).toHaveAttribute('tabindex', '-1');
      expect(logo.querySelector('.logo')).toHaveClass('disabled');
    });
  });

  describe('keyboard navigation', () => {
    it('handles basic keyboard navigation', () => {
      render(<LogoGrid {...defaultProps} />);

      const logos = screen.getAllByRole('radio');
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

      // Test Enter key
      fireEvent.keyDown(logos[0], { key: 'Enter' });
      expect(defaultProps.onSelectLogo).toHaveBeenCalledWith(mockLogos[0]);

      defaultProps.onSelectLogo.mockClear();

      // Test Space key
      fireEvent.keyDown(logos[0], { key: ' ' });
      expect(defaultProps.onSelectLogo).toHaveBeenCalledWith(mockLogos[0]);
    });

    it('maintains focus when loading state changes', async () => {
      const { rerender } = render(<LogoGrid {...defaultProps} />);

      // Set initial focus
      const logos = screen.getAllByRole('radio');
      fireEvent.keyDown(logos[0], { key: 'ArrowRight' });

      // Verify focus moved to second logo
      await waitFor(() => {
        const updatedLogos = screen.getAllByRole('radio');
        expect(updatedLogos[1]).toHaveFocus();
      });

      // Simulate loading state change
      rerender(<LogoGrid {...defaultProps} loading={true} />);
      expect(logos[1]).toHaveAttribute('tabindex', '-1');

      // Return to non-loading state
      rerender(<LogoGrid {...defaultProps} loading={false} />);

      // Focus should be restored to the second logo
      await waitFor(() => {
        const updatedLogos = screen.getAllByRole('radio');
        expect(updatedLogos[1]).toHaveFocus();
      });
    });
  });

  it('handles image loading errors', async () => {
    render(<LogoGrid {...defaultProps} />);

    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.error(firstImage);

    await waitFor(() => {
      const updatedImage = screen.getAllByRole('img')[0];
      expect(updatedImage.style.backgroundImage).toBe('url(/placeholder.png)');
    });
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

    expect(screen.getAllByText('Select this logo (0 votes)')).toHaveLength(3);
  });

  it('handles invalid logo data', () => {
    const invalidLogos = [
      { id: '', alt: 'Invalid Logo', imageUrl: '/invalid.png', ownerId: '' },
      ...mockLogos,
    ];

    render(<LogoGrid {...defaultProps} logos={invalidLogos} />);

    const logos = screen.getAllByRole('radio');
    expect(logos).toHaveLength(mockLogos.length + 1);
    expect(logos[0]).toHaveAttribute('aria-label', expect.stringContaining('Invalid Logo'));
    expect(logos[0].querySelector('.logo')).toBeTruthy();
  });

  it('applies correct ARIA attributes', () => {
    render(<LogoGrid {...defaultProps} />);

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-label', 'Select a logo to vote');

    const logos = screen.getAllByRole('radio');
    expect(logos[0]).toHaveAttribute('aria-label', 'Logo 1 - Select this logo (5 votes)');
    expect(logos[1]).toHaveAttribute('aria-label', 'Logo 2 - Select this logo (1 votes)');
    expect(logos[2]).toHaveAttribute('aria-label', 'Logo 3 - Select this logo (3 votes)');
  });
});
