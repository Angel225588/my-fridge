'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import type { ShoppingItem } from '@/types';

export function useShoppingList(fridgeId: string | undefined) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  const fetchItems = useCallback(async () => {
    if (!fridgeId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('fridge_id', fridgeId)
      .order('checked', { ascending: true })
      .order('created_at', { ascending: false });

    setItems((data as ShoppingItem[]) || []);
    setLoading(false);
  }, [fridgeId, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (item: {
    fridge_id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    added_by: string;
  }) => {
    // Check if item already exists (unchecked) — merge by increasing quantity
    const existing = items.find(
      (i) => !i.checked && i.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existing) {
      const { data } = await supabase
        .from('shopping_list')
        .update({ quantity: existing.quantity + item.quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (data) {
        setItems((prev) =>
          prev.map((i) => (i.id === existing.id ? (data as ShoppingItem) : i))
        );
      }
      return;
    }

    const { data } = await supabase
      .from('shopping_list')
      .insert(item)
      .select()
      .single();

    if (data) {
      setItems((prev) => [data as ShoppingItem, ...prev]);
    }
  }, [supabase, items]);

  const toggleChecked = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const { data } = await supabase
      .from('shopping_list')
      .update({ checked: !item.checked })
      .eq('id', itemId)
      .select()
      .single();

    if (data) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? (data as ShoppingItem) : i))
      );
    }
  }, [supabase, items]);

  const removeChecked = useCallback(async () => {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    await supabase
      .from('shopping_list')
      .delete()
      .in('id', checkedIds);

    setItems((prev) => prev.filter((i) => !i.checked));
  }, [supabase, items]);

  const removeItem = useCallback(async (itemId: string) => {
    await supabase.from('shopping_list').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, [supabase]);

  return { items, loading, addItem, toggleChecked, removeChecked, removeItem, refetch: fetchItems };
}
