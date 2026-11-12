/**
 * LearnHub demo seed for the shared Supabase hub (schema `learnhub`).
 *
 * Creates the sample accounts in the shared auth.users (tagged
 * user_metadata.app = 'learnhub'), then fills the schema: roles, plans,
 * courses, modules, lessons, library, progress, notes and audit entries.
 * Uploads the files built by scripts/make-media.mjs to the private bucket.
 *
 * Safe to re-run, and doubles as a reset: fixed ids are upserted, the sample
 * accounts' plans, roles, progress and notes are put back, and the two public
 * logins get their password back. Run supabase/hub/schema.sql first.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-hub.mjs
 */
import fs from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { COURSES, DOMAIN, LESSONS, MEDIA, PASSWORD, PEOPLE } from "./hub-content.mjs";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("✗ set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const SCHEMA = "learnhub";
const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "learnhub-media";
const MEDIA_DIR = new URL("./.media/", import.meta.url).pathname;

const sb = createClient(URL_, KEY, { db: { schema: SCHEMA }, auth: { autoRefreshToken: false, persistSession: false } });
const day = 24 * 3600 * 1000;
const at = (days, hours = 0) => new Date(Date.now() + days * day + hours * 3600 * 1000).toISOString();
const must = (label, { error }) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

// ---- 1. accounts ---------------------------------------------------------
async function findUsersByEmail() {
  const found = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email?.endsWith(`@${DOMAIN}`)) found.set(u.email, u);
    if (data.users.length < 1000) break;
  }
  return found;
}

const existing = await findUsersByEmail();
const ids = {};
for (const p of PEOPLE) {
  const user_metadata = { app: SCHEMA, full_name: p.name };
  const app_metadata = p.noDelete ? { no_delete: true } : {};
  const prior = existing.get(p.email);
  if (prior) {
    const { error } = await sb.auth.admin.updateUserById(prior.id, {
      user_metadata,
      app_metadata: { ...prior.app_metadata, ...app_metadata },
      // The public logins get their password back on every run.
      ...(p.login ? { password: PASSWORD } : {})
    });
    if (error) throw error;
    ids[p.key] = prior.id;
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email: p.email, password: PASSWORD, email_confirm: true, user_metadata, app_metadata });
    if (error) throw error;
    ids[p.key] = data.user.id;
  }
}
console.log(`✓ ${PEOPLE.length} accounts`);

// Profiles (the sign-up trigger makes them; this also covers accounts that predate it).
must("users", await sb.from("users").upsert(PEOPLE.map((p) => ({ id: ids[p.key], email: p.email, full_name: p.name, updated_at: at(0) })), { onConflict: "id" }));

// ---- 2. roles ------------------------------------------------------------
const { data: roleRows, error: roleErr } = await sb.from("roles").select("id,name");
if (roleErr) throw roleErr;
const roleId = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));
const sampleIds = PEOPLE.map((p) => ids[p.key]);
must("clear roles", await sb.from("user_roles").delete().in("user_id", sampleIds));
must(
  "user_roles",
  await sb.from("user_roles").insert(PEOPLE.flatMap((p) => p.roles.map((r) => ({ user_id: ids[p.key], role_id: roleId[r], created_by: p.key === "elena" ? null : ids.elena }))))
);
console.log("✓ roles");

// ---- 3. storage ------------------------------------------------------------
const { data: buckets } = await sb.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error } = await sb.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 52428800 });
  if (error) throw error;
  console.log(`✓ created private bucket ${BUCKET}`);
}
const TYPES = { ".mp4": "video/mp4", ".pdf": "application/pdf", ".mp3": "audio/mpeg", ".epub": "application/epub+zip" };
const durations = fs.existsSync(`${MEDIA_DIR}durations.json`) ? JSON.parse(fs.readFileSync(`${MEDIA_DIR}durations.json`, "utf8")) : {};
const uploads = [...LESSONS.filter((l) => l.slides).map((l) => `lessons/${l.slug}.mp4`), ...MEDIA.map((m) => m.file)];
let uploaded = 0;
for (const rel of uploads) {
  const local = MEDIA_DIR + rel;
  if (!fs.existsSync(local)) {
    console.log(`  ! missing ${rel}: run scripts/make-media.mjs first`);
    continue;
  }
  for (let attempt = 1; ; attempt++) {
    const { error } = await sb.storage.from(BUCKET).upload(rel, fs.readFileSync(local), {
      contentType: TYPES[rel.slice(rel.lastIndexOf("."))],
      upsert: true
    });
    if (!error) break;
    if (attempt >= 4) throw new Error(`upload ${rel}: ${error.message}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt)); // storage occasionally drops a request
  }
  uploaded++;
}
console.log(`✓ ${uploaded}/${uploads.length} files in ${BUCKET}`);

// ---- 4. catalogue ----------------------------------------------------------
must("courses", await sb.from("courses").upsert(COURSES.map((c, i) => ({
  id: c.id, title: c.title, slug: c.slug, description: c.description, thumbnail_url: c.thumbnail_url,
  required_tier: c.required_tier, is_published: c.is_published, order_index: i + 1, updated_at: at(0)
})), { onConflict: "id" }));
must("modules", await sb.from("modules").upsert(COURSES.flatMap((c) => c.modules.map((m, i) => ({
  id: m.id, course_id: c.id, title: m.title, slug: m.slug, description: m.description, order_index: i + 1
}))), { onConflict: "id" }));
must("lessons", await sb.from("lessons").upsert(LESSONS.map((l) => ({
  id: l.id, module_id: l.module_id, title: l.title, slug: l.slug, content: l.content,
  video_url: l.slides ? `lessons/${l.slug}.mp4` : null,
  duration: l.slides ? (durations[`lessons/${l.slug}.mp4`] ?? null) : null,
  is_preview: Boolean(l.is_preview), order_index: l.order_index
})), { onConflict: "id" }));
must("media", await sb.from("media_library").upsert(MEDIA.map((m) => ({
  id: m.id, title: m.title, description: m.description, type: m.type, file_path: m.file, required_tier: m.required_tier, cover_url: m.cover_url,
  duration: m.type === "audio" ? (durations[m.file] ?? null) : null,
  pages: m.type === "pdf" ? (durations[m.file]?.pages ?? null) : null
})), { onConflict: "id" }));
console.log(`✓ ${COURSES.length} courses, ${LESSONS.length} lessons, ${MEDIA.length} library items`);

// ---- 5. plans --------------------------------------------------------------
const withPlan = PEOPLE.filter((p) => p.plan);
must("clear plans", await sb.from("subscriptions").delete().in("user_id", sampleIds));
must("subscriptions", await sb.from("subscriptions").insert(withPlan.map((p) => {
  const [tier, status, start, end] = p.plan;
  return {
    user_id: ids[p.key], stripe_subscription_id: `sub_demo_${p.key}`, stripe_price_id: `price_demo_${tier}`,
    tier, status, current_period_start: at(start), current_period_end: at(end), cancel_at_period_end: Boolean(p.cancel)
  };
})));
console.log(`✓ ${withPlan.length} plans`);

// ---- 6. progress and notes -------------------------------------------------
const bySlug = Object.fromEntries(LESSONS.map((l) => [l.slug, l]));
const len = (slug) => durations[`lessons/${slug}.mp4`] ?? 0;
// [slug, completed, position, hours ago]
const PROGRESS = {
  omar: [
    ["strategic-lens", true, null, 240], ["problem-framing", true, null, 216], ["jobs-to-be-done", true, 0, 200],
    ["decision-velocity", true, null, 150], ["one-page-strategy", false, 0, 120],
    ["influence-without-title", true, null, 96], ["architecture-narrative", true, null, 72],
    ["planning-in-bets", false, 9, 3], ["room-dynamics", true, null, 30]
  ],
  lina: [["strategic-lens", true, null, 50], ["problem-framing", false, 14, 6]],
  priya: [["strategic-lens", true, null, 160], ["problem-framing", true, null, 150], ["influence-without-title", true, null, 100], ["architecture-narrative", false, 11, 20]],
  ben: [["influence-without-title", true, null, 70], ["architecture-narrative", true, null, 60], ["what-not-to-build", true, 0, 58], ["planning-in-bets", true, null, 30]],
  hannah: [["room-dynamics", true, null, 30], ["one-minute-update", false, 8, 10]],
  sofia: [["strategic-lens", true, null, 90], ["problem-framing", true, null, 80], ["jobs-to-be-done", false, 0, 12]],
  aisha: [["strategic-lens", false, 17, 40]],
  maya: [["room-dynamics", true, null, 500], ["one-minute-update", true, null, 480], ["writing-for-executives", false, 0, 470]],
  jules: [["influence-without-title", true, null, 800], ["architecture-narrative", false, 12, 790]],
  lucas: [["influence-without-title", false, 6, 4]]
};
must("clear progress", await sb.from("user_progress").delete().in("user_id", sampleIds));
must("progress", await sb.from("user_progress").insert(Object.entries(PROGRESS).flatMap(([key, rows]) => rows.map(([slug, completed, pos, hoursAgo]) => ({
  user_id: ids[key], lesson_id: bySlug[slug].id, completed,
  last_position: completed ? len(slug) : (pos ?? 0),
  completed_at: completed ? at(0, -hoursAgo) : null, updated_at: at(0, -hoursAgo)
})))));

const NOTES = [
  ["omar", "strategic-lens", 18, "Write the three sentences before Monday's roadmap review: who, what must be true, what we won't do.", 230],
  ["omar", "problem-framing", 12, "Our churn ticket is a feature request. Rewrite it as: finance leads lose a day a month rebuilding reports.", 210],
  ["omar", "planning-in-bets", 6, "Add a checkpoint date to every Q1 bet, and name the early signal.", 3],
  ["lina", "problem-framing", 9, "Three-team test: try it on the onboarding brief.", 6],
  ["priya", "architecture-narrative", 5, "Open the payments review with what it does for users.", 20]
];
must("clear notes", await sb.from("notes").delete().in("user_id", sampleIds));
must("notes", await sb.from("notes").insert(NOTES.map(([key, slug, t, content, hoursAgo]) => ({
  user_id: ids[key], lesson_id: bySlug[slug].id, content, timestamp: t, created_at: at(0, -hoursAgo), updated_at: at(0, -hoursAgo)
}))));
must("clear bookmarks", await sb.from("bookmarks").delete().in("user_id", sampleIds));
must("bookmarks", await sb.from("bookmarks").insert([
  { user_id: ids.omar, lesson_id: bySlug["one-page-strategy"].id }, { user_id: ids.lina, lesson_id: bySlug["decision-velocity"].id }
]));
console.log("✓ progress, notes and bookmarks");

// ---- 7. audit log ----------------------------------------------------------
const A = (n) => `90000000-0000-4000-8000-00000000000${n}`;
// A reset starts the log clean: entries made by visitors or test runs go.
must("clear audit", await sb.from("admin_audit_logs").delete().not("id", "in", `(${[1, 2, 3, 4, 5].map(A).join(",")})`));
must("audit", await sb.from("admin_audit_logs").upsert([
  { id: A(1), actor_user_id: ids.elena, action: "publish_courses", entity_type: "course", entity_id: null, metadata: { ids: [COURSES[2].id] }, created_at: at(-21) },
  { id: A(2), actor_user_id: ids.elena, action: "assign_admin_role", entity_type: "user", entity_id: ids.admin, metadata: {}, created_at: at(-18) },
  { id: A(3), actor_user_id: ids.elena, action: "revoke_access", entity_type: "user", entity_id: ids.tom, metadata: {}, created_at: at(-40) },
  { id: A(4), actor_user_id: ids.elena, action: "grant_tier_bulk", entity_type: "user", entity_id: null, metadata: { ids: [ids.sofia, ids.aisha], tier: "insider" }, created_at: at(-6) },
  { id: A(5), actor_user_id: ids.elena, action: "grant_access", entity_type: "user", entity_id: ids.hannah, metadata: { tier: "pro", durationDays: 30 }, created_at: at(-2) }
], { onConflict: "id" }));
console.log("✓ audit log");

console.log(`\nLogins (password ${PASSWORD}):`);
for (const p of PEOPLE.filter((x) => x.login)) console.log(`  ${p.email.padEnd(34)} ${p.noDelete ? "admin, no_delete" : "learner, Pro"}`);
