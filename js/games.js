import {
  displayName,
  formatDate,
  getCurrentUserAndProfile,
  listScores,
  submitScore,
  supabase
} from "./supabaseClient.js";

const els = {
  message: document.getElementById("message"),
  topScore: document.getElementById("topScore"),
  scoreCount: document.getElementById("scoreCount"),
  profileStatusName: document.getElementById("profileStatusName"),
  profileStatusDetail: document.getElementById("profileStatusDetail"),
  scoreForm: document.getElementById("scoreForm"),
  gameName: document.getElementById("gameName"),
  scoreValue: document.getElementById("scoreValue"),
  filterGame: document.getElementById("filterGame"),
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

  const main = document.createElement("div");
  main.className = "score-main";

  const name = document.createElement("strong");
  appendText(name, `@${row.author?.username || "anonymous"} - ${displayName(row.author)}`);

  const meta = document.createElement("span");
  appendText(meta, `${row.game} / ${formatDate(row.created_at)}`);
  main.append(name, meta);

  const value = document.createElement("div");
  value.className = "score-value";
  appendText(value, Number(row.score || 0).toLocaleString());

  card.append(rank, main, value);
  return card;
}

async function refreshProfile() {
  const result = await withAuthTimeout(getCurrentUserAndProfile());
  lastAuthState = result;
  currentUser = result.user;
  currentProfile = result.profile;
  authProfileError = !!result.error;
  els.scoreForm.querySelector("button").disabled = !currentProfile?.username;

  if (result.error) {
    console.error("Score profile detection failed:", result.error);
    setProfileStatus("Profile check failed", result.error.message);
    if (!leaderboardError) setMessage(result.error.message, "error");
    return;
  }

  if (!currentUser) {
    authProfileError = false;
    setProfileStatus("Not signed in", "Log in before submitting scores.");
    if (!leaderboardError) setLinkedMessage("Not signed in. Log in before submitting scores.", "./login.html", "Login", "");
    return;
  }

  if (!currentProfile?.username) {
    authProfileError = false;
    setProfileStatus(currentUser.email || "Signed in", "Profile missing. Create a username before submitting scores.");
    if (!leaderboardError) setLinkedMessage("Profile missing. Create a username before submitting scores.", "./profile.html", "Create your profile");
    return;
  }

  authProfileError = false;
  setProfileStatus(displayName(currentProfile), `@${currentProfile.username}`);
  if (!leaderboardError) setMessage("Profile loaded. You can submit scores.", "ok");
}

async function refreshScores() {
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
      listScores(els.filterGame.value),
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
        setLinkedMessage("Not signed in. Log in before submitting scores.", "./login.html", "Login", "");
      } else if (!currentProfile?.username) {
        setLinkedMessage("Profile missing. Create a username before submitting scores.", "./profile.html", "Create your profile");
      } else {
        setMessage("No scores yet. Submit the first run.", "");
      }
      return;
    }

    scores.forEach((score, index) => els.leaderboard.appendChild(renderScore(score, index)));
    if (authProfileError) return;
    if (!currentUser) {
      setLinkedMessage("Not signed in. Log in before submitting scores.", "./login.html", "Login", "");
    } else if (!currentProfile?.username) {
      setLinkedMessage("Profile missing. Create a username before submitting scores.", "./profile.html", "Create your profile");
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

els.scoreForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentProfile?.username) {
    setLinkedMessage("Profile missing. Create a username before submitting scores.", "./profile.html", "Create your profile");
    return;
  }

  try {
    await submitScore({
      game: els.gameName.value,
      score: els.scoreValue.value
    });
    els.scoreForm.reset();
    setMessage("Score submitted.", "ok");
    await refreshScores();
  } catch (error) {
    console.error("Score submit failed:", error);
    setMessage(error.message, "error");
  }
});

els.filterGame.addEventListener("change", refreshScores);
supabase.auth.onAuthStateChange(() => refreshProfile());
boot();
