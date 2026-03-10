'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email first');
      return;
    }
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
              MF
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {showReset ? 'Reset password' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {showReset
              ? 'Enter your email and we\'ll send a reset link'
              : 'Log in to your MyFridge account'
            }
          </p>
        </div>

        {resetSent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3 text-primary text-xl">
              ✓
            </div>
            <p className="text-sm text-foreground mb-1">Check your email</p>
            <p className="text-sm text-muted mb-6">We sent a reset link to <strong>{email}</strong></p>
            <Button variant="secondary" onClick={() => { setShowReset(false); setResetSent(false); }} className="w-full">
              Back to login
            </Button>
          </div>
        ) : showReset ? (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Send Reset Link
            </Button>
            <button
              type="button"
              onClick={() => { setShowReset(false); setError(''); }}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Back to login
            </button>
          </form>
        ) : (
          <>
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
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setError(''); }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Log In
              </Button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
