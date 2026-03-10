'use client';

import { useState, FormEvent } from 'react';
import { fr } from '@/lib/i18n/fr';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PRODUCT_CATEGORIES, PRODUCT_LOCATIONS } from '@/types';
import type { Product, UpdateProductInput } from '@/types';

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSave: (productId: string, updates: UpdateProductInput) => Promise<void>;
  loading?: boolean;
}

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

export default function EditProductModal({ product, open, onClose, onSave, loading }: EditProductModalProps) {
  const [name, setName] = useState(product?.name ?? '');
  const [quantity, setQuantity] = useState(String(product?.quantity ?? 1));
  const [unit, setUnit] = useState(product?.unit ?? 'pcs');
  const [category, setCategory] = useState<string>(product?.category ?? 'other');
  const [location, setLocation] = useState<string>(product?.location ?? 'fridge');
  const [expirationDate, setExpirationDate] = useState(product?.expiration_date ?? '');
  const [notes, setNotes] = useState(product?.notes ?? '');

  if (product && name !== product.name && !loading) {
    setName(product.name);
    setQuantity(String(product.quantity));
    setUnit(product.unit);
    setCategory(product.category);
    setLocation(product.location);
    setExpirationDate(product.expiration_date ?? '');
    setNotes(product.notes ?? '');
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product || !name.trim()) return;

    await onSave(product.id, {
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category: category as UpdateProductInput['category'],
      location: location as UpdateProductInput['location'],
      expiration_date: expirationDate || null,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={fr.addProduct.editTitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label={fr.addProduct.name} value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label={fr.addProduct.quantity} type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Select label={fr.addProduct.unit} value={unit} onChange={(e) => setUnit(e.target.value)} options={unitOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label={fr.addProduct.category} value={category} onChange={(e) => setCategory(e.target.value)} options={categoryOptions} />
          <Select label={fr.addProduct.location} value={location} onChange={(e) => setLocation(e.target.value)} options={locationOptions} />
        </div>
        <Input label={fr.addProduct.expirationDate} type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
        <Input label={fr.addProduct.notes} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">{fr.addProduct.cancel}</Button>
          <Button type="submit" loading={loading} className="flex-1">{fr.addProduct.save}</Button>
        </div>
      </form>
    </Modal>
  );
}
