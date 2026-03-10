// ===========================================
// MyFridge Type Definitions
// ===========================================

// -------------------------------------------
// Fridge (Workspace)
// -------------------------------------------
export interface Fridge {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFridgeInput {
  name: string;
}

// -------------------------------------------
// User Profile
// -------------------------------------------
export interface UserProfile {
  id: string;
  fridge_id: string;
  user_id: string; // Supabase auth user id
  name: string;
  avatar_url?: string;
  role: 'owner' | 'member';
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  fridge_id: string;
  name: string;
  avatar_url?: string;
  role?: 'owner' | 'member';
}

// -------------------------------------------
// Product Categories
// -------------------------------------------
export const PRODUCT_CATEGORIES = [
  'dairy',
  'meat',
  'produce',
  'beverages',
  'grains',
  'frozen',
  'condiments',
  'snacks',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// -------------------------------------------
// Product Locations
// -------------------------------------------
export const PRODUCT_LOCATIONS = ['fridge', 'freezer', 'pantry'] as const;

export type ProductLocation = (typeof PRODUCT_LOCATIONS)[number];

// -------------------------------------------
// Product (Inventory Item)
// -------------------------------------------
export interface Product {
  id: string;
  fridge_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: ProductCategory;
  expiration_date: string | null;
  purchase_date: string;
  added_by: string; // profile_id
  location: ProductLocation;
  image_url?: string | null;
  price?: number | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  fridge_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: ProductCategory;
  expiration_date?: string | null;
  purchase_date?: string;
  location?: ProductLocation;
  image_url?: string | null;
  price?: number | null;
  notes?: string;
}

export interface UpdateProductInput {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: ProductCategory;
  expiration_date?: string | null;
  location?: ProductLocation;
  notes?: string;
}

// -------------------------------------------
// Receipt
// -------------------------------------------
export interface Receipt {
  id: string;
  fridge_id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  image_url: string;
  processed: boolean;
  added_by: string;
  created_at: string;
}

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  category?: ProductCategory;
}

export interface ParsedReceipt {
  store_name: string;
  purchase_date: string;
  items: ParsedReceiptItem[];
  total_amount: number;
  tax?: number;
}

// -------------------------------------------
// Shopping List
// -------------------------------------------
export interface ShoppingItem {
  id: string;
  fridge_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  added_by: string;
  created_at: string;
}

// -------------------------------------------
// Product History
// -------------------------------------------
export type HistoryAction = 'consumed' | 'deleted';

export interface ProductHistory {
  id: string;
  fridge_id: string;
  product_name: string;
  product_category: string;
  action: HistoryAction;
  acted_by: string;
  created_at: string;
}

// -------------------------------------------
// Expiration Status
// -------------------------------------------
export type ExpirationStatus = 'fresh' | 'warning' | 'urgent' | 'expired' | 'no-date';

export interface ExpirationInfo {
  status: ExpirationStatus;
  daysUntilExpiration: number | null;
  label: string;
}

// -------------------------------------------
// AI Command Types
// -------------------------------------------
export type AICommandType =
  | 'add_product'
  | 'update_expiration'
  | 'update_quantity'
  | 'remove_product'
  | 'query_expiring'
  | 'unknown';

export interface AICommandResult {
  type: AICommandType;
  confidence: number;
  data: Record<string, unknown>;
  message: string;
}
