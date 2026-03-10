'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    setProfile(data as UserProfile | null);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const createProfile = useCallback(async (fridgeId: string, name: string, role: 'owner' | 'member' = 'member') => {
    if (!userId) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .insert({ fridge_id: fridgeId, user_id: userId, name, role })
      .select()
      .single();

    if (data) setProfile(data as UserProfile);
    return { data, error };
  }, [userId, supabase]);

  return { profile, loading, createProfile, refetch: fetchProfile };
}
