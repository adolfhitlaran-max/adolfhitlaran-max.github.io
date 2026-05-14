(function () {
  const SCRIPT_URL = document.currentScript?.src || new URL("./gameScoreBridge.js", window.location.href).href;
  const AUTH_MODULE_URL = new URL("./supabaseClient.js", SCRIPT_URL).href;
  const LOGIN_URL = new URL("../pages/login.html", SCRIPT_URL).href;
  const PROFILE_URL = new URL("../pages/profile.html", SCRIPT_URL).href;

  const state = {
    game: "Uncensored Arcade",
    title: "Leaderboard",
    root: null,
    toggle: null,
    panel: null,
    status: null,
    list: null,
    refresh: null,
    authModule: null,
    authReady: null,
    authListenerBound: false,
    open: false,
    saving: false,
    lastSubmitKey: "",
    lastSubmitAt: 0,
    rows: []
  };

  function loadAuthModule() {
    if (!state.authReady) {
      state.authReady = import(AUTH_MODULE_URL).then((auth) => {
        state.authModule = auth;
        if (!state.authListenerBound) {
          state.authListenerBound = true;
          auth.supabase.auth.onAuthStateChange(() => {
            refreshAuthStatus();
            refreshLeaderboard();
          });
        }
        return auth;
      });
    }
    return state.authReady;
  }

  function injectStyles() {
    if (document.getElementById("umGameScoreStyles")) return;
    const style = document.createElement("style");
    style.id = "umGameScoreStyles";
    style.textContent = `
      .um-score-widget {
        position: fixed;
        right: max(0.75rem, env(safe-area-inset-right));
        bottom: max(0.75rem, env(safe-area-inset-bottom));
        z-index: 2147482600;
        color: #f5f7ff;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        pointer-events: none;
      }

      .um-score-toggle,
      .um-score-panel {
        pointer-events: auto;
      }

      .um-score-toggle {
        min-height: 2.5rem;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 999px;
        padding: 0.55rem 0.85rem;
        background: rgba(5, 8, 12, 0.82);
        color: #fff;
        box-shadow: 0 14px 38px rgba(0,0,0,0.38);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        font-weight: 900;
        cursor: pointer;
      }

      .um-score-panel {
        width: min(22rem, calc(100vw - 1.5rem));
        max-height: min(34rem, calc(100dvh - 7rem));
        display: none;
        margin-bottom: 0.6rem;
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 8px;
        background: rgba(7, 10, 14, 0.94);
        box-shadow: 0 24px 70px rgba(0,0,0,0.48);
        overflow: hidden;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .um-score-widget.is-open .um-score-panel {
        display: block;
      }

      .um-score-head,
      .um-score-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        padding: 0.75rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .um-score-foot {
        border-top: 1px solid rgba(255,255,255,0.1);
        border-bottom: 0;
      }

      .um-score-head strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.92rem;
      }

      .um-score-close,
      .um-score-refresh {
        min-height: 2rem;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 999px;
        padding: 0.35rem 0.6rem;
        background: rgba(255,255,255,0.07);
        color: inherit;
        font-weight: 900;
        cursor: pointer;
      }

      .um-score-status {
        min-height: 2.4rem;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding: 0.65rem 0.75rem;
        color: rgba(245,247,255,0.78);
        font-size: 0.8rem;
        font-weight: 750;
        line-height: 1.35;
      }

      .um-score-status.ok {
        color: #b8ffcc;
      }

      .um-score-status.error {
        color: #ffd3d3;
      }

      .um-score-status a {
        color: #fff;
        font-weight: 950;
        text-decoration: underline;
      }

      .um-score-list {
        display: grid;
        gap: 0.45rem;
        max-height: 21rem;
        overflow: auto;
        padding: 0.65rem;
      }

      .um-score-row {
        display: grid;
        grid-template-columns: 2rem 2.35rem minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.55rem;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 0.55rem;
        background: rgba(255,255,255,0.045);
      }

      .um-score-rank {
        width: 1.9rem;
        height: 1.9rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255,184,61,0.32);
        color: #ffbf55;
        font-size: 0.78rem;
        font-weight: 950;
      }

      .um-score-avatar,
      .um-score-avatar-fallback {
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.14);
        background: #111820;
        object-fit: cover;
      }

      .um-score-avatar-fallback {
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #e5242a, #00d5ff);
        color: white;
        font-size: 0.7rem;
        font-weight: 950;
      }

      .um-score-name {
        min-width: 0;
        display: grid;
        gap: 0.05rem;
      }

      .um-score-name strong,
      .um-score-name span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .um-score-name strong {
        font-size: 0.82rem;
      }

      .um-score-name span {
        color: rgba(245,247,255,0.56);
        font-size: 0.72rem;
        font-weight: 760;
      }

      .um-score-value {
        color: #8fff6f;
        font-size: 1rem;
        font-weight: 950;
      }

      .um-score-empty {
        border: 1px dashed rgba(255,255,255,0.16);
        border-radius: 8px;
        padding: 0.8rem;
        color: rgba(245,247,255,0.62);
        font-size: 0.82rem;
      }

      @media (max-width: 760px), (hover: none), (pointer: coarse) {
        .um-score-widget {
          top: calc(max(0.6rem, env(safe-area-inset-top)) + 5.75rem);
          left: min(300px, calc(100vw - 5.8rem));
          right: auto;
          bottom: auto;
        }

        .um-score-panel {
          max-height: calc(100dvh - 8.5rem);
          margin-top: 0.5rem;
          margin-bottom: 0;
        }

        .um-score-widget.is-open .um-score-panel {
          display: block;
        }
      }

      @media (max-height: 430px) {
        .um-score-widget {
          top: max(0.35rem, env(safe-area-inset-top));
        }

        .um-score-panel {
          max-height: calc(100dvh - 3.5rem);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureWidget() {
    if (state.root) return state.root;
    injectStyles();

    const root = document.createElement("section");
    root.className = "um-score-widget";
    root.setAttribute("aria-label", "Game leaderboard");

    const panel = document.createElement("div");
    panel.className = "um-score-panel";

    const head = document.createElement("div");
    head.className = "um-score-head";
    const title = document.createElement("strong");
    title.dataset.scoreTitle = "";
    title.textContent = state.title;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "um-score-close";
    close.textContent = "Close";
    head.append(title, close);

    const status = document.createElement("div");
    status.className = "um-score-status";
    status.textContent = "Checking profile...";

    const list = document.createElement("div");
    list.className = "um-score-list";
    list.setAttribute("aria-live", "polite");

    const foot = document.createElement("div");
    foot.className = "um-score-foot";
    const profile = document.createElement("a");
    profile.href = PROFILE_URL;
    profile.textContent = "Profile";
    profile.className = "um-score-refresh";
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "um-score-refresh";
    refresh.textContent = "Refresh";
    foot.append(profile, refresh);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "um-score-toggle";
    toggle.textContent = "Scores";
    toggle.setAttribute("aria-expanded", "false");

    panel.append(head, status, list, foot);
    root.append(panel, toggle);

    toggle.addEventListener("click", () => setOpen(!state.open));
    close.addEventListener("click", () => setOpen(false));
    refresh.addEventListener("click", refreshLeaderboard);

    document.body.appendChild(root);

    state.root = root;
    state.toggle = toggle;
    state.panel = panel;
    state.status = status;
    state.list = list;
    state.refresh = refresh;
    return root;
  }

  function setOpen(open) {
    ensureWidget();
    state.open = !!open;
    state.root.classList.toggle("is-open", state.open);
    state.toggle.setAttribute("aria-expanded", String(state.open));
    if (state.open) refreshLeaderboard();
  }

  function setStatus(message, type = "", link) {
    ensureWidget();
    state.status.className = `um-score-status ${type}`.trim();
    state.status.replaceChildren(document.createTextNode(message));
    if (link) {
      state.status.append(" ");
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      state.status.appendChild(a);
      state.status.append(".");
    }
  }

  function displayName(profile) {
    if (state.authModule?.displayName) return state.authModule.displayName(profile);
    return profile?.display_name || profile?.username || "Anonymous";
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
    } catch (_error) {
      return "";
    }
  }

  function initials(profile) {
    return displayName(profile)
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "UM";
  }

  function avatarNode(profile) {
    const url = String(profile?.avatar_url || "").trim();
    if (url && /^https?:\/\//i.test(url)) {
      const img = document.createElement("img");
      img.className = "um-score-avatar";
      img.src = url;
      img.alt = "";
      img.addEventListener("error", () => img.replaceWith(fallbackAvatar(profile)), { once: true });
      return img;
    }
    return fallbackAvatar(profile);
  }

  function fallbackAvatar(profile) {
    const fallback = document.createElement("div");
    fallback.className = "um-score-avatar-fallback";
    fallback.textContent = initials(profile);
    return fallback;
  }

  function renderLeaderboard(rows) {
    ensureWidget();
    state.list.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "um-score-empty";
      empty.textContent = "No scores yet.";
      state.list.appendChild(empty);
      return;
    }

    rows.slice(0, 8).forEach((row, index) => {
      const card = document.createElement("article");
      card.className = "um-score-row";

      const rank = document.createElement("div");
      rank.className = "um-score-rank";
      rank.textContent = String(index + 1);

      const name = document.createElement("div");
      name.className = "um-score-name";
      const strong = document.createElement("strong");
      strong.textContent = displayName(row.author);
      const meta = document.createElement("span");
      meta.textContent = `@${row.author?.username || "anonymous"} / ${formatDate(row.created_at)}`;
      name.append(strong, meta);

      const score = document.createElement("div");
      score.className = "um-score-value";
      score.textContent = Number(row.score || 0).toLocaleString();

      card.append(rank, avatarNode(row.author), name, score);
      state.list.appendChild(card);
    });
  }

  async function refreshAuthStatus() {
    ensureWidget();
    try {
      const auth = await loadAuthModule();
      const result = await auth.getCurrentUserAndProfile();
      if (result.error) {
        console.error("In-game auth/profile check failed:", result.error);
        setStatus(result.error.message || "Profile check failed.", "error");
        return result;
      }

      if (!result.user) {
        setStatus("Sign in to save runs.", "", { href: LOGIN_URL, label: "Login" });
        return result;
      }

      if (!result.profile?.username) {
        setStatus("Create a profile username to save runs.", "error", { href: PROFILE_URL, label: "Profile" });
        return result;
      }

      setStatus(`Signed in as ${displayName(result.profile)}. Scores auto-save at run end.`, "ok");
      return result;
    } catch (error) {
      console.error("In-game auth/profile check failed:", error);
      setStatus(error.message || "Profile check failed.", "error");
      return { user: null, profile: null, error };
    }
  }

  async function refreshLeaderboard() {
    ensureWidget();
    state.list.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "um-score-empty";
    loading.textContent = "Loading leaderboard...";
    state.list.appendChild(loading);

    try {
      const auth = await loadAuthModule();
      const rows = await auth.listScores(state.game);
      state.rows = rows || [];
      renderLeaderboard(state.rows);
    } catch (error) {
      console.error("In-game leaderboard load failed:", error);
      state.list.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "um-score-empty";
      empty.textContent = error.message || "Leaderboard failed to load.";
      state.list.appendChild(empty);
    }
  }

  async function submitScore(score, options = {}) {
    ensureWidget();
    const numericScore = Math.max(0, Number.parseInt(score, 10) || 0);
    const game = String(options.game || state.game || "Uncensored Arcade").trim();
    const submitKey = `${game}:${numericScore}:${options.reason || "run"}`;
    const now = Date.now();
    if (state.saving || (state.lastSubmitKey === submitKey && now - state.lastSubmitAt < 8000)) {
      return { saved: false, skipped: true };
    }

    state.saving = true;
    state.lastSubmitKey = submitKey;
    state.lastSubmitAt = now;
    setStatus(`Saving ${numericScore.toLocaleString()}...`);

    try {
      const auth = await loadAuthModule();
      const current = await auth.getCurrentUserAndProfile();
      if (current.error) {
        console.error("In-game score auth/profile check failed:", current.error);
        setStatus(current.error.message || "Score was not saved.", "error");
        return { saved: false, error: current.error };
      }
      if (!current.user) {
        setStatus(`${numericScore.toLocaleString()} not saved. Sign in first.`, "error", { href: LOGIN_URL, label: "Login" });
        return { saved: false, reason: "login-required" };
      }
      if (!current.profile?.username) {
        setStatus(`${numericScore.toLocaleString()} not saved. Profile username required.`, "error", { href: PROFILE_URL, label: "Profile" });
        return { saved: false, reason: "profile-required" };
      }

      const saved = await auth.saveScore(game, numericScore);
      setStatus(`${numericScore.toLocaleString()} saved for ${displayName(current.profile)}.`, "ok");
      await refreshLeaderboard();
      window.dispatchEvent(new CustomEvent("um:score-saved", { detail: saved }));
      return { saved: true, score: saved };
    } catch (error) {
      console.error("In-game score save failed:", error);
      setStatus(error.message || "Score save failed.", "error");
      return { saved: false, error };
    } finally {
      state.saving = false;
    }
  }

  function resetRun() {
    state.lastSubmitKey = "";
    state.lastSubmitAt = 0;
  }

  function init(options = {}) {
    state.game = String(options.game || state.game).trim();
    state.title = String(options.title || `${state.game} Leaderboard`).trim();
    ensureWidget();
    const title = state.root.querySelector("[data-score-title]");
    if (title) title.textContent = state.title;
    refreshAuthStatus();
    refreshLeaderboard();
    return window.UMGameScores;
  }

  window.UMGameScores = {
    init,
    submitScore,
    refreshLeaderboard,
    refreshAuthStatus,
    resetRun,
    open: () => setOpen(true),
    close: () => setOpen(false)
  };
})();
