import React, { useState } from 'react';
import { signUp, confirmSignUp } from '@aws-amplify/auth';

interface RegistrationFormProps {}

export const RegistrationForm: React.FC<RegistrationFormProps> = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setApiError(null);
  };

  const validate = () => {
    const errs: { [k: string]: string } = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (!form.confirmPassword) errs.confirmPassword = 'Confirm your password';
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      await signUp({
        username: form.email,
        password: form.password,
        options: {
          userAttributes: { email: form.email },
        },
      });
      setStep('verify');
    } catch (err: any) {
      setApiError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);
    try {
      await confirmSignUp({
        username: form.email,
        confirmationCode: form.code,
      });
      setStep('success');
    } catch (err: any) {
      setApiError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return <div>Account verified! You can now sign in.</div>;
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify}>
        <label htmlFor="code">Enter the verification code</label>
        <input
          id="code"
          name="code"
          type="text"
          value={form.code}
          onChange={handleChange}
          aria-label="Verification code"
        />
        <button type="submit" disabled={loading}>Verify</button>
        {apiError && <div>{apiError}</div>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        aria-label="Email"
      />
      {errors.email && <div>{errors.email}</div>}
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        aria-label="Password"
      />
      {errors.password && <div>{errors.password}</div>}
      <label htmlFor="confirmPassword">Confirm Password</label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        aria-label="Confirm password"
      />
      {errors.confirmPassword && <div>{errors.confirmPassword}</div>}
      <button type="submit" disabled={loading}>Sign Up</button>
      {apiError && <div>{apiError}</div>}
    </form>
  );
};
