import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://dbkrtdzppymjxutivsmo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRia3J0ZHpwcHltanh1dGl2c21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzQ3MDksImV4cCI6MjA5NDIxMDcwOX0.RRJbkRYZI55PZjMlkRpw_JuOwz746d3IA7iknUuYfTA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true
  }
});

window.supabaseClient = supabase;
window.UMSupabase = {
  url: SUPABASE_URL,
  supabase
};

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be logged in to save a profile.");

  const username = cleanUsername(profile.username);
  if (!username) throw new Error("Username is required.");

  const displayName = String(profile.display_name || "").trim() || username;
  const payload = {
    id: user.id,
    username: username,
    display_name: displayName
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, username, display_name")
    .single();

  if (error) throw error;
  return data;
}

export async function getProfilesForUserIds(userIds) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", uniqueIds);

  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
}

export async function createPost({ title, body }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be logged in to post.");

  const payload = {
    user_id: user.id,
    title: String(title || "").trim(),
    body: String(body || "").trim()
  };

  if (!payload.title || !payload.body) {
    throw new Error("Post title and body are required.");
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .insert(payload)
    .select("id, user_id, title, body, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listPosts() {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("id, user_id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const profiles = await getProfilesForUserIds((data || []).map((post) => post.user_id));
  return (data || []).map((post) => ({
    ...post,
    author: profiles.get(post.user_id) || null
  }));
}

export async function submitScore({ game, score }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be logged in to submit a score.");

  const numericScore = Number.parseInt(score, 10);
  if (!Number.isFinite(numericScore) || numericScore < 0) {
    throw new Error("Score must be a positive number.");
  }

  const payload = {
    user_id: user.id,
    game: String(game || "Uncensored Arcade").trim(),
    score: numericScore
  };

  const { data, error } = await supabase
    .from("game_scores")
    .insert(payload)
    .select("id, user_id, game, score, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listScores(game = "all") {
  let query = supabase
    .from("game_scores")
    .select("id, user_id, game, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (game && game !== "all") {
    query = query.eq("game", game);
  }

  const { data, error } = await query;
  if (error) throw error;

  const profiles = await getProfilesForUserIds((data || []).map((score) => score.user_id));
  return (data || []).map((score) => ({
    ...score,
    author: profiles.get(score.user_id) || null
  }));
}

export function cleanUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export function displayName(profile, fallback = "Anonymous") {
  if (!profile) return fallback;
  return profile.display_name || profile.username || fallback;
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
