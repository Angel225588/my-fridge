'use client';

import { useState, FormEvent } from 'react';
import { fr } from '@/lib/i18n/fr';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PRODUCT_CATEGORIES, PRODUCT_LOCATIONS } from '@/types';
import type { CreateProductInput } from '@/types';

interface AddProductFormProps {
  fridgeId: string;
  onSubmit: (input: CreateProductInput) => Promise<void>;
  onCancel: () => void;
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

export default function AddProductForm({ fridgeId, onSubmit, onCancel, loading }: AddProductFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('other');
  const [location, setLocation] = useState('fridge');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      fridge_id: fridgeId,
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category: category as CreateProductInput['category'],
      location: location as CreateProductInput['location'],
      expiration_date: expirationDate || null,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={fr.addProduct.name}
        placeholder={fr.addProduct.namePlaceholder}
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
        placeholder={fr.addProduct.notesPlaceholder}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {fr.addProduct.cancel}
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {fr.addProduct.add}
        </Button>
      </div>
    </form>
  );
}
