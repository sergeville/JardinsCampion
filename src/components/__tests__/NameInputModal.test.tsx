import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NameInputModal from '../NameInputModal';

const mockTranslations = {
  enterName: 'Please enter your name:',
  nameLabel: 'Name:',
  namePlaceholder: 'Your name',
  submit: 'Submit Vote',
  cancel: 'Cancel',
};

describe('NameInputModal', () => {
  const mockOnCancel = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders nothing when not open', () => {
    render(
      <NameInputModal
        isOpen={false}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal content when open', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByText('Submit Vote')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles form submission', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    const input = screen.getByLabelText('Name:');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByText('Submit Vote'));

    expect(mockOnSubmit).toHaveBeenCalledWith('John Doe');
  });

  it('prevents submission with empty name', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    fireEvent.click(screen.getByText('Submit Vote'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles overlay click', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('prevents modal content click from closing', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    fireEvent.click(screen.getByRole('dialog'));
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('trims whitespace from input', () => {
    render(
      <NameInputModal
        isOpen={true}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        translations={mockTranslations}
      />
    );

    const input = screen.getByLabelText('Name:');
    fireEvent.change(input, { target: { value: '  John Doe  ' } });
    fireEvent.click(screen.getByText('Submit Vote'));

    expect(mockOnSubmit).toHaveBeenCalledWith('John Doe');
  });
});
