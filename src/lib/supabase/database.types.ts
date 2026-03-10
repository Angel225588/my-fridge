/**
 * Supabase Database Types
 * These types should be generated from the database schema
 * For now, we define them manually based on our data model
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      fridges: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          fridge_id: string;
          user_id: string;
          name: string;
          avatar_url: string | null;
          role: 'owner' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fridge_id: string;
          user_id: string;
          name: string;
          avatar_url?: string | null;
          role?: 'owner' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fridge_id?: string;
          user_id?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'owner' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_fridge_id_fkey';
            columns: ['fridge_id'];
            isOneToOne: false;
            referencedRelation: 'fridges';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          fridge_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string;
          expiration_date: string | null;
          purchase_date: string;
          added_by: string;
          location: string;
          image_url: string | null;
          price: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fridge_id: string;
          name: string;
          quantity?: number;
          unit?: string;
          category?: string;
          expiration_date?: string | null;
          purchase_date?: string;
          added_by: string;
          location?: string;
          image_url?: string | null;
          price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fridge_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string;
          expiration_date?: string | null;
          purchase_date?: string;
          added_by?: string;
          location?: string;
          image_url?: string | null;
          price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_fridge_id_fkey';
            columns: ['fridge_id'];
            isOneToOne: false;
            referencedRelation: 'fridges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_added_by_fkey';
            columns: ['added_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      receipts: {
        Row: {
          id: string;
          fridge_id: string;
          store_name: string;
          purchase_date: string;
          total_amount: number;
          image_url: string;
          processed: boolean;
          added_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fridge_id: string;
          store_name: string;
          purchase_date: string;
          total_amount: number;
          image_url: string;
          processed?: boolean;
          added_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fridge_id?: string;
          store_name?: string;
          purchase_date?: string;
          total_amount?: number;
          image_url?: string;
          processed?: boolean;
          added_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'receipts_fridge_id_fkey';
            columns: ['fridge_id'];
            isOneToOne: false;
            referencedRelation: 'fridges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receipts_added_by_fkey';
            columns: ['added_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      shopping_list: {
        Row: {
          id: string;
          fridge_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string;
          checked: boolean;
          added_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fridge_id: string;
          name: string;
          quantity?: number;
          unit?: string;
          category?: string;
          checked?: boolean;
          added_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fridge_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string;
          checked?: boolean;
          added_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_list_fridge_id_fkey';
            columns: ['fridge_id'];
            isOneToOne: false;
            referencedRelation: 'fridges';
            referencedColumns: ['id'];
          },
        ];
      };
      product_history: {
        Row: {
          id: string;
          fridge_id: string;
          product_name: string;
          product_category: string;
          action: string;
          acted_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fridge_id: string;
          product_name: string;
          product_category?: string;
          action: string;
          acted_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fridge_id?: string;
          product_name?: string;
          product_category?: string;
          action?: string;
          acted_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_history_fridge_id_fkey';
            columns: ['fridge_id'];
            isOneToOne: false;
            referencedRelation: 'fridges';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'owner' | 'member';
      product_category:
        | 'dairy'
        | 'meat'
        | 'produce'
        | 'beverages'
        | 'grains'
        | 'frozen'
        | 'condiments'
        | 'snacks'
        | 'other';
      product_location: 'fridge' | 'freezer' | 'pantry';
    };
  };
}
