'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { fr } from '@/lib/i18n/fr';
import { useProducts } from '@/hooks/useProducts';
import CameraCapture from '@/components/features/CameraCapture';
import AddProductForm from '@/components/features/AddProductForm';
import CommandBar from '@/components/features/CommandBar';
import type { CreateProductInput, UserProfile, Fridge } from '@/types';

type AddStep = 'choose' | 'camera' | 'gallery' | 'manual' | 'ai';

export default function AddPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<AddStep>('choose');
  const [actionLoading, setActionLoading] = useState(false);

  const supabaseRef = useRef(createSupabaseBrowser());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { products, addProduct, refetch } = useProducts(fridge?.id);

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

  // Upload image
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${fridge?.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('product-photos')
      .upload(fileName, file, { contentType: file.type });
    if (error) { console.error('Upload error:', error); return null; }
    const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }, [supabase, fridge?.id]);

  // Items from camera/gallery scan
  const handleItemsAdded = useCallback(async (
    items: { name: string; quantity: number; unit: string; category: string; location?: string; expiration_date?: string | null; estimated_expiry_days?: number | null; price?: number | null }[],
    imageFile: File,
    scanType: string = 'product'
  ) => {
    if (!fridge || !profile) return;
    const imageUrl = scanType !== 'receipt' ? await uploadImage(imageFile) : null;

    for (const item of items) {
      // Only use real expiration dates from the AI — never estimate
      const expirationDate = item.expiration_date || null;

      try {
        const result = await addProduct({
          fridge_id: fridge.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category as CreateProductInput['category'],
          expiration_date: expirationDate,
          location: (item.location as CreateProductInput['location']) || 'fridge',
          image_url: imageUrl,
          price: item.price ?? null,
        }, profile.id);

        if (result.error) {
          console.error('Error adding product:', item.name, result.error);
        }
      } catch (err) {
        console.error('Exception adding product:', item.name, err);
      }
    }
    await refetch();
  }, [fridge, profile, addProduct, refetch, uploadImage]);

  // Manual add
  const handleAddProduct = useCallback(async (input: CreateProductInput) => {
    if (!profile) return;
    setActionLoading(true);
    await addProduct(input, profile.id);
    setActionLoading(false);
    router.push('/dashboard');
  }, [addProduct, profile, router]);

  // AI command
  const handleCommand = useCallback(async (command: string): Promise<string> => {
    const res = await fetch('/api/ai/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, fridge_id: fridge?.id, profile_id: profile?.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    await refetch();
    return data.message;
  }, [fridge?.id, profile?.id, refetch]);

  const handleDone = () => {
    refetch();
    router.push('/dashboard');
  };

  if (loading || !profile || !fridge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Hidden gallery input (used for gallery option)
  const galleryInput = (
    <input
      ref={galleryInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={() => {}} // Handled by CameraCapture
    />
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-primary">
          {fr.profile.back}
        </button>
        <h1 className="text-lg font-semibold text-foreground">{fr.scan.title}</h1>
        <div className="w-12" />
      </div>

      {/* Choose mode */}
      {step === 'choose' && (
        <div className="flex-1 flex flex-col justify-center px-6 gap-4 max-w-md mx-auto w-full">
          {/* Camera */}
          <button
            onClick={() => setStep('camera')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors duration-100 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">{fr.addScreen.camera}</p>
              <p className="text-xs text-muted">{fr.addScreen.cameraDesc}</p>
            </div>
          </button>

          {/* Gallery */}
          <button
            onClick={() => setStep('gallery')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors duration-100 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">{fr.addScreen.gallery}</p>
              <p className="text-xs text-muted">{fr.addScreen.galleryDesc}</p>
            </div>
          </button>

          {/* AI Chat */}
          <button
            onClick={() => setStep('ai')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors duration-100 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">{fr.addScreen.ai}</p>
              <p className="text-xs text-muted">{fr.addScreen.aiDesc}</p>
            </div>
          </button>

          {/* Manual */}
          <button
            onClick={() => setStep('manual')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors duration-100 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">{fr.addScreen.manual}</p>
              <p className="text-xs text-muted">{fr.addScreen.manualDesc}</p>
            </div>
          </button>
        </div>
      )}

      {/* Camera scan - full screen */}
      {(step === 'camera' || step === 'gallery') && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 pt-4 min-h-0">
            <CameraCapture
              onItemsAdded={handleItemsAdded}
              onClose={handleDone}
              existingProducts={products.map((p) => p.name)}
              autoOpenCamera={step === 'camera'}
              autoOpenGallery={step === 'gallery'}
            />
          </div>
          {/* Fixed done button at bottom */}
          <div className="px-4 pt-3 pb-4 border-t border-border bg-background flex-shrink-0">
            <button
              onClick={handleDone}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform duration-100"
            >
              {fr.scan.done}
            </button>
          </div>
        </div>
      )}

      {/* Manual add */}
      {step === 'manual' && (
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <AddProductForm
            fridgeId={fridge.id}
            onSubmit={handleAddProduct}
            onCancel={() => setStep('choose')}
            loading={actionLoading}
          />
        </div>
      )}

      {/* AI Chat */}
      {step === 'ai' && (
        <div className="flex-1 flex flex-col px-4 py-4">
          <div className="flex-1 flex flex-col justify-end">
            <div className="mb-4">
              <p className="text-sm text-muted text-center mb-6">
                {fr.addScreen.aiDesc}
              </p>
              <CommandBar onCommand={handleCommand} />
            </div>
          </div>
          <div className="pt-4 pb-2">
            <button
              onClick={handleDone}
              className="w-full py-3.5 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform"
            >
              {fr.scan.done}
            </button>
          </div>
        </div>
      )}

      {galleryInput}
    </div>
  );
}
