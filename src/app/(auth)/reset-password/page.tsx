'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    // Supabase will auto-detect the recovery token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if already in a session (token already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3 text-primary text-xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Password updated</h1>
          <p className="text-sm text-muted">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Verifying reset link...</p>
          <Link href="/login" className="text-xs text-primary hover:underline mt-4 inline-block">
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
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold mx-auto mb-6">
            MF
          </div>
          <h1 className="text-2xl font-bold text-foreground">New password</h1>
          <p className="text-sm text-muted mt-1">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
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
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
