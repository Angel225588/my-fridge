'use client';

import Link from 'next/link';
import type { Product } from '@/types';
import { fr } from '@/lib/i18n/fr';
import ExpirationBadge from './ExpirationBadge';

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

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const locationKey = product.location as keyof typeof fr.locations;

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors group">
      {/* Photo thumbnail or category icon */}
      <Link href={`/product/${product.id}`} className="flex-shrink-0">
        {product.image_url ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="text-2xl w-10 h-10 flex items-center justify-center">
            {categoryIcons[product.category] || '📦'}
          </div>
        )}
      </Link>

      <Link href={`/product/${product.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium text-foreground truncate">{product.name}</h3>
          <span className="text-xs text-muted flex-shrink-0">
            {product.quantity} {product.unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ExpirationBadge expirationDate={product.expiration_date} />
          <span className="text-xs text-muted">{fr.locations[locationKey] || product.location}</span>
        </div>
      </Link>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(product); }}
          className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-input-bg transition-colors"
          aria-label="Modifier"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.333 2.667a1.886 1.886 0 112.667 2.667l-8.667 8.666H2.667v-2.667l8.666-8.666z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
          className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"
          aria-label="Supprimer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
