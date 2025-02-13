import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LogoGrid from '../LogoGrid';

const mockLogos = [
  {
    src: '/test/logo1.png',
    value: '1',
    alt: 'Test Logo 1',
    ownerId: 'owner1',
  },
  {
    src: '/test/logo2.png',
    value: '2',
    alt: 'Test Logo 2',
    ownerId: 'owner2',
  },
];

const mockTranslations = {
  selectThis: 'Select this',
  votes: 'Votes',
};

describe('LogoGrid', () => {
  const mockOnLogoSelect = jest.fn();

  beforeEach(() => {
    mockOnLogoSelect.mockClear();
  });

  it('renders all logos', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        selectedLogo={null}
        voteCount={{}}
        onLogoSelect={mockOnLogoSelect}
        translations={mockTranslations}
      />
    );

    mockLogos.forEach((logo) => {
      expect(screen.getByAltText(logo.alt)).toBeInTheDocument();
    });
  });

  it('shows correct vote counts', () => {
    const voteCount = { '1': 5, '2': 3 };
    render(
      <LogoGrid
        logos={mockLogos}
        selectedLogo={null}
        voteCount={voteCount}
        onLogoSelect={mockOnLogoSelect}
        translations={mockTranslations}
      />
    );

    expect(screen.getByText(`Select this (5 Votes)`)).toBeInTheDocument();
    expect(screen.getByText(`Select this (3 Votes)`)).toBeInTheDocument();
  });

  it('handles logo selection', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        selectedLogo="1"
        voteCount={{}}
        onLogoSelect={mockOnLogoSelect}
        translations={mockTranslations}
      />
    );

    const logoContainer = screen.getByRole('button', { name: /Test Logo 2/ });
    fireEvent.click(logoContainer);
    expect(mockOnLogoSelect).toHaveBeenCalledWith('2');
  });

  it('supports keyboard navigation', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        selectedLogo={null}
        voteCount={{}}
        onLogoSelect={mockOnLogoSelect}
        translations={mockTranslations}
      />
    );

    const logoContainer = screen.getByRole('button', { name: /Test Logo 1/ });
    fireEvent.keyDown(logoContainer, { key: 'Enter', code: 'Enter' });
    expect(mockOnLogoSelect).toHaveBeenCalledWith('1');

    mockOnLogoSelect.mockClear();
    fireEvent.keyDown(logoContainer, { key: ' ', code: 'Space' });
    expect(mockOnLogoSelect).toHaveBeenCalledWith('1');
  });

  it('marks selected logo as checked', () => {
    render(
      <LogoGrid
        logos={mockLogos}
        selectedLogo="1"
        voteCount={{}}
        onLogoSelect={mockOnLogoSelect}
        translations={mockTranslations}
      />
    );

    const radioInputs = screen.getAllByRole('radio');
    expect(radioInputs[0]).toBeChecked();
    expect(radioInputs[1]).not.toBeChecked();
  });
});
