import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoteModal from '../VoteModal';

describe('VoteModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    selectedUserId: '',
    onUserSelect: jest.fn(),
    error: null,
    users: [
      { id: 'user1', name: 'John Doe' },
      { id: 'user2', name: 'Jane Smith' }
    ],
    t: {
      selectUser: 'Select who is voting',
      submit: 'Submit Vote',
      cancel: 'Cancel'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<VoteModal {...mockProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Select who is voting' })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<VoteModal {...mockProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays user options in select dropdown', () => {
    render(<VoteModal {...mockProps} />);
    const select = screen.getByTestId('user-select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls onUserSelect when a user is selected', () => {
    render(<VoteModal {...mockProps} />);
    const select = screen.getByTestId('user-select');
    fireEvent.change(select, { target: { value: 'user1' } });
    expect(mockProps.onUserSelect).toHaveBeenCalledWith('user1');
  });

  it('displays error message when error prop is provided', () => {
    const error = 'Please select who is voting';
    render(<VoteModal {...mockProps} error={error} />);
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', () => {
    render(<VoteModal {...mockProps} selectedUserId="user1" />);
    const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
    fireEvent.click(submitButton);
    expect(mockProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<VoteModal {...mockProps} />);
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('disables submit button when no user is selected', () => {
    render(<VoteModal {...mockProps} selectedUserId="" />);
    const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when a user is selected', () => {
    render(<VoteModal {...mockProps} selectedUserId="user1" />);
    const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('has correct ARIA attributes', () => {
    render(<VoteModal {...mockProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    
    const select = screen.getByTestId('user-select');
    expect(select).toHaveAttribute('aria-label', 'Select who is voting');
  });
}); 