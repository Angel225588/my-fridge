'use client';

import Link from 'next/link';
import type { Fridge, UserProfile } from '@/types';

interface FridgeHeaderProps {
  fridge: Fridge;
  profile: UserProfile;
  shoppingCount?: number;
}

export default function FridgeHeader({ fridge, profile, shoppingCount = 0 }: FridgeHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 px-4 sm:px-0">
      <Link href="/profile" className="flex items-center gap-3 active:opacity-70 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
          {fridge.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-semibold text-foreground text-lg leading-tight">{fridge.name}</h1>
          <p className="text-xs text-muted">{profile.name}</p>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        {/* History icon */}
        <Link
          href="/history"
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-input-bg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* Shopping list icon */}
        <Link
          href="/shopping-list"
          className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-input-bg transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {shoppingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {shoppingCount > 9 ? '9+' : shoppingCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
