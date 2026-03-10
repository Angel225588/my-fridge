import type { ExpirationStatus, ExpirationInfo, Product, ProductCategory } from '@/types';

export function getDaysUntilExpiration(
  expirationDate: string | null | undefined
): number | null {
  if (!expirationDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getExpirationStatus(
  daysUntilExpiration: number | null
): ExpirationStatus {
  if (daysUntilExpiration === null) return 'no-date';
  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 2) return 'urgent';
  if (daysUntilExpiration <= 6) return 'warning';
  return 'fresh';
}

export function getExpirationInfo(
  expirationDate: string | null | undefined
): ExpirationInfo {
  const days = getDaysUntilExpiration(expirationDate);
  const status = getExpirationStatus(days);

  let label: string;

  if (days === null) {
    label = 'Exp ?';
  } else if (days === 0) {
    label = 'Expire aujourd\'hui';
  } else if (days === -1) {
    label = 'Expiré hier';
  } else if (days < 0) {
    label = `Expiré il y a ${Math.abs(days)}j`;
  } else if (days === 1) {
    label = '1 jour restant';
  } else {
    label = `${days}j restants`;
  }

  return {
    status,
    daysUntilExpiration: days,
    label,
  };
}

export function sortByExpiration(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const daysA = getDaysUntilExpiration(a.expiration_date);
    const daysB = getDaysUntilExpiration(b.expiration_date);

    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;

    return daysA - daysB;
  });
}

export function getDefaultExpirationDays(category: ProductCategory): number {
  const defaults: Record<ProductCategory, number> = {
    dairy: 10,
    meat: 5,
    produce: 7,
    beverages: 30,
    grains: 180,
    frozen: 90,
    condiments: 180,
    snacks: 30,
    other: 14,
  };

  return defaults[category];
}
