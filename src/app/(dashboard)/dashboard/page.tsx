'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { fr } from '@/lib/i18n/fr';
import { useProducts } from '@/hooks/useProducts';
import { useShoppingList } from '@/hooks/useShoppingList';
import FridgeHeader from '@/components/features/FridgeHeader';
import ProductList from '@/components/features/ProductList';
import Button from '@/components/ui/Button';
import type { Product, UserProfile, Fridge } from '@/types';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseRef = useRef(createSupabaseBrowser());
  const supabase = supabaseRef.current;
  const router = useRouter();

  const { products, loading: productsLoading, deleteProduct, getProduct, refetch } = useProducts(fridge?.id);
  const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList(fridge?.id);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/setup');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData) {
        router.push('/setup');
        return;
      }

      const typedProfile = profileData as UserProfile;
      setProfile(typedProfile);

      const { data: fridgeData } = await supabase
        .from('fridges')
        .select('*')
        .eq('id', typedProfile.fridge_id)
        .single();

      if (fridgeData) {
        setFridge(fridgeData as Fridge);
      }

      setLoading(false);
    };

    load();
  }, [supabase, router]);

  // Log action to product_history
  const logHistory = useCallback(async (product: Product, action: 'consumed' | 'deleted') => {
    if (!profile) return;
    await supabase.from('product_history').insert({
      fridge_id: product.fridge_id,
      product_name: product.name,
      product_category: product.category,
      action,
      acted_by: profile.id,
    });
  }, [supabase, profile]);

  // Swipe LEFT = delete (expired/bad) → log to history
  const handleDeleteProduct = useCallback(async (productId: string) => {
    const product = getProduct(productId);
    if (product) {
      await logHistory(product, 'deleted');
    }
    await deleteProduct(productId);
  }, [deleteProduct, getProduct, logHistory]);

  // Swipe RIGHT = consumed (finished, need to restock) → shopping list + history
  const handleConsumed = useCallback(async (productId: string) => {
    const product = getProduct(productId);
    if (!product || !profile || !fridge) return;

    // Add to shopping list
    await addShoppingItem({
      fridge_id: fridge.id,
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      category: product.category,
      added_by: profile.id,
    });

    // Log to history
    await logHistory(product, 'consumed');

    // Remove from fridge
    await deleteProduct(productId);
  }, [getProduct, profile, fridge, addShoppingItem, logHistory, deleteProduct]);

  // Refetch products when returning from /add page
  useEffect(() => {
    const handleFocus = () => { refetch(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  if (loading || !profile || !fridge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">{fr.dashboard.loading}</p>
        </div>
      </div>
    );
  }

  const uncheckedShoppingCount = shoppingItems.filter((i) => !i.checked).length;

  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-24">
      <FridgeHeader fridge={fridge} profile={profile} shoppingCount={uncheckedShoppingCount} />

      {/* Product List */}
      <div className="px-4 sm:px-0">
        {productsLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted">{fr.dashboard.loadingItems}</p>
          </div>
        ) : (
          <ProductList
            products={products}
            onConsumed={handleConsumed}
            onDelete={handleDeleteProduct}
            onAddClick={() => router.push('/add')}
          />
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30">
        <Link
          href="/add"
          className="w-14 h-14 rounded-full shadow-lg bg-primary text-white flex items-center justify-center active:scale-95 transition-transform"
          aria-label={fr.dashboard.addItem}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
