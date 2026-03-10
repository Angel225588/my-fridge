'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { data, error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data?.user?.identities?.length === 0) {
      setError('An account with this email already exists.');
      setLoading(false);
    } else if (data?.user && !data?.session) {
      // Email confirmation required
      setConfirmationSent(true);
      setLoading(false);
    } else {
      router.push('/setup');
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4 text-primary text-xl">
            ✉
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted mb-6">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
            <br />Click the link to activate your account.
          </p>
          <Link href="/login" className="text-sm text-primary font-medium hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
              MF
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted mt-1">Start tracking your food inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
