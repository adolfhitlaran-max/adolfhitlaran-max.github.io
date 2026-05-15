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

console.log("Supabase client ready");

const PROFILE_COLUMNS = "id, username, display_name, avatar_url, bio, created_at, updated_at";
const BASE_PROFILE_COLUMNS = "id, username, display_name, created_at, updated_at";
const FORUM_POST_COLUMNS = "id, user_id, title, body, created_at, updated_at";
const FORUM_COMMENT_COLUMNS = "id, post_id, user_id, body, created_at, updated_at";
const SUPABASE_REF = "dbkrtdzppymjxutivsmo";
const AVATAR_BUCKET = "avatars";
const AUTH_TIMEOUT_MS = 7000;
const SESSION_TIMEOUT_MS = 2500;
const QUERY_TIMEOUT_MS = 7000;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const GAME_SCORE_ALIASES = {
  "Neon Catch": ["Neon Catch", "George Floyd Game"],
  "George Floyd Game": ["Neon Catch", "George Floyd Game"],
  "ICE Roundup": ["ICE Roundup", "ICEGame"],
  ICEGame: ["ICE Roundup", "ICEGame"],
  "Road to Agartha": ["Road to Agartha", "Retard Radio The Game"],
  "Retard Radio The Game": ["Road to Agartha", "Retard Radio The Game"],
  "Conspiracy Pictionary": ["Conspiracy Pictionary", "conspiracy-pictionary"]
};
const GAME_SCORE_LABELS = {
  "George Floyd Game": "Neon Catch",
  ICEGame: "ICE Roundup",
  "Retard Radio The Game": "Road to Agartha",
  "conspiracy-pictionary": "Conspiracy Pictionary"
};

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

function isMissingAvatarBucket(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.statusCode === "404" ||
    error?.status === 404 ||
    message.includes("bucket not found") ||
    message.includes("storage bucket not found")
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

function getStoredSessionFallback() {
  try {
    const exactKey = `sb-${SUPABASE_REF}-auth-token`;
    const key = localStorage.getItem(exactKey)
      ? exactKey
      : Object.keys(localStorage).find((item) => item.startsWith("sb-") && item.endsWith("-auth-token"));
    if (!key) return null;

    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    const session = parsed?.currentSession || parsed?.session || parsed;
    if (session?.user) return { session };
  } catch (error) {
    console.warn("Stored Supabase session fallback failed:", error);
  }

  return null;
}

async function runProfileSelect(applyFilter, mode = "maybeSingle") {
  const run = async (columns) => {
    const query = applyFilter(supabase.from("profiles").select(columns));
    return withQueryTimeout(query[mode](), QUERY_TIMEOUT_MS, "Profile query timed out.");
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
  const storedSession = getStoredSessionFallback();
  if (storedSession?.session?.user) return storedSession.session;

  const { data, error } = await withQueryTimeout(
    supabase.auth.getSession(),
    SESSION_TIMEOUT_MS,
    "Supabase session check timed out."
  ).catch((sessionError) => ({
    data: getStoredSessionFallback(),
    error: getStoredSessionFallback() ? null : sessionError
  }));

  if (error) throw error;
  return data?.session || null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function getCurrentUserAndProfile() {
  console.log("Auth check started");
  const result = {
    user: null,
    profile: null,
    error: null
  };

  const storedSession = getStoredSessionFallback();
  const { data: sessionData, error: sessionError } = storedSession?.session?.user
    ? { data: storedSession, error: null }
    : await withQueryTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      "Supabase session check timed out."
    ).catch((error) => ({
      data: getStoredSessionFallback(),
      error: getStoredSessionFallback() ? null : error
    }));

  if (sessionError) {
    console.error("getSession error:", sessionError);
    result.error = sessionError;
    console.log("Auth check complete", { hasUser: false, hasError: true });
    console.log("Profile check complete", { hasProfile: false, error: true });
    return result;
  }

  const sessionUser = sessionData?.session?.user || null;
  if (!sessionUser) {
    console.log("Auth check complete", { hasUser: false, hasError: false });
    console.log("Profile check complete", { hasProfile: false, skipped: true });
    return result;
  }

  result.user = sessionUser;

  const { data: userData, error: userError } = storedSession?.session?.user
    ? { data: { user: sessionUser }, error: null }
    : await withQueryTimeout(
      supabase.auth.getUser(),
      3000,
      "Supabase user validation timed out."
    ).catch((error) => ({
      data: null,
      error
    }));

  console.log("Auth check complete", {
    hasUser: !!result.user,
    hasError: !!userError
  });

  if (userError) {
    console.warn("getUser validation skipped:", userError);
  } else if (userData?.user) {
    result.user = userData.user;
  }

  const { data: profile, error: profileError } = await withQueryTimeout(
    supabase
      .from("profiles")
      .select("*")
      .eq("id", result.user.id)
      .maybeSingle(),
    AUTH_TIMEOUT_MS,
    "Profile query timed out."
  ).catch((error) => ({
    data: null,
    error
  }));

  if (profileError) {
    console.error("profile load error:", profileError);
    result.error = profileError;
    console.log("Profile check complete", { hasProfile: false, error: true });
    return result;
  }

  result.profile = normalizeProfile(profile || null);
  console.log("Profile check complete", { hasProfile: !!result.profile });
  return result;
}

window.getCurrentUserAndProfile = getCurrentUserAndProfile;

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
  const result = await getCurrentUserAndProfile();
  if (result.error) throw result.error;
  return {
    user: result.user,
    profile: result.profile
  };
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

  const { data, error } = await withQueryTimeout(
    supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select(includeExtended ? PROFILE_COLUMNS : BASE_PROFILE_COLUMNS)
      .single(),
    QUERY_TIMEOUT_MS,
    "Profile save timed out."
  );

  if (error) {
    console.error("Supabase profile save failed:", error);
    if (includeExtended && isMissingOptionalProfileColumn(error)) throw missingExtendedProfileColumnsError();
    throw error;
  }

  const normalized = normalizeProfile(data);
  window.dispatchEvent(new CustomEvent("um:profile-updated", { detail: normalized }));
  return normalized;
}

export async function uploadAvatar(file) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be logged in to upload an avatar.");
  if (!file) throw new Error("Choose an image before uploading.");
  if (!/^image\//i.test(file.type || "")) throw new Error("Avatar must be an image file.");
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Avatar image must be 5MB or smaller.");

  const extension = (file.name || "avatar")
    .split(".")
    .pop()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8) || "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;

  const { error } = await withQueryTimeout(
    supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
        upsert: true
      }),
    QUERY_TIMEOUT_MS,
    "Avatar upload timed out."
  );

  if (error) {
    console.error("Supabase avatar upload failed:", error);
    if (isMissingAvatarBucket(error)) {
      throw new Error("Avatar upload failed because the Supabase Storage bucket 'avatars' does not exist yet. Run supabase/avatar-storage-setup.sql in the Supabase SQL Editor, then try again.");
    }
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Avatar uploaded, but Supabase did not return a public URL.");
  }

  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function getProfilesForUserIds(userIds) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  let { data, error } = await withQueryTimeout(
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .in("id", uniqueIds),
    QUERY_TIMEOUT_MS,
    "Profile batch lookup timed out."
  );

  if (error && isMissingOptionalProfileColumn(error)) {
    console.error("Supabase profile extended columns missing:", error);
    const fallback = await withQueryTimeout(
      supabase
        .from("profiles")
        .select(BASE_PROFILE_COLUMNS)
        .in("id", uniqueIds),
      QUERY_TIMEOUT_MS,
      "Profile fallback batch lookup timed out."
    );
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
  let profiles = new Map();
  try {
    profiles = await getProfilesForUserIds((rows || []).map((row) => row.user_id));
  } catch (error) {
    console.error("Forum profile attribution failed:", error);
  }

  return (rows || []).map((row) => ({
    ...row,
    author: profiles.get(row.user_id) || null
  }));
}

async function getCommentCounts(postIds) {
  const uniqueIds = [...new Set((postIds || []).filter(Boolean))];
  const counts = new Map(uniqueIds.map((id) => [id, 0]));
  if (!uniqueIds.length) return counts;

  const { data, error } = await withQueryTimeout(
    supabase
      .from("forum_comments")
      .select("post_id")
      .in("post_id", uniqueIds),
    QUERY_TIMEOUT_MS,
    "Forum comment count query timed out."
  );

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

  const { data, error } = await withQueryTimeout(
    supabase
      .from("forum_posts")
      .insert(payload)
      .select(FORUM_POST_COLUMNS)
      .single(),
    QUERY_TIMEOUT_MS,
    "Forum post insert timed out."
  );

  if (error) {
    console.error("Supabase forum post insert failed:", error);
    throw error;
  }
  return data;
}

export async function listPosts() {
  const { data, error } = await withQueryTimeout(
    supabase
      .from("forum_posts")
      .select(FORUM_POST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(100),
    QUERY_TIMEOUT_MS,
    "Forum posts query timed out."
  );

  if (error) {
    console.error("Supabase forum posts lookup failed:", error);
    throw error;
  }

  const posts = await attachForumAuthors(data || []);
  let commentCounts = new Map((data || []).map((post) => [post.id, 0]));
  try {
    commentCounts = await getCommentCounts((data || []).map((post) => post.id));
  } catch (error) {
    console.error("Forum comment counts unavailable:", error);
  }

  return posts.map((post) => ({
    ...post,
    comment_count: commentCounts.get(post.id) || 0
  }));
}

export async function getPost(postId) {
  const id = Number.parseInt(postId, 10);
  if (!Number.isFinite(id)) throw new Error("Post id is invalid.");

  const { data: post, error: postError } = await withQueryTimeout(
    supabase
      .from("forum_posts")
      .select(FORUM_POST_COLUMNS)
      .eq("id", id)
      .single(),
    QUERY_TIMEOUT_MS,
    "Forum post detail query timed out."
  );

  if (postError) {
    console.error("Supabase forum post detail lookup failed:", postError);
    throw postError;
  }

  const { data: comments, error: commentsError } = await withQueryTimeout(
    supabase
      .from("forum_comments")
      .select(FORUM_COMMENT_COLUMNS)
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    QUERY_TIMEOUT_MS,
    "Forum comments query timed out."
  );

  if (commentsError) {
    console.error("Supabase forum comments lookup failed:", commentsError);
    throw commentsError;
  }

  let profiles = new Map();
  try {
    profiles = await getProfilesForUserIds([
      post.user_id,
      ...(comments || []).map((comment) => comment.user_id)
    ]);
  } catch (error) {
    console.error("Forum detail profile attribution failed:", error);
  }

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

  const { data, error } = await withQueryTimeout(
    supabase
      .from("forum_comments")
      .insert({
        post_id: id,
        user_id: user.id,
        body: text
      })
      .select(FORUM_COMMENT_COLUMNS)
      .single(),
    QUERY_TIMEOUT_MS,
    "Forum comment insert timed out."
  );

  if (error) {
    console.error("Supabase forum comment insert failed:", error);
    throw error;
  }

  let profiles = new Map();
  try {
    profiles = await getProfilesForUserIds([data.user_id]);
  } catch (error) {
    console.error("Forum comment profile attribution failed:", error);
  }
  return {
    ...data,
    author: profiles.get(data.user_id) || null
  };
}

export async function saveScore(game, score) {
  const { user, profile, error: profileError } = await getCurrentUserAndProfile();
  if (profileError) {
    console.error("Score auth/profile check failed:", profileError);
    throw profileError;
  }

  if (!user) throw new Error("You need to be logged in to submit a score.");
  if (!profile?.username) throw new Error("Create a profile username before submitting scores.");

  const numericScore = Number.parseInt(score, 10);
  if (!Number.isFinite(numericScore) || numericScore < 0) {
    throw new Error("Score must be a positive number.");
  }

  const rawGame = String(game || "Uncensored Arcade").trim() || "Uncensored Arcade";
  const payload = {
    user_id: user.id,
    game: friendlyGameName(rawGame),
    score: numericScore
  };

  const { data, error } = await withQueryTimeout(
    supabase
      .schema("public")
      .from("game_scores")
      .insert(payload)
      .select("id, user_id, game, score, created_at")
      .single(),
    QUERY_TIMEOUT_MS,
    "Score submit timed out."
  );

  if (error) {
    console.error("Score insert failed on public.game_scores:", error);
    throw error;
  }

  return {
    ...data,
    author: profile
  };
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
    const gameNames = scoreGameAliases(game);
    if (gameNames.length) {
      query = gameNames.length > 1 ? query.in("game", gameNames) : query.eq("game", gameNames[0]);
    }
  }

  const { data, error } = await withQueryTimeout(
    query,
    QUERY_TIMEOUT_MS,
    "Leaderboard query timed out while reading public.game_scores."
  );
  if (error) {
    console.error("Leaderboard query failed on public.game_scores:", error);
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
    console.error("Scores loaded without profile names:", error);
  }

  return (data || []).map((score) => ({
    ...score,
    game: friendlyGameName(score.game),
    author: profiles.get(score.user_id) || null
  }));
}

export function scoreGameAliases(game) {
  const clean = String(game || "").trim();
  if (!clean || clean === "all") return [];
  return GAME_SCORE_ALIASES[clean] || [clean];
}

export function friendlyGameName(game) {
  const clean = String(game || "").trim();
  return GAME_SCORE_LABELS[clean] || clean || "Unknown Game";
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
