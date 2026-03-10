-- ===========================================
-- MyFridge Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor to create tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------
-- Enums
-- -------------------------------------------

CREATE TYPE user_role AS ENUM ('owner', 'member');

CREATE TYPE product_category AS ENUM (
  'dairy',
  'meat',
  'produce',
  'beverages',
  'grains',
  'frozen',
  'condiments',
  'snacks',
  'other'
);

CREATE TYPE product_location AS ENUM ('fridge', 'freezer', 'pantry');

-- -------------------------------------------
-- Fridges Table (Workspaces)
-- -------------------------------------------

CREATE TABLE fridges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for invite code lookups
CREATE INDEX idx_fridges_invite_code ON fridges(invite_code);

-- -------------------------------------------
-- Profiles Table (Users in a Fridge)
-- -------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- A user can only have one profile per fridge
  UNIQUE(fridge_id, user_id)
);

-- Indexes
CREATE INDEX idx_profiles_fridge_id ON profiles(fridge_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- -------------------------------------------
-- Products Table (Inventory Items)
-- -------------------------------------------

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  category product_category DEFAULT 'other',
  expiration_date DATE,
  purchase_date DATE DEFAULT CURRENT_DATE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  location product_location DEFAULT 'fridge',
  price NUMERIC DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_fridge_id ON products(fridge_id);
CREATE INDEX idx_products_expiration ON products(expiration_date);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_location ON products(location);

-- -------------------------------------------
-- Receipts Table
-- -------------------------------------------

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  image_url TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_receipts_fridge_id ON receipts(fridge_id);

-- -------------------------------------------
-- Shopping List Table
-- -------------------------------------------

CREATE TABLE shopping_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  category TEXT DEFAULT 'other',
  checked BOOLEAN DEFAULT FALSE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_fridge_id ON shopping_list(fridge_id);

-- -------------------------------------------
-- Product History Table
-- -------------------------------------------

CREATE TABLE product_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_category TEXT DEFAULT 'other',
  action TEXT NOT NULL, -- 'consumed' or 'deleted'
  acted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_history_fridge_id ON product_history(fridge_id);

-- -------------------------------------------
-- Row Level Security (RLS)
-- -------------------------------------------

-- Enable RLS on all tables
ALTER TABLE fridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user's fridge IDs (avoids RLS recursion)
CREATE OR REPLACE FUNCTION get_my_fridge_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT fridge_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fridges: Users can see fridges they're members of
CREATE POLICY "Users can view their fridges" ON fridges
  FOR SELECT USING (id IN (SELECT get_my_fridge_ids()));

-- Fridges: Anyone can create a fridge (they become owner)
CREATE POLICY "Anyone can create a fridge" ON fridges
  FOR INSERT WITH CHECK (true);

-- Fridges: Only owners can update fridge settings
CREATE POLICY "Owners can update their fridge" ON fridges
  FOR UPDATE USING (
    id IN (
      SELECT fridge_id FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Profiles: Users can view profiles in their fridges (uses function to avoid recursion)
CREATE POLICY "Users can view fridge member profiles" ON profiles
  FOR SELECT USING (fridge_id IN (SELECT get_my_fridge_ids()));

-- Profiles: Users can create their own profile
CREATE POLICY "Users can create their profile" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update their profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Products: Members can view products in their fridge
CREATE POLICY "Members can view fridge products" ON products
  FOR SELECT USING (fridge_id IN (SELECT get_my_fridge_ids()));

-- Products: Members can add products to their fridge
CREATE POLICY "Members can add products" ON products
  FOR INSERT WITH CHECK (fridge_id IN (SELECT get_my_fridge_ids()));

-- Products: Members can update products in their fridge
CREATE POLICY "Members can update products" ON products
  FOR UPDATE USING (fridge_id IN (SELECT get_my_fridge_ids()));

-- Products: Members can delete products from their fridge
CREATE POLICY "Members can delete products" ON products
  FOR DELETE USING (fridge_id IN (SELECT get_my_fridge_ids()));

-- Receipts: Members can view receipts in their fridge
CREATE POLICY "Members can view fridge receipts" ON receipts
  FOR SELECT USING (fridge_id IN (SELECT get_my_fridge_ids()));

-- Receipts: Members can add receipts
CREATE POLICY "Members can add receipts" ON receipts
  FOR INSERT WITH CHECK (fridge_id IN (SELECT get_my_fridge_ids()));

-- Shopping List: Members can view items in their fridge
CREATE POLICY "Members can view shopping list" ON shopping_list
  FOR SELECT USING (fridge_id IN (SELECT get_my_fridge_ids()));

CREATE POLICY "Members can add shopping items" ON shopping_list
  FOR INSERT WITH CHECK (fridge_id IN (SELECT get_my_fridge_ids()));

CREATE POLICY "Members can update shopping items" ON shopping_list
  FOR UPDATE USING (fridge_id IN (SELECT get_my_fridge_ids()));

CREATE POLICY "Members can delete shopping items" ON shopping_list
  FOR DELETE USING (fridge_id IN (SELECT get_my_fridge_ids()));

-- Product History: Members can view history in their fridge
CREATE POLICY "Members can view product history" ON product_history
  FOR SELECT USING (fridge_id IN (SELECT get_my_fridge_ids()));

CREATE POLICY "Members can add product history" ON product_history
  FOR INSERT WITH CHECK (fridge_id IN (SELECT get_my_fridge_ids()));

-- -------------------------------------------
-- Updated At Trigger
-- -------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fridges_updated_at
  BEFORE UPDATE ON fridges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
