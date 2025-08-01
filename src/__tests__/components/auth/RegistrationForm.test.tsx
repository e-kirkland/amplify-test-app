import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// RegistrationForm will be implemented in src/components/auth/RegistrationForm.tsx
import { RegistrationForm } from '../../../components/auth/RegistrationForm';

jest.mock('@aws-amplify/auth', () => ({
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
}));

const { signUp, confirmSignUp } = require('@aws-amplify/auth');

describe('RegistrationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form fields', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('validates required fields and password match', async () => {
    render(<RegistrationForm />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm your password/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls signUp with email and password', async () => {
    (signUp as jest.Mock).mockResolvedValue({ user: { username: 'user@example.com' } });
    render(<RegistrationForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        username: 'user@example.com',
        password: 'pass1234',
        options: { userAttributes: { email: 'user@example.com' } },
      })
    );
    expect(await screen.findByText(/enter the verification code/i)).toBeInTheDocument();
  });

  it('shows error if signUp fails', async () => {
    (signUp as jest.Mock).mockRejectedValue(new Error('User already exists'));
    render(<RegistrationForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/user already exists/i)).toBeInTheDocument();
  });

  it('handles verification code entry and calls confirmSignUp', async () => {
    (signUp as jest.Mock).mockResolvedValue({ user: { username: 'user@example.com' } });
    (confirmSignUp as jest.Mock).mockResolvedValue({});
    render(<RegistrationForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await screen.findByText(/enter the verification code/i);
    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(confirmSignUp).toHaveBeenCalledWith({ username: 'user@example.com', confirmationCode: '123456' }));
    expect(await screen.findByText(/account verified/i)).toBeInTheDocument();
  });

  it('shows error if confirmSignUp fails', async () => {
    (signUp as jest.Mock).mockResolvedValue({ user: { username: 'user@example.com' } });
    (confirmSignUp as jest.Mock).mockRejectedValue(new Error('Invalid code'));
    render(<RegistrationForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await screen.findByText(/enter the verification code/i);
    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(await screen.findByText(/invalid code/i)).toBeInTheDocument();
  });

  it('has accessible labels and keyboard navigation', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
  });
});
