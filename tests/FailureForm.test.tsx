import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FailureForm } from '../src/components/FailureForm';

describe('FailureForm', () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    mockOnAdd.mockClear();
  });

  it('renders without crash', () => {
    render(<FailureForm onAdd={mockOnAdd} />);
    expect(screen.getByLabelText(/component/i)).toBeInTheDocument();
  });

  it('shows form fields for component, conditions (key-value), symptoms, and severity', () => {
    render(<FailureForm onAdd={mockOnAdd} />);
    expect(screen.getByLabelText(/component/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/condition name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/condition value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/symptoms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
  });

  it('validates that component and at least one condition are required before submission', async () => {
    const user = userEvent.setup();
    render(<FailureForm onAdd={mockOnAdd} />);

    const submitBtn = screen.getByRole('button', { name: /log failure/i });
    await user.click(submitBtn);

    expect(mockOnAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/component is required/i)).toBeInTheDocument();
  });

  it('shows validation message when submitting with empty required fields', async () => {
    const user = userEvent.setup();
    render(<FailureForm onAdd={mockOnAdd} />);

    const submitBtn = screen.getByRole('button', { name: /log failure/i });
    await user.click(submitBtn);

    expect(screen.getByText(/component is required/i)).toBeInTheDocument();
  });

  it('submits failure and calls onAdd callback with correct structured data', async () => {
    const user = userEvent.setup();
    render(<FailureForm onAdd={mockOnAdd} />);

    // Fill component
    await user.type(screen.getByLabelText(/component/i), 'Power Supply Unit');

    // Fill condition
    await user.type(screen.getByPlaceholderText(/condition name/i), 'Temperature');
    await user.type(screen.getByPlaceholderText(/condition value/i), '95°C');

    // Fill symptoms
    await user.type(screen.getByLabelText(/symptoms/i), 'Output voltage drops below threshold');

    // Select severity
    await user.selectOptions(screen.getByLabelText(/severity/i), 'high');

    // Submit
    await user.click(screen.getByRole('button', { name: /log failure/i }));

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
    const callArgs = mockOnAdd.mock.calls[0][0];
    expect(callArgs.component).toBe('Power Supply Unit');
    expect(callArgs.conditions).toEqual([{ key: 'Temperature', value: '95°C' }]);
    expect(callArgs.symptoms).toBe('Output voltage drops below threshold');
    expect(callArgs.severity).toBe('high');
    expect(callArgs.id).toBeDefined();
    expect(callArgs.timestamp).toBeDefined();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    render(<FailureForm onAdd={mockOnAdd} />);

    await user.type(screen.getByLabelText(/component/i), 'PSU');
    await user.type(screen.getByPlaceholderText(/condition name/i), 'Temp');
    await user.type(screen.getByPlaceholderText(/condition value/i), '90');
    await user.type(screen.getByLabelText(/symptoms/i), 'Failure');
    await user.selectOptions(screen.getByLabelText(/severity/i), 'medium');
    await user.click(screen.getByRole('button', { name: /log failure/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/component/i)).toHaveValue('');
      expect(screen.getByLabelText(/symptoms/i)).toHaveValue('');
    });
  });
});
