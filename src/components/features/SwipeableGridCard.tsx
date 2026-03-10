'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';
import { fr } from '@/lib/i18n/fr';
import { getDaysUntilExpiration, getExpirationStatus } from '@/lib/utils/expiration';

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

const SWIPE_THRESHOLD = 60;

interface SwipeableGridCardProps {
  product: Product;
  onConsumed: (productId: string) => void;
  onDelete: (productId: string) => void;
}

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

export default function SwipeableGridCard({ product, onConsumed, onDelete }: SwipeableGridCardProps) {
  const router = useRouter();
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const hasMoved = useRef(false);
  const TAP_TOLERANCE = 10; // pixels — any movement beyond this is not a tap

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

    // Any movement beyond tolerance = not a tap (covers both vertical scroll and horizontal swipe)
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
      // Only navigate if the finger barely moved (true tap, not a scroll)
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

  const showConsumed = offsetX > 20;
  const showDelete = offsetX < -20;
  const swipeOpacity = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe right background → consumed (green) */}
      <div
        className="absolute inset-0 bg-emerald-500 flex items-center justify-center rounded-xl"
        style={{ opacity: showConsumed ? swipeOpacity : 0 }}
      >
        <div className="flex flex-col items-center gap-1 text-white font-medium text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {fr.swipe.consumed}
        </div>
      </div>

      {/* Swipe left background → delete (red) */}
      <div
        className="absolute inset-0 bg-red-500 flex items-center justify-center rounded-xl"
        style={{ opacity: showDelete ? swipeOpacity : 0 }}
      >
        <div className="flex flex-col items-center gap-1 text-white font-medium text-sm">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M7 5V3.5A1.5 1.5 0 018.5 2h3A1.5 1.5 0 0113 3.5V5m2.5 0v11a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 16V5h11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {fr.swipe.delete}
        </div>
      </div>

      {/* Card content */}
      <div
        className="bg-card border border-border rounded-xl overflow-hidden relative z-10"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.15s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Photo or icon */}
        <div className="aspect-square bg-input-bg relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{categoryIcons[product.category] || '📦'}</span>
            </div>
          )}
          {/* Expiration badge overlay */}
          <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <ExpirationLabel date={product.expiration_date} />
          </div>
          {/* Location badge */}
          <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-[10px] text-muted font-medium">
              {fr.locations[product.location as keyof typeof fr.locations] || product.location}
            </span>
          </div>
        </div>
        {/* Info */}
        <div className="p-2.5">
          <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
          <p className="text-xs text-muted">{product.quantity} {product.unit}</p>
        </div>
      </div>
    </div>
  );
}
