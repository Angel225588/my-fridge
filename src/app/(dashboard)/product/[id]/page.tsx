'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { fr } from '@/lib/i18n/fr';
import ExpirationBadge from '@/components/features/ExpirationBadge';
import ImageZoom from '@/components/ui/ImageZoom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PRODUCT_CATEGORIES, PRODUCT_LOCATIONS } from '@/types';
import type { Product, UpdateProductInput } from '@/types';

const categoryIcons: Record<string, string> = {
  dairy: '🥛',
  meat: '🥩',
  produce: '🥬',
  beverages: '🥤',
  grains: '🌾',
  frozen: '🧊',
  condiments: '🫙',
  snacks: '🍿',
  other: '📦',
};

const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({
  value: c,
  label: fr.categories[c],
}));

const locationOptions = PRODUCT_LOCATIONS.map((l) => ({
  value: l,
  label: fr.locations[l],
}));

const unitOptions = Object.entries(fr.units).map(([value, label]) => ({
  value,
  label,
}));

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [saved, setSaved] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState<string>('other');
  const [location, setLocation] = useState<string>('fridge');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');

  const supabaseRef = useRef(createSupabaseBrowser());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (data) {
        const p = data as Product;
        setProduct(p);
        populateForm(p);
      }
      setLoading(false);
    };

    load();
  }, [supabase, productId]);

  const populateForm = (p: Product) => {
    setName(p.name);
    setQuantity(String(p.quantity));
    setUnit(p.unit);
    setCategory(p.category);
    setLocation(p.location);
    setExpirationDate(p.expiration_date ?? '');
    setNotes(p.notes ?? '');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!product || !name.trim()) return;

    setSaving(true);
    const updates: UpdateProductInput = {
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category: category as UpdateProductInput['category'],
      location: location as UpdateProductInput['location'],
      expiration_date: expirationDate || null,
      notes: notes.trim() || undefined,
    };

    const { data } = await supabase
      .from('products')
      .update(updates)
      .eq('id', product.id)
      .select()
      .single();

    if (data) {
      setProduct(data as Product);
      populateForm(data as Product);
    }

    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePhoto = async (file: File) => {
    if (!product) return;

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${product.fridge_id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-photos')
      .upload(fileName, file, { contentType: file.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('product-photos')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { data: photoData } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', product.id)
      .select()
      .single();

    if (photoData) {
      setProduct(photoData as Product);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    const confirmed = window.confirm(fr.productDetail.confirmDelete);
    if (!confirmed) return;

    setDeleting(true);
    await supabase.from('products').delete().eq('id', product.id);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Article introuvable</p>
      </div>
    );
  }

  const categoryKey = product.category as keyof typeof fr.categories;
  const locationKey = product.location as keyof typeof fr.locations;
  const unitKey = product.unit as keyof typeof fr.units;

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Hidden photo input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleChangePhoto(file);
          e.target.value = '';
        }}
      />

      {/* Image zoom overlay */}
      {zoomImage && product.image_url && (
        <ImageZoom src={product.image_url} alt={product.name} onClose={() => setZoomImage(false)} />
      )}

      {/* Back + Edit toggle */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-primary">
          {fr.productDetail.back}
        </button>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium">
            {fr.productDetail.edit}
          </button>
        )}
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">{fr.productDetail.saved}</span>
        )}
      </div>

      {/* Product Photo / Avatar - tap to zoom */}
      <div className="flex justify-center mb-6 relative">
        {product.image_url ? (
          <button
            onClick={() => setZoomImage(true)}
            className="w-40 h-40 rounded-2xl overflow-hidden border border-border shadow-sm active:scale-95 transition-transform"
          >
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </button>
        ) : (
          <div className="w-40 h-40 rounded-2xl bg-card border border-border flex items-center justify-center">
            <span className="text-6xl">{categoryIcons[product.category] || '📦'}</span>
          </div>
        )}
        {/* Change photo button */}
        {editing && (
          <button
            onClick={() => photoInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        )}
      </div>

      {/* View mode */}
      {!editing && (
        <>
          {/* Name + Badge */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground mb-2">{product.name}</h1>
            <ExpirationBadge expirationDate={product.expiration_date} />
          </div>

          {/* Details */}
          <div className="bg-card border border-border rounded-xl divide-y divide-border mb-6">
            <div className="flex justify-between p-4">
              <span className="text-sm text-muted">{fr.productDetail.quantity}</span>
              <span className="text-sm font-medium text-foreground">
                {product.quantity} {fr.units[unitKey] || product.unit}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-sm text-muted">{fr.productDetail.category}</span>
              <span className="text-sm font-medium text-foreground">
                {categoryIcons[product.category]} {fr.categories[categoryKey] || product.category}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-sm text-muted">{fr.productDetail.location}</span>
              <span className="text-sm font-medium text-foreground">
                {fr.locations[locationKey] || product.location}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-sm text-muted">{fr.productDetail.purchaseDate}</span>
              <span className="text-sm font-medium text-foreground">{product.purchase_date}</span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-sm text-muted">{fr.productDetail.expirationDate}</span>
              <span className="text-sm font-medium text-foreground">
                {product.expiration_date || fr.expiration.noDate}
              </span>
            </div>
            {product.notes && (
              <div className="flex justify-between p-4">
                <span className="text-sm text-muted">{fr.productDetail.notes}</span>
                <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{product.notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEditing(true)} className="flex-1">
              {fr.productDetail.edit}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 !text-danger"
            >
              {fr.productDetail.delete}
            </Button>
          </div>
        </>
      )}

      {/* Edit mode */}
      {editing && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label={fr.addProduct.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={fr.addProduct.quantity}
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Select
              label={fr.addProduct.unit}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={unitOptions}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={fr.addProduct.category}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
            />
            <Select
              label={fr.addProduct.location}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              options={locationOptions}
            />
          </div>
          <Input
            label={fr.addProduct.expirationDate}
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
          <Input
            label={fr.addProduct.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={fr.addProduct.notesPlaceholder}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(false);
                if (product) populateForm(product);
              }}
              className="flex-1"
            >
              {fr.addProduct.cancel}
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {fr.addProduct.save}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
