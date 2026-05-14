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

const PROFILE_COLUMNS = "id, username, display_name, avatar_url, bio, created_at, updated_at";
const BASE_PROFILE_COLUMNS = "id, username, display_name, created_at, updated_at";
const FORUM_POST_COLUMNS = "id, user_id, title, body, created_at, updated_at";
const FORUM_COMMENT_COLUMNS = "id, post_id, user_id, body, created_at, updated_at";

function withQueryTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function isMissingOptionalProfileColumn(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "42703" ||
    message.includes("avatar_url") ||
    message.includes("bio")
  );
}

function missingExtendedProfileColumnsError() {
  return new Error(
    "Profile save failed because the profiles table is missing avatar_url and/or bio. Add avatar_url text and bio text columns in Supabase."
  );
}

function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    avatar_url: "",
    bio: "",
    ...profile
  };
}

async function runProfileSelect(applyFilter, mode = "maybeSingle") {
  const run = async (columns) => {
    const query = applyFilter(supabase.from("profiles").select(columns));
    return query[mode]();
  };

  let result = await run(PROFILE_COLUMNS);
  if (result.error && isMissingOptionalProfileColumn(result.error)) {
    console.error("Supabase profile extended columns missing:", result.error);
    result = await run(BASE_PROFILE_COLUMNS);
  }

  if (result.data) {
    result.data = normalizeProfile(result.data);
  }
  return result;
}

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
  const { data, error } = await runProfileSelect((query) => query.eq("id", userId), "maybeSingle");

  if (error) throw error;
  return data;
}

export async function getCurrentUserProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (
      userError.name === "AuthSessionMissingError" ||
      /auth session missing|session.*missing/i.test(userError.message || "")
    ) {
      return { user: null, profile: null };
    }
    console.error("Supabase auth user lookup failed:", userError);
    throw userError;
  }

  const user = userData?.user || null;
  if (!user) return { user: null, profile: null };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  if (profileError) {
    if (isMissingOptionalProfileColumn(profileError)) {
      console.error("Supabase profile extended columns missing:", profileError);
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from("profiles")
        .select(BASE_PROFILE_COLUMNS)
        .eq("id", user.id)
        .single();

      if (!fallbackError) return { user, profile: normalizeProfile(fallbackProfile) };
      if (fallbackError.code === "PGRST116") return { user, profile: null };
      console.error("Supabase profile fallback lookup failed:", fallbackError);
      throw fallbackError;
    }

    console.error("Supabase profile lookup failed:", profileError);
    if (profileError.code === "PGRST116") {
      return { user, profile: null };
    }
    throw profileError;
  }

  return { user, profile: normalizeProfile(profile) };
}

export async function getProfileByUsername(username) {
  const clean = cleanUsername(username);
  if (!clean) return null;

  const { data, error } = await runProfileSelect((query) => query.eq("username", clean), "maybeSingle");
  if (error) {
    console.error("Supabase username profile lookup failed:", error);
    throw error;
  }
  return data;
}

export async function upsertProfile(profile, options = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be logged in to save a profile.");

  const username = cleanUsername(profile.username);
  if (!username) throw new Error("Username is required.");

  const displayName = String(profile.display_name || "").trim() || username;
  const includeExtended = !!options.includeExtended || "avatar_url" in profile || "bio" in profile;
  const payload = {
    id: user.id,
    username: username,
    display_name: displayName
  };

  if (includeExtended) {
    payload.avatar_url = String(profile.avatar_url || "").trim();
    payload.bio = String(profile.bio || "").trim().slice(0, 500);
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select(includeExtended ? PROFILE_COLUMNS : BASE_PROFILE_COLUMNS)
    .single();

  if (error) {
    console.error("Supabase profile save failed:", error);
    if (includeExtended && isMissingOptionalProfileColumn(error)) throw missingExtendedProfileColumnsError();
    throw error;
  }

  const normalized = normalizeProfile(data);
  window.dispatchEvent(new CustomEvent("um:profile-updated", { detail: normalized }));
  return normalized;
}

export async function getProfilesForUserIds(userIds) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  let { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", uniqueIds);

  if (error && isMissingOptionalProfileColumn(error)) {
    console.error("Supabase profile extended columns missing:", error);
    const fallback = await supabase
      .from("profiles")
      .select(BASE_PROFILE_COLUMNS)
      .in("id", uniqueIds);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("Supabase profile batch lookup failed:", error);
    throw error;
  }
  return new Map((data || []).map((profile) => {
    const normalized = normalizeProfile(profile);
    return [normalized.id, normalized];
  }));
}

async function getCurrentPostingProfile(action) {
  const user = await getCurrentUser();
  if (!user) throw new Error(`You need to be logged in to ${action}.`);

  let profile = null;
  try {
    profile = await getProfile(user.id);
  } catch (error) {
    console.error("Supabase posting profile lookup failed:", error);
    throw error;
  }

  if (!profile?.username) {
    throw new Error("Create a username on your profile before posting.");
  }

  return { user, profile };
}

async function attachForumAuthors(rows) {
  const profiles = await getProfilesForUserIds((rows || []).map((row) => row.user_id));
  return (rows || []).map((row) => ({
    ...row,
    author: profiles.get(row.user_id) || null
  }));
}

async function getCommentCounts(postIds) {
  const uniqueIds = [...new Set((postIds || []).filter(Boolean))];
  const counts = new Map(uniqueIds.map((id) => [id, 0]));
  if (!uniqueIds.length) return counts;

  const { data, error } = await supabase
    .from("forum_comments")
    .select("post_id")
    .in("post_id", uniqueIds);

  if (error) {
    console.error("Supabase forum comment counts failed:", error);
    throw error;
  }

  (data || []).forEach((comment) => {
    counts.set(comment.post_id, (counts.get(comment.post_id) || 0) + 1);
  });

  return counts;
}

export async function createPost({ title, body }) {
  const { user } = await getCurrentPostingProfile("post");

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
    .select(FORUM_POST_COLUMNS)
    .single();

  if (error) {
    console.error("Supabase forum post insert failed:", error);
    throw error;
  }
  return data;
}

export async function listPosts() {
  const { data, error } = await supabase
    .from("forum_posts")
    .select(FORUM_POST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Supabase forum posts lookup failed:", error);
    throw error;
  }

  const [posts, commentCounts] = await Promise.all([
    attachForumAuthors(data || []),
    getCommentCounts((data || []).map((post) => post.id))
  ]);

  return posts.map((post) => ({
    ...post,
    comment_count: commentCounts.get(post.id) || 0
  }));
}

export async function getPost(postId) {
  const id = Number.parseInt(postId, 10);
  if (!Number.isFinite(id)) throw new Error("Post id is invalid.");

  const { data: post, error: postError } = await supabase
    .from("forum_posts")
    .select(FORUM_POST_COLUMNS)
    .eq("id", id)
    .single();

  if (postError) {
    console.error("Supabase forum post detail lookup failed:", postError);
    throw postError;
  }

  const { data: comments, error: commentsError } = await supabase
    .from("forum_comments")
    .select(FORUM_COMMENT_COLUMNS)
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("Supabase forum comments lookup failed:", commentsError);
    throw commentsError;
  }

  const profiles = await getProfilesForUserIds([
    post.user_id,
    ...(comments || []).map((comment) => comment.user_id)
  ]);

  return {
    ...post,
    author: profiles.get(post.user_id) || null,
    comments: (comments || []).map((comment) => ({
      ...comment,
      author: profiles.get(comment.user_id) || null
    }))
  };
}

export async function createComment({ postId, body }) {
  const { user } = await getCurrentPostingProfile("comment");
  const id = Number.parseInt(postId, 10);
  const text = String(body || "").trim();

  if (!Number.isFinite(id)) throw new Error("Post id is invalid.");
  if (!text) throw new Error("Comment body is required.");

  const { data, error } = await supabase
    .from("forum_comments")
    .insert({
      post_id: id,
      user_id: user.id,
      body: text
    })
    .select(FORUM_COMMENT_COLUMNS)
    .single();

  if (error) {
    console.error("Supabase forum comment insert failed:", error);
    throw error;
  }

  const profiles = await getProfilesForUserIds([data.user_id]);
  return {
    ...data,
    author: profiles.get(data.user_id) || null
  };
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
    .schema("public")
    .from("game_scores")
    .insert(payload)
    .select("id, user_id, game, score, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listScores(game = "all") {
  let query = supabase
    .schema("public")
    .from("game_scores")
    .select("id, user_id, game, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (game && game !== "all") {
    query = query.eq("game", game);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Leaderboard query failed on public.game_scores: ${error.message}`);
  }

  let profiles = new Map();
  try {
    profiles = await withQueryTimeout(
      getProfilesForUserIds((data || []).map((score) => score.user_id)),
      5000,
      "Profile lookup timed out."
    );
  } catch (error) {
    console.warn("Scores loaded without profile names:", error);
  }

  return (data || []).map((score) => ({
    ...score,
    author: profiles.get(score.user_id) || null
  }));
}

export async function getUserActivity(userId) {
  if (!userId) return { posts: [], comments: [], scores: [], errors: [] };

  const activity = {
    posts: [],
    comments: [],
    scores: [],
    errors: []
  };

  const [postsResult, scoresResult, commentsResult] = await Promise.allSettled([
    supabase
      .from("forum_posts")
      .select("id, title, body, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .schema("public")
      .from("game_scores")
      .select("id, game, score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("forum_comments")
      .select("id, body, post_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  if (postsResult.status === "fulfilled") {
    if (postsResult.value.error) {
      console.error("Supabase user posts lookup failed:", postsResult.value.error);
      activity.errors.push(`Forum posts: ${postsResult.value.error.message}`);
    } else {
      activity.posts = postsResult.value.data || [];
    }
  } else {
    console.error("Supabase user posts lookup failed:", postsResult.reason);
    activity.errors.push(`Forum posts: ${postsResult.reason.message || postsResult.reason}`);
  }

  if (scoresResult.status === "fulfilled") {
    if (scoresResult.value.error) {
      console.error("Supabase user scores lookup failed:", scoresResult.value.error);
      activity.errors.push(`Scores: ${scoresResult.value.error.message}`);
    } else {
      activity.scores = scoresResult.value.data || [];
    }
  } else {
    console.error("Supabase user scores lookup failed:", scoresResult.reason);
    activity.errors.push(`Scores: ${scoresResult.reason.message || scoresResult.reason}`);
  }

  if (commentsResult.status === "fulfilled") {
    if (commentsResult.value.error) {
      console.error("Supabase user comments lookup failed:", commentsResult.value.error);
      activity.errors.push("Comments are not available yet.");
    } else {
      activity.comments = commentsResult.value.data || [];
    }
  } else {
    console.error("Supabase user comments lookup failed:", commentsResult.reason);
    activity.errors.push("Comments are not available yet.");
  }

  return activity;
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
