import type { SubscriptionTier } from "./subscription";

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  content: string | null;
  video_url: string | null;
  duration: number | null;
  is_preview: boolean;
  order_index: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  required_tier: SubscriptionTier;
  is_published: boolean;
  order_index: number;
  modules?: Module[];
}
