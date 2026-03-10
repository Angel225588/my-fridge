'use client';

import { useState } from 'react';
import type { Product, ProductLocation } from '@/types';
import { sortByExpiration, getDaysUntilExpiration, getExpirationStatus } from '@/lib/utils/expiration';
import { fr } from '@/lib/i18n/fr';
import SwipeableProductCard from './SwipeableProductCard';
import SwipeableGridCard from './SwipeableGridCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

interface ProductListProps {
  products: Product[];
  onConsumed: (productId: string) => void;
  onDelete: (productId: string) => void;
  onAddClick: () => void;
}

const categoryIcons: Record<string, string> = {
  dairy: '🥛', meat: '🥩', produce: '🥬', beverages: '🥤',
  grains: '🌾', frozen: '🧊', condiments: '🫙', snacks: '🍿', other: '📦',
};

const locationFilters: { value: ProductLocation | 'all'; label: string }[] = [
  { value: 'all', label: fr.products.all },
  { value: 'fridge', label: fr.products.fridge },
  { value: 'freezer', label: fr.products.freezer },
  { value: 'pantry', label: fr.products.pantry },
];

const statusColors: Record<string, string> = {
  fresh: 'bg-emerald-500',
  warning: 'bg-amber-500',
  urgent: 'bg-orange-500',
  expired: 'bg-red-500',
  'no-date': 'bg-red-400',
};

const statusTextColors: Record<string, string> = {
  fresh: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  urgent: 'text-orange-700 dark:text-orange-400',
  expired: 'text-red-700 dark:text-red-400',
  'no-date': 'text-red-500 dark:text-red-400',
};

function ExpirationLabel({ date }: { date: string | null }) {
  const days = getDaysUntilExpiration(date);
  const status = getExpirationStatus(days);

  let label: string;
  if (days === null) label = 'Exp ?';
  else if (days < 0) label = `${Math.abs(days)}j`;
  else if (days === 0) label = "Auj.";
  else label = `${days}j`;

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <span className={`text-xs font-semibold ${statusTextColors[status]}`}>
        {label}
      </span>
    </div>
  );
}

type ViewMode = 'grid' | 'list';

export default function ProductList({ products, onConsumed, onDelete, onAddClick }: ProductListProps) {
  const [filter, setFilter] = useState<ProductLocation | 'all'>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');

  const filtered = products
    .filter((p) => filter === 'all' || p.location === filter)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const sorted = sortByExpiration(filtered);

  if (products.length === 0) {
    return (
      <EmptyState
        title={fr.products.noItems}
        description={fr.products.noItemsDesc}
        action={<Button onClick={onAddClick}>{fr.products.addItem}</Button>}
      />
    );
  }

  return (
    <div>
      {/* Search + Filters */}
      <div className="sticky top-0 z-20 bg-background pt-2 pb-3 flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder={fr.products.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input-bg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          {/* View toggle */}
          <div className="flex bg-input-bg rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-muted'}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-muted'}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-input-bg rounded-lg p-0.5 border border-border">
          {locationFilters.map((loc) => (
            <button
              key={loc.value}
              onClick={() => setFilter(loc.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 ${
                filter === loc.value
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted mb-3">
        {sorted.length} {sorted.length > 1 ? fr.products.itemsPlural : fr.products.items}
        {filter !== 'all' ? ` ${fr.products.in} ${fr.locations[filter]}` : ''}
      </p>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((product) => (
            <SwipeableGridCard
              key={product.id}
              product={product}
              onConsumed={onConsumed}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* List View (swipeable) */}
      {view === 'list' && (
        <div className="flex flex-col gap-2">
          {sorted.map((product) => (
            <SwipeableProductCard
              key={product.id}
              product={product}
              onConsumed={onConsumed}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <p className="text-center text-sm text-muted py-8">{fr.products.noMatch}</p>
      )}
    </div>
  );
}
