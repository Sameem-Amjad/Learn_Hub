import type { SubscriptionStatus, SubscriptionTier } from "./subscription";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          thumbnail_url: string | null;
          required_tier: SubscriptionTier;
          is_published: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          title: string;
          slug: string;
          required_tier: SubscriptionTier;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          last_position: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_progress"]["Row"]> & {
          user_id: string;
          lesson_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_progress"]["Row"]>;
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          content: string;
          timestamp: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & {
          user_id: string;
          lesson_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };
      media_library: {
        Row: {
          id: string;
          title: string;
          type: "pdf" | "epub" | "audio";
          file_path: string;
          required_tier: SubscriptionTier;
          duration: number | null;
          pages: number | null;
          cover_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["media_library"]["Row"]> & {
          title: string;
          type: "pdf" | "epub" | "audio";
          file_path: string;
          required_tier: SubscriptionTier;
        };
        Update: Partial<Database["public"]["Tables"]["media_library"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
