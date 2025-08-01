import { AuthenticationProvider } from '../../../components/auth/AuthenticationProvider';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import * as AuthApi from '@aws-amplify/auth';

jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
}));

jest.mock('@aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  resetPassword: jest.fn(),
  confirmResetPassword: jest.fn(),
  signInWithRedirect: jest.fn(),
}));

const mockUser = { username: 'testuser', attributes: { email: 'test@example.com' } };

describe('AuthenticationProvider', () => {
  const { signIn, signOut, getCurrentUser, resetPassword, confirmResetPassword, signInWithRedirect } = AuthApi as any;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('shows login form when not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('handles login with email and password', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    (signIn as jest.Mock).mockResolvedValue(mockUser);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    fireEvent.change(await screen.findByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith({ username: 'test@example.com', password: 'password123' });
  });

  it('handles social login (Google, Facebook, Apple)', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    const providers = ['Google', 'Facebook', 'Apple'];
    for (const provider of providers) {
      fireEvent.click(await screen.findByRole('button', { name: new RegExp(provider, 'i') }));
      expect(signInWithRedirect).toHaveBeenCalledWith({ provider });
    }
  });

  it('shows error message on failed login', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    (signIn as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    fireEvent.change(await screen.findByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('persists session across reloads', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    // Simulate reload by re-rendering
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalled();
  });

  it('handles logout', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (signOut as jest.Mock).mockResolvedValue(undefined);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
  });

  it('handles password recovery flow', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    (resetPassword as jest.Mock).mockResolvedValue(undefined);
    (confirmResetPassword as jest.Mock).mockResolvedValue(undefined);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: /forgot password/i }));
    fireEvent.change(await screen.findByLabelText(/email/i), { target: { value: 'reset@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    expect(resetPassword).toHaveBeenCalledWith({ username: 'reset@example.com' });

    fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(confirmResetPassword).toHaveBeenCalledWith({ username: 'reset@example.com', confirmationCode: '123456', newPassword: 'newpass123' });
    // After reset, login form should be shown again
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
  });
});
