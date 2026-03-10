'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { generateInviteCode } from '@/lib/utils/inviteCode';
import { fr } from '@/lib/i18n/fr';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type SetupStep = 'name' | 'choose' | 'create' | 'join';

export default function SetupPage() {
  const [step, setStep] = useState<SetupStep>('name');
  const [displayName, setDisplayName] = useState('');
  const [fridgeName, setFridgeName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const checkExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        if (profile) {
          router.push('/dashboard');
        }
      }
    };
    checkExisting();
  }, [supabase, router]);

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          router.push('/dashboard');
          return;
        }
      }

      setLoading(false);
      setStep('choose');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!fridgeName.trim()) return;
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const code = generateInviteCode();
      const { data: fridge, error: fridgeErr } = await supabase
        .from('fridges')
        .insert({ name: fridgeName.trim(), invite_code: code })
        .select()
        .single();

      if (fridgeErr || !fridge) throw new Error(fridgeErr?.message || 'Impossible de créer le frigo');

      const fridgeRow = fridge as { id: string };

      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          fridge_id: fridgeRow.id,
          user_id: user.id,
          name: displayName.trim(),
          role: 'owner',
        });

      if (profileErr) throw new Error(profileErr.message);

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le frigo');
      setLoading(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const { data: fridge, error: findErr } = await supabase
        .from('fridges')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .single();

      if (findErr || !fridge) throw new Error('Code d\'invitation invalide');

      const fridgeRow = fridge as { id: string };

      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          fridge_id: fridgeRow.id,
          user_id: user.id,
          name: displayName.trim(),
          role: 'member',
        });

      if (profileErr) throw new Error(profileErr.message);

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de rejoindre le frigo');
      setLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              MF
            </div>
            <h1 className="text-2xl font-bold text-foreground">{fr.setup.welcome}</h1>
            <p className="text-sm text-muted mt-1">{fr.setup.whatsYourName}</p>
          </div>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
            <Input
              placeholder={fr.setup.namePlaceholder}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
              className="text-center text-lg"
            />
            {error && (
              <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              {fr.setup.continue}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{fr.setup.hey} {displayName} !</h1>
          <p className="text-sm text-muted mb-8">{fr.setup.setupFridge}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep('create')}
              className="w-full p-4 border border-border rounded-xl hover:border-primary/40 hover:bg-primary-light/50 transition-colors text-left group"
            >
              <div className="font-semibold text-foreground group-hover:text-primary">{fr.setup.createNew}</div>
              <p className="text-sm text-muted mt-1">{fr.setup.createNewDesc}</p>
            </button>
            <button
              onClick={() => setStep('join')}
              className="w-full p-4 border border-border rounded-xl hover:border-primary/40 hover:bg-primary-light/50 transition-colors text-left group"
            >
              <div className="font-semibold text-foreground group-hover:text-primary">{fr.setup.joinExisting}</div>
              <p className="text-sm text-muted mt-1">{fr.setup.joinExistingDesc}</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => { setStep('choose'); setError(''); }}
          className="text-sm text-muted hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          {fr.setup.back}
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {step === 'create' ? fr.setup.nameYourFridge : fr.setup.enterCode}
        </h1>

        <form onSubmit={step === 'create' ? handleCreate : handleJoin} className="flex flex-col gap-4">
          {step === 'create' ? (
            <Input
              placeholder={fr.setup.fridgeNamePlaceholder}
              value={fridgeName}
              onChange={(e) => setFridgeName(e.target.value)}
              required
              autoFocus
            />
          ) : (
            <Input
              placeholder={fr.setup.codePlaceholder}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
              autoFocus
              className="text-center text-2xl font-mono tracking-widest"
            />
          )}

          {error && (
            <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {step === 'create' ? fr.setup.createFridge : fr.setup.joinFridge}
          </Button>
        </form>
      </div>
    </div>
  );
}
