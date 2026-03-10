'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const SWIPE_THRESHOLD = 80;

interface SwipeableProductCardProps {
  product: Product;
  onConsumed: (productId: string) => void;
  onDelete: (productId: string) => void;
}

export default function SwipeableProductCard({ product, onConsumed, onDelete }: SwipeableProductCardProps) {
  const router = useRouter();
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const hasMoved = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const TAP_TOLERANCE = 10;

  const locationKey = product.location as keyof typeof fr.locations;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    hasMoved.current = false;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (Math.abs(dx) > TAP_TOLERANCE || Math.abs(dy) > TAP_TOLERANCE) {
      hasMoved.current = true;
    }

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;

    e.preventDefault();
    setOffsetX(dx);
  };

  const handleTouchEnd = () => {
    setSwiping(false);

    if (offsetX > SWIPE_THRESHOLD) {
      setDismissed(true);
      setOffsetX(400);
      setTimeout(() => onConsumed(product.id), 150);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      setDismissed(true);
      setOffsetX(-400);
      setTimeout(() => onDelete(product.id), 150);
    } else {
      // Only navigate on a true tap (finger barely moved)
      if (!hasMoved.current) {
        router.push(`/product/${product.id}`);
      }
      setOffsetX(0);
    }

    isHorizontal.current = null;
  };

  if (dismissed) {
    return (
      <div
        className="overflow-hidden transition-all duration-150"
        style={{ maxHeight: 0, opacity: 0, marginBottom: 0, padding: 0 }}
      />
    );
  }

  // Background action indicators
  const showConsumed = offsetX > 20;
  const showDelete = offsetX < -20;
  const consumedOpacity = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe right background → shopping list (green) */}
      <div
        className="absolute inset-0 bg-emerald-500 flex items-center pl-5 rounded-xl"
        style={{ opacity: showConsumed ? consumedOpacity : 0 }}
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {fr.swipe.consumed}
        </div>
      </div>

      {/* Swipe left background → delete (red) */}
      <div
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-5 rounded-xl"
        style={{ opacity: showDelete ? consumedOpacity : 0 }}
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          {fr.swipe.delete}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M7 5V3.5A1.5 1.5 0 018.5 2h3A1.5 1.5 0 0113 3.5V5m2.5 0v11a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 16V5h11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border transition-transform relative z-10"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.15s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Photo thumbnail or category icon */}
        <div className="flex-shrink-0">
          {product.image_url ? (
            <div className="w-11 h-11 rounded-lg overflow-hidden border border-border">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="text-2xl w-11 h-11 flex items-center justify-center">
              {categoryIcons[product.category] || '📦'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
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
        </div>

        {/* Chevron indicator */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted flex-shrink-0">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
