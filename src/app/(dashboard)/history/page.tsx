'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { fr } from '@/lib/i18n/fr';
import type { UserProfile, Fridge, ProductHistory } from '@/types';

const categoryIcons: Record<string, string> = {
  dairy: '🥛', meat: '🥩', produce: '🥬', beverages: '🥤',
  grains: '🌾', frozen: '🧊', condiments: '🫙', snacks: '🍿', other: '📦',
};

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return fr.history.today;
  if (isSameDay(date, yesterday)) return fr.history.yesterday;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupByDate(items: ProductHistory[]): { label: string; items: ProductHistory[] }[] {
  const groups: Map<string, ProductHistory[]> = new Map();

  for (const item of items) {
    const label = getDateLabel(item.created_at);
    const existing = groups.get(label);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(label, [item]);
    }
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export default function HistoryPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [history, setHistory] = useState<ProductHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const supabaseRef = useRef(createSupabaseBrowser());
  const supabase = supabaseRef.current;
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/setup'); return; }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('user_id', session.user.id).single();
      if (!profileData) { router.push('/setup'); return; }

      const typedProfile = profileData as UserProfile;
      setProfile(typedProfile);

      const { data: fridgeData } = await supabase
        .from('fridges').select('*').eq('id', typedProfile.fridge_id).single();
      if (fridgeData) setFridge(fridgeData as Fridge);

      setLoading(false);
    };
    load();
  }, [supabase, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!fridge) return;

      const { data } = await supabase
        .from('product_history')
        .select('*')
        .eq('fridge_id', fridge.id)
        .order('created_at', { ascending: false });

      setHistory((data as ProductHistory[]) || []);
      setHistoryLoading(false);
    };
    fetchHistory();
  }, [fridge, supabase]);

  if (loading || !profile || !fridge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grouped = groupByDate(history);

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-primary">
          {fr.profile.back}
        </button>
      </div>

      <h1 className="text-xl font-bold text-foreground mb-1">{fr.history.title}</h1>
      <p className="text-sm text-muted mb-6">{fr.history.archiveDesc}</p>

      {historyLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-muted">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-foreground font-medium mb-1">{fr.history.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {group.label}
              </h2>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                  >
                    {/* Category icon */}
                    <span className="text-lg flex-shrink-0">
                      {categoryIcons[item.product_category] || '📦'}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-muted">
                        {fr.history.on}{' '}
                        {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Action badge */}
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.action === 'consumed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.action === 'consumed' ? fr.history.consumed : fr.history.deleted}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
