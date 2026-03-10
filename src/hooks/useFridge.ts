'use client';

import { useState, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { generateInviteCode } from '@/lib/utils/inviteCode';
import type { Fridge } from '@/types';

export function useFridge() {
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowser();

  const fetchFridge = useCallback(async (fridgeId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('fridges')
      .select('*')
      .eq('id', fridgeId)
      .single();

    setFridge(data as Fridge | null);
    setLoading(false);
    return data;
  }, [supabase]);

  const createFridge = useCallback(async (name: string): Promise<{ data: Fridge | null; error: Error | null }> => {
    setLoading(true);
    const invite_code = generateInviteCode();

    const { data, error } = await supabase
      .from('fridges')
      .insert({ name, invite_code })
      .select()
      .single();

    const fridge = data as Fridge | null;
    if (fridge) setFridge(fridge);
    setLoading(false);
    return { data: fridge, error };
  }, [supabase]);

  const joinFridge = useCallback(async (inviteCode: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fridges')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (data) setFridge(data as Fridge);
    setLoading(false);
    return { data: data as Fridge | null, error };
  }, [supabase]);

  return { fridge, loading, fetchFridge, createFridge, joinFridge };
}
