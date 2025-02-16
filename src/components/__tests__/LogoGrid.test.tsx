import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogoGrid } from '../LogoGrid';
import { Logo } from '@/types/vote';
import type { ImageProps } from 'next/image';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: ImageProps) {
    return <div data-testid="mock-image" {...props} />;
  },
}));

const mockLogos: Logo[] = [
  {
    id: '1',
    name: 'Logo 1',
    imageUrl: '/logo1.png',
  },
  {
    id: '2',
    name: 'Logo 2',
    imageUrl: '/logo2.png',
  },
];

const mockVoteCount: Record<string, number> = {
  '1': 5,
  '2': 10,
};

const mockTranslations = {
  selectThis: 'Select this logo',
  votes: 'votes',
};

describe('LogoGrid', () => {
  const mockOnLogoSelect = jest.fn();

  beforeEach(() => {
    mockOnLogoSelect.mockClear();
  });

  it('renders all logos with correct vote counts', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        voteCount={mockVoteCount}
        selectedLogo={null}
        onLogoSelect={mockOnLogoSelect}
        loading={false}
        t={mockTranslations}
      />
    );

    mockLogos.forEach((logo) => {
      const image = screen.getByTestId('logo-image');
      expect(image).toHaveAttribute('src', logo.imageUrl);
      expect(image).toHaveAttribute('alt', logo.name);
      expect(
        screen.getByText(
          `${mockTranslations.selectThis} (${mockVoteCount[logo.id]} ${mockTranslations.votes})`
        )
      ).toBeInTheDocument();
    });
  });

  it('handles logo selection correctly', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        voteCount={mockVoteCount}
        selectedLogo={null}
        onLogoSelect={mockOnLogoSelect}
        loading={false}
        t={mockTranslations}
      />
    );

    const firstLogo = screen.getByRole('radio', { name: new RegExp(mockLogos[0].name, 'i') });
    fireEvent.click(firstLogo);
    expect(mockOnLogoSelect).toHaveBeenCalledWith(mockLogos[0]);
  });

  it('disables interaction when loading', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        voteCount={mockVoteCount}
        selectedLogo={null}
        onLogoSelect={mockOnLogoSelect}
        loading={true}
        t={mockTranslations}
      />
    );

    const logos = screen.getAllByRole('radio');
    logos.forEach((logo) => {
      fireEvent.click(logo);
      expect(mockOnLogoSelect).not.toHaveBeenCalled();
    });
  });

  it('handles keyboard navigation', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        voteCount={mockVoteCount}
        selectedLogo={null}
        onLogoSelect={mockOnLogoSelect}
        loading={false}
        t={mockTranslations}
      />
    );

    const firstLogo = screen.getAllByRole('radio')[0];
    firstLogo.focus();
    fireEvent.keyDown(firstLogo, { key: 'Enter' });
    expect(mockOnLogoSelect).toHaveBeenCalledWith(mockLogos[0]);

    mockOnLogoSelect.mockClear();
    fireEvent.keyDown(firstLogo, { key: ' ' });
    expect(mockOnLogoSelect).toHaveBeenCalledWith(mockLogos[0]);
  });

  it('shows selected logo correctly', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        voteCount={mockVoteCount}
        selectedLogo={mockLogos[0]}
        onLogoSelect={mockOnLogoSelect}
        loading={false}
        t={mockTranslations}
      />
    );

    const selectedLogo = screen.getByRole('radio', { checked: true });
    expect(selectedLogo).toHaveAttribute('aria-checked', 'true');
  });
});
