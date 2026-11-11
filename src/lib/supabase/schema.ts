/**
 * The Postgres schema LearnHub's tables live in. On the shared demo project
 * every app has its own schema (`learnhub` here); a standalone project keeps
 * the default `public`.
 */
export const DB_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA || "public";

/** Private storage bucket for lesson videos and library files. */
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "media";

/** Every sign-up is tagged with this app name (the shared project's sign-up trigger reads it). */
export const APP_TAG = "learnhub";
