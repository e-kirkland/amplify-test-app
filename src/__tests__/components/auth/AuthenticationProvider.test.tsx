
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthenticationProvider } from '../../../components/auth/AuthenticationProvider';
import * as AuthModule from 'aws-amplify';

jest.mock('aws-amplify', () => ({
  Auth: {
    signIn: jest.fn(),
    federatedSignIn: jest.fn(),
    currentAuthenticatedUser: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    forgotPasswordSubmit: jest.fn(),
  },
}));

const mockUser = { username: 'testuser', attributes: { email: 'test@example.com' } };

describe('AuthenticationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when authenticated', async () => {
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('shows login form when not authenticated', async () => {
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
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
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    (AuthModule.Auth.signIn as jest.Mock).mockResolvedValue(mockUser);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    fireEvent.change(await screen.findByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(AuthModule.Auth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('handles social login (Google, Facebook, Apple)', async () => {
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    const providers = ['Google', 'Facebook', 'Apple'];
    for (const provider of providers) {
      fireEvent.click(await screen.findByRole('button', { name: new RegExp(provider, 'i') }));
      expect(AuthModule.Auth.federatedSignIn).toHaveBeenCalledWith({ provider });
    }
  });

  it('shows error message on failed login', async () => {
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    (AuthModule.Auth.signIn as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
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
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
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
    expect(AuthModule.Auth.currentAuthenticatedUser).toHaveBeenCalled();
  });

  it('handles logout', async () => {
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
    (AuthModule.Auth.signOut as jest.Mock).mockResolvedValue(undefined);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    await waitFor(() => expect(AuthModule.Auth.signOut).toHaveBeenCalled());
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
  });

  it('handles password recovery flow', async () => {
    (AuthModule.Auth.currentAuthenticatedUser as jest.Mock).mockRejectedValue(new Error('Not signed in'));
    (AuthModule.Auth.forgotPassword as jest.Mock).mockResolvedValue(undefined);
    (AuthModule.Auth.forgotPasswordSubmit as jest.Mock).mockResolvedValue(undefined);
    render(
      <AuthenticationProvider>
        <div>Protected Content</div>
      </AuthenticationProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: /forgot password/i }));
    fireEvent.change(await screen.findByLabelText(/email/i), { target: { value: 'reset@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    expect(AuthModule.Auth.forgotPassword).toHaveBeenCalledWith('reset@example.com');

    fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(AuthModule.Auth.forgotPasswordSubmit).toHaveBeenCalledWith('reset@example.com', '123456', 'newpass123');
    // After reset, login form should be shown again
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
  });
});
