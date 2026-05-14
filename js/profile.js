import {
  cleanUsername,
  displayName,
  formatDate,
  getCurrentUserAndProfile,
  getProfile,
  getProfileByUsername,
  getUserActivity,
  upsertProfile
} from "./supabaseClient.js";

const els = {
  message: document.getElementById("message"),
  profileShell: document.getElementById("profileShell"),
  profileCard: document.getElementById("profileCard"),
  avatarImage: document.getElementById("avatarImage"),
  avatarFallback: document.getElementById("avatarFallback"),
  username: document.getElementById("profileUsername"),
  displayName: document.getElementById("profileDisplayName"),
  bio: document.getElementById("profileBio"),
  joined: document.getElementById("profileJoined"),
  activitySummary: document.getElementById("activitySummary"),
  postsList: document.getElementById("postsList"),
  commentsList: document.getElementById("commentsList"),
  scoresList: document.getElementById("scoresList"),
  activityErrors: document.getElementById("activityErrors"),
  editPanel: document.getElementById("editPanel"),
  editTitle: document.getElementById("editTitle"),
  editForm: document.getElementById("editForm"),
  editUsername: document.getElementById("editUsername"),
  editDisplayName: document.getElementById("editDisplayName"),
  editAvatarUrl: document.getElementById("editAvatarUrl"),
  editBio: document.getElementById("editBio"),
  setupPanel: document.getElementById("setupPanel")
};

let currentUser = null;
let activeProfile = null;
let pageLoading = true;
let lastAuthState = {
  user: null,
  profile: null,
  error: null
};

window.setTimeout(() => {
  if (!pageLoading) return;
  setMessage("Still loading. Please refresh or sign in again.", "error");
  console.log("Profile page auth/profile state", lastAuthState);
  pageLoading = false;
  console.log("Page render complete");
}, 7000);

function fillEditForm(profile = {}) {
  els.editUsername.value = profile.username || "";
  els.editDisplayName.value = profile.display_name || "";
  els.editAvatarUrl.value = profile.avatar_url || "";
  els.editBio.value = profile.bio || "";
}

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `notice ${type}`.trim();
}

function withAuthTimeout(promise) {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => {
      resolve({
        user: null,
        profile: null,
        error: new Error("Still loading. Please refresh or sign in again.")
      });
    }, 7000);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(text || ""));
}

function initials(profile) {
  const source = displayName(profile, profile?.username || "UM");
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "UM";
}

function avatarUrl(profile) {
  const value = String(profile?.avatar_url || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return value;
  } catch (_error) {}
  return "";
}

function profileLink(profile) {
  if (!profile?.username) return "./profile.html";
  return `./profile.html?username=${encodeURIComponent(profile.username)}`;
}

function renderDefaultProfile(message, canCreate = false) {
  els.profileShell.hidden = false;
  els.profileCard.hidden = true;
  els.editPanel.hidden = !canCreate;
  els.setupPanel.hidden = canCreate;
  els.setupPanel.querySelector("p").textContent = message;

  if (canCreate) {
    els.editTitle.textContent = "Create Profile";
    fillEditForm({
      username: cleanUsername((currentUser?.email || "").split("@")[0])
    });
  }
}

function renderProfile(profile, isOwnProfile) {
  activeProfile = profile;
  els.profileShell.hidden = false;
  els.profileCard.hidden = false;
  els.setupPanel.hidden = true;

  const url = avatarUrl(profile);
  if (url) {
    els.avatarImage.src = url;
    els.avatarImage.alt = `${displayName(profile, profile.username)} avatar`;
    els.avatarImage.hidden = false;
    els.avatarFallback.hidden = true;
  } else {
    els.avatarImage.removeAttribute("src");
    els.avatarImage.hidden = true;
    els.avatarFallback.hidden = false;
    els.avatarFallback.textContent = initials(profile);
  }

  els.username.textContent = `@${profile.username || "unnamed"}`;
  els.displayName.textContent = displayName(profile, "Unnamed Profile");
  els.bio.textContent = profile.bio || "No bio yet.";
  els.joined.textContent = profile.created_at ? `Joined ${formatDate(profile.created_at)}` : "Joined date unavailable";

  els.editPanel.hidden = !isOwnProfile;
  if (isOwnProfile) {
    els.editTitle.textContent = "Edit Profile";
    fillEditForm(profile);
  }
}

function renderList(container, items, renderItem, emptyText) {
  container.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "activity-empty";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => container.appendChild(renderItem(item)));
}

function activityItem(title, meta, body) {
  const article = document.createElement("article");
  article.className = "activity-item";

  const heading = document.createElement("strong");
  appendText(heading, title);

  const detail = document.createElement("span");
  appendText(detail, meta);

  article.append(heading, detail);
  if (body) {
    const copy = document.createElement("p");
    appendText(copy, body);
    article.appendChild(copy);
  }
  return article;
}

async function renderActivity(profile) {
  els.activitySummary.textContent = "Loading activity...";
  els.activityErrors.replaceChildren();

  try {
    const activity = await getUserActivity(profile.id);
    const postCount = activity.posts.length;
    const commentCount = activity.comments.length;
    const scoreCount = activity.scores.length;
    els.activitySummary.textContent = `${postCount} recent posts / ${commentCount} recent comments / ${scoreCount} recent scores`;

    renderList(
      els.postsList,
      activity.posts,
      (post) => activityItem(post.title || "Untitled post", formatDate(post.created_at), post.body),
      "No recent forum posts."
    );

    renderList(
      els.commentsList,
      activity.comments,
      (comment) => activityItem("Comment", formatDate(comment.created_at), comment.body),
      "No recent comments."
    );

    renderList(
      els.scoresList,
      activity.scores,
      (score) => activityItem(score.game || "Game", `${Number(score.score || 0).toLocaleString()} points / ${formatDate(score.created_at)}`),
      "No recent game scores."
    );

    if (activity.errors.length) {
      const note = document.createElement("div");
      note.className = "notice";
      note.textContent = activity.errors.join(" ");
      els.activityErrors.appendChild(note);
    }
  } catch (error) {
    console.error("Profile activity load failed:", error);
    els.activitySummary.textContent = "Activity could not be loaded.";
    const note = document.createElement("div");
    note.className = "notice error";
    note.textContent = error.message;
    els.activityErrors.appendChild(note);
  }
}

async function loadRequestedProfile() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");
  const requestedUsername = params.get("username");
  const auth = await withAuthTimeout(getCurrentUserAndProfile());
  lastAuthState = auth;
  currentUser = auth.user;

  if (auth.error) return { profile: null, auth };
  if (requestedId) return { profile: await getProfile(requestedId), auth };
  if (requestedUsername) return { profile: await getProfileByUsername(requestedUsername), auth };
  return { profile: auth.profile, auth };
}

async function boot() {
  setMessage("Loading profile...", "");

  try {
    const { profile, auth } = await loadRequestedProfile();
    if (auth.error) {
      renderDefaultProfile("Profile could not be loaded.");
      setMessage(`Profile load failed: ${auth.error.message}`, "error");
      return;
    }

    if (!profile) {
      const setupText = auth.user
        ? "No profile exists yet for this account."
        : "Not signed in. Sign in to create and view your profile.";
      renderDefaultProfile(setupText, !!auth.user);
      setMessage(setupText, auth.user ? "ok" : "");
      return;
    }

    const isOwnProfile = !!(auth.user && auth.user.id === profile.id);
    renderProfile(profile, isOwnProfile);
    setMessage(isOwnProfile ? "Your profile is loaded." : "Profile loaded.", "ok");
    await renderActivity(profile);
  } catch (error) {
    console.error("Profile page load failed:", error);
    renderDefaultProfile("Profile could not be loaded.");
    setMessage(error.message, "error");
  } finally {
    pageLoading = false;
    console.log("Page render complete");
  }
}

els.editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    setMessage("Sign in before editing your profile.", "error");
    return;
  }

  try {
    const profile = await upsertProfile({
      username: els.editUsername.value,
      display_name: els.editDisplayName.value,
      avatar_url: els.editAvatarUrl.value,
      bio: els.editBio.value
    }, { includeExtended: true });

    const url = profileLink(profile);
    window.history.replaceState({}, "", url);
    renderProfile(profile, true);
    setMessage("Profile saved.", "ok");
    await renderActivity(profile);
  } catch (error) {
    console.error("Profile save failed:", error);
    setMessage(error.message, "error");
  }
});

boot();
