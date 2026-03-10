'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { fr } from '@/lib/i18n/fr';
import { useShoppingList } from '@/hooks/useShoppingList';
import CameraCapture from '@/components/features/CameraCapture';
import CommandBar from '@/components/features/CommandBar';
import Button from '@/components/ui/Button';
import type { UserProfile, Fridge } from '@/types';

const categoryIcons: Record<string, string> = {
  dairy: '🥛', meat: '🥩', produce: '🥬', beverages: '🥤',
  grains: '🌾', frozen: '🧊', condiments: '🫙', snacks: '🍿', other: '📦',
};

type AddMode = null | 'camera' | 'gallery' | 'ai';

export default function ShoppingListPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [addMode, setAddMode] = useState<AddMode>(null);

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

  const { items, loading: listLoading, addItem, toggleChecked, removeChecked, removeItem, refetch } = useShoppingList(fridge?.id);

  const checkedCount = items.filter((i) => i.checked).length;

  // Manual add
  const handleAddItem = async () => {
    const name = newItemName.trim();
    if (!name || !fridge || !profile) return;
    await addItem({
      fridge_id: fridge.id,
      name,
      quantity: 1,
      unit: 'pcs',
      category: 'other',
      added_by: profile.id,
    });
    setNewItemName('');
  };

  // Camera scan → add to shopping list
  const handleItemsScanned = useCallback(async (
    scannedItems: { name: string; quantity: number; unit: string; category: string }[],
    _imageFile: File,
    _scanType: string
  ) => {
    if (!fridge || !profile) return;
    for (const item of scannedItems) {
      await addItem({
        fridge_id: fridge.id,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        category: item.category || 'other',
        added_by: profile.id,
      });
    }
  }, [fridge, profile, addItem]);

  // AI command → add to shopping list
  const handleCommand = useCallback(async (command: string): Promise<string> => {
    const res = await fetch('/api/ai/shopping-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, fridge_id: fridge?.id, profile_id: profile?.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    await refetch();
    return data.message;
  }, [fridge?.id, profile?.id, refetch]);

  const handleDoneMode = () => {
    setAddMode(null);
    refetch();
  };

  if (loading || !profile || !fridge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Full-screen camera mode
  if (addMode === 'camera' || addMode === 'gallery') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <button onClick={handleDoneMode} className="text-sm text-primary">
            {fr.profile.back}
          </button>
          <h1 className="text-lg font-semibold text-foreground">{fr.shopping.title}</h1>
          <div className="w-12" />
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 pt-4 min-h-0">
            <CameraCapture
              onItemsAdded={handleItemsScanned}
              onClose={handleDoneMode}
              existingProducts={items.map((i) => i.name)}
              autoOpenCamera={addMode === 'camera'}
              autoOpenGallery={addMode === 'gallery'}
            />
          </div>
          <div className="px-4 pt-3 pb-4 border-t border-border bg-background flex-shrink-0">
            <button
              onClick={handleDoneMode}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform duration-100"
            >
              {fr.shopping.done}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen AI mode
  if (addMode === 'ai') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <button onClick={handleDoneMode} className="text-sm text-primary">
            {fr.profile.back}
          </button>
          <h1 className="text-lg font-semibold text-foreground">{fr.shopping.title}</h1>
          <div className="w-12" />
        </div>
        <div className="flex-1 flex flex-col px-4 py-4">
          <div className="flex-1 flex flex-col justify-end">
            <div className="mb-4">
              <p className="text-sm text-muted text-center mb-6">
                {fr.shopping.aiDesc}
              </p>
              <CommandBar onCommand={handleCommand} />
            </div>
          </div>
          <div className="pt-4 pb-2">
            <button
              onClick={handleDoneMode}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform"
            >
              {fr.shopping.done}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-primary">
          {fr.profile.back}
        </button>
        {checkedCount > 0 && (
          <button onClick={removeChecked} className="text-xs text-danger hover:underline">
            {fr.shopping.removeAll} ({checkedCount})
          </button>
        )}
      </div>

      <h1 className="text-xl font-bold text-foreground mb-4">{fr.shopping.title}</h1>

      {/* Add item input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleAddItem(); }}
        className="flex gap-2 mb-3"
      >
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={fr.shopping.addPlaceholder}
          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-input-bg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
        <button
          type="submit"
          disabled={!newItemName.trim()}
          className="px-4 py-2.5 bg-primary text-white font-medium rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform duration-100"
        >
          {fr.shopping.add}
        </button>
      </form>

      {/* Smart add buttons: Camera + AI */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAddMode('camera')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 active:scale-[0.98] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {fr.shopping.camera}
        </button>
        <button
          onClick={() => setAddMode('ai')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 active:scale-[0.98] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-500">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {fr.shopping.ai}
        </button>
      </div>

      {listLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-foreground font-medium mb-1">{fr.shopping.empty}</p>
          <p className="text-sm text-muted">{fr.shopping.emptyDesc}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                item.checked
                  ? 'border-border bg-input-bg opacity-60'
                  : 'border-border bg-card'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleChecked(item.id)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.checked
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-border hover:border-primary'
                }`}
              >
                {item.checked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Icon */}
              <span className="text-lg flex-shrink-0">
                {categoryIcons[item.category] || '📦'}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.checked ? 'line-through text-muted' : 'text-foreground'}`}>
                  {item.name}
                </p>
                <p className="text-xs text-muted">
                  {item.quantity} {item.unit}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-muted hover:text-danger transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
