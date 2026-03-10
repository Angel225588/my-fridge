'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import type { Product, CreateProductInput, UpdateProductInput } from '@/types';

/**
 * Normalize a product name for duplicate comparison.
 * Lowercases, trims, removes accents, removes common filler words.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, ' ');
}

function isSimilarName(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  // One contains the other (e.g. "Lait" matches "Lait entier")
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

export function useProducts(fridgeId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  // Keep a ref to the latest products for duplicate detection in loops
  const productsRef = useRef<Product[]>(products);
  productsRef.current = products;

  const fetchProducts = useCallback(async () => {
    if (!fridgeId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('fridge_id', fridgeId)
      .order('expiration_date', { ascending: true, nullsFirst: false });

    setProducts((data as Product[]) || []);
    setLoading(false);
  }, [fridgeId, supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (input: CreateProductInput, addedBy: string): Promise<{ data: Product | null; error: unknown; merged?: boolean }> => {
    // Use ref for fresh state (avoids stale closure when called in a loop)
    const currentProducts = productsRef.current;
    const existing = currentProducts.find(
      (p) => isSimilarName(p.name, input.name) && p.fridge_id === input.fridge_id
    );

    if (existing) {
      // Merge: increase quantity, update expiration if the new one is later
      const newQty = existing.quantity + (input.quantity ?? 1);
      const updates: Record<string, unknown> = { quantity: newQty };

      // If new item has a later expiration date, update it
      if (input.expiration_date && (!existing.expiration_date || input.expiration_date > existing.expiration_date)) {
        updates.expiration_date = input.expiration_date;
      }

      // If existing has no image but new one does, add it
      if (!existing.image_url && input.image_url) {
        updates.image_url = input.image_url;
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === existing.id ? (data as Product) : p))
        );
      }
      return { data: data as Product | null, error, merged: true };
    }

    // New product
    const { data, error } = await supabase
      .from('products')
      .insert({
        fridge_id: input.fridge_id,
        name: input.name,
        quantity: input.quantity ?? 1,
        unit: input.unit ?? 'pcs',
        category: input.category ?? 'other',
        expiration_date: input.expiration_date ?? null,
        purchase_date: input.purchase_date ?? new Date().toISOString().split('T')[0],
        added_by: addedBy,
        location: input.location ?? 'fridge',
        image_url: input.image_url ?? null,
        price: input.price ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (data) {
      setProducts((prev) => [...prev, data as Product]);
    }
    return { data: data as Product | null, error, merged: false };
  }, [supabase]);

  const updateProduct = useCallback(async (productId: string, updates: UpdateProductInput) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (data) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? (data as Product) : p))
      );
    }
    return { data, error };
  }, [supabase]);

  const deleteProduct = useCallback(async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
    return { error };
  }, [supabase]);

  // Get product by ID (for consumed/deleted flows)
  const getProduct = useCallback((productId: string): Product | undefined => {
    return products.find((p) => p.id === productId);
  }, [products]);

  return { products, loading, addProduct, updateProduct, deleteProduct, getProduct, refetch: fetchProducts };
}
