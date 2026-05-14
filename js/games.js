import {
  displayName,
  formatDate,
  getCurrentUserAndProfile,
  listScores,
  supabase
} from "./supabaseClient.js";

const els = {
  message: document.getElementById("message"),
  topScore: document.getElementById("topScore"),
  scoreCount: document.getElementById("scoreCount"),
  profileStatusName: document.getElementById("profileStatusName"),
  profileStatusDetail: document.getElementById("profileStatusDetail"),
  filterGame: document.getElementById("filterGame"),
  leaderboardTitle: document.getElementById("leaderboardTitle"),
  leaderboard: document.getElementById("leaderboard")
};

let currentUser = null;
let currentProfile = null;
let leaderboardError = false;
let authProfileError = false;
let pageLoading = true;
let lastAuthState = {
  user: null,
  profile: null,
  error: null
};

window.setTimeout(() => {
  if (!pageLoading) return;
  setMessage("Still loading. Please refresh or sign in again.", "error");
  console.log("Games page auth/profile state", lastAuthState);
  pageLoading = false;
  console.log("Page render complete");
}, 7000);

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `notice ${type}`.trim();
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(text || ""));
}

function setLinkedMessage(prefix, href, label, type = "error") {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.style.textDecoration = "underline";
  link.style.fontWeight = "950";

  els.message.replaceChildren(
    document.createTextNode(`${prefix} `),
    link,
    document.createTextNode(".")
  );
  els.message.className = `notice ${type}`.trim();
}

function setProfileStatus(name, detail) {
  els.profileStatusName.textContent = name;
  els.profileStatusDetail.textContent = detail;
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

function avatarNode(profile) {
  const url = avatarUrl(profile);
  if (!url) {
    const fallback = document.createElement("div");
    fallback.className = "score-avatar-fallback";
    fallback.textContent = initials(profile);
    return fallback;
  }

  const image = document.createElement("img");
  image.className = "score-avatar";
  image.src = url;
  image.alt = `${displayName(profile)} avatar`;
  image.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "score-avatar-fallback";
    fallback.textContent = initials(profile);
    image.replaceWith(fallback);
  }, { once: true });
  return image;
}

function withRejectTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
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

function renderEmptyLeaderboard(text, isError = false) {
  els.leaderboard.replaceChildren();
  els.scoreCount.textContent = "0";
  els.topScore.textContent = "0";

  const empty = document.createElement("div");
  empty.className = isError ? "empty notice error" : "empty";
  empty.textContent = text;
  els.leaderboard.appendChild(empty);
}

function renderScore(row, index) {
  const card = document.createElement("article");
  card.className = "score-row";

  const rank = document.createElement("div");
  rank.className = "rank";
  appendText(rank, String(index + 1));

  const avatar = avatarNode(row.author);

  const main = document.createElement("div");
  main.className = "score-main";

  const name = document.createElement("strong");
  appendText(name, displayName(row.author));

  const gameLine = document.createElement("span");
  gameLine.className = "game-line";
  appendText(gameLine, row.game || "Unknown Game");
  const meta = document.createElement("span");
  appendText(meta, `@${row.author?.username || "anonymous"} / ${formatDate(row.created_at)}`);
  main.append(name, gameLine, meta);

  const value = document.createElement("div");
  value.className = "score-value";
  appendText(value, Number(row.score || 0).toLocaleString());

  card.append(rank, avatar, main, value);
  return card;
}

async function refreshProfile() {
  const result = await withAuthTimeout(getCurrentUserAndProfile());
  lastAuthState = result;
  currentUser = result.user;
  currentProfile = result.profile;
  authProfileError = !!result.error;

  if (result.error) {
    console.error("Score profile detection failed:", result.error);
    setProfileStatus("Profile check failed", result.error.message);
    if (!leaderboardError) setMessage(result.error.message, "error");
    return;
  }

  if (!currentUser) {
    authProfileError = false;
    setProfileStatus("Not signed in", "Log in before playing if you want runs saved.");
    if (!leaderboardError) setLinkedMessage("Not signed in. Log in before playing if you want runs saved.", "./login.html", "Login", "");
    return;
  }

  if (!currentProfile?.username) {
    authProfileError = false;
    setProfileStatus(currentUser.email || "Signed in", "Profile missing. Create a username before scores can save.");
    if (!leaderboardError) setLinkedMessage("Profile missing. Create a username before scores can save.", "./profile.html", "Create your profile");
    return;
  }

  authProfileError = false;
  setProfileStatus(displayName(currentProfile), `@${currentProfile.username}`);
  if (!leaderboardError) setMessage("Profile loaded. Game runs will save automatically.", "ok");
}

async function refreshScores() {
  const selectedGame = els.filterGame.value;
  els.leaderboardTitle.textContent = selectedGame === "all" ? "Global Leaderboard" : `${selectedGame} Leaderboard`;
  let completed = false;
  const loadingTimeout = window.setTimeout(() => {
    if (completed) return;
    renderEmptyLeaderboard("Leaderboard is taking too long to load. Try refresh in a moment.", true);
    if (!authProfileError) setMessage("Leaderboard is taking too long to load. Your sign-in check can still finish separately.", "error");
  }, 8000);

  setMessage("Loading leaderboard...", "");
  renderEmptyLeaderboard("Loading leaderboard...");
  try {
    const scores = await withRejectTimeout(
      listScores(selectedGame),
      15000,
      "Leaderboard query timed out while reading public.game_scores."
    );
    completed = true;
    window.clearTimeout(loadingTimeout);
    leaderboardError = false;
    els.leaderboard.replaceChildren();
    els.scoreCount.textContent = scores.length;
    els.topScore.textContent = scores[0]?.score ? Number(scores[0].score).toLocaleString() : "0";

    if (!scores.length) {
      renderEmptyLeaderboard("No scores yet.");
      if (authProfileError) return;
      if (!currentUser) {
        setLinkedMessage("Not signed in. Log in before playing if you want runs saved.", "./login.html", "Login", "");
      } else if (!currentProfile?.username) {
        setLinkedMessage("Profile missing. Create a username before scores can save.", "./profile.html", "Create your profile");
      } else {
        setMessage("No scores yet. Play a game to post the first run.", "");
      }
      return;
    }

    scores.forEach((score, index) => els.leaderboard.appendChild(renderScore(score, index)));
    if (authProfileError) return;
    if (!currentUser) {
      setLinkedMessage("Not signed in. Log in before playing if you want runs saved.", "./login.html", "Login", "");
    } else if (!currentProfile?.username) {
      setLinkedMessage("Profile missing. Create a username before scores can save.", "./profile.html", "Create your profile");
    } else {
      setMessage("Leaderboard loaded.", "ok");
    }
  } catch (error) {
    completed = true;
    window.clearTimeout(loadingTimeout);
    leaderboardError = true;
    console.error("Leaderboard load failed:", error);
    const message = error?.message || "Leaderboard query failed.";
    setMessage(message, "error");
    renderEmptyLeaderboard(message, true);
  }
}

async function boot() {
  setMessage("Checking sign in...", "");
  renderEmptyLeaderboard("Loading leaderboard...");
  await refreshProfile();
  pageLoading = false;
  console.log("Page render complete");
  await refreshScores();
}

els.filterGame.addEventListener("change", refreshScores);
supabase.auth.onAuthStateChange(() => refreshProfile());
boot();
