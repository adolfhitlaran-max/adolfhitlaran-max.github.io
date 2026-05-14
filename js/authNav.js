(function () {
  const DEFAULT_LABEL = "Sign in";
  const FLOATING_LINK_ID = "umAuthFloatingLink";
  const DISPLAY_CACHE_KEY = "um.auth.displayName";
  const AUTH_MODULE_URL = new URL("./supabaseClient.js", document.currentScript.src).href;

  let resolveInitialAuth;
  window.UMAuth = { signedIn: false, user: null, profile: null, displayName: DEFAULT_LABEL };
  window.UMAuthReady = new Promise((resolve) => {
    resolveInitialAuth = resolve;
  });

  function loginUrl() {
    return new URL("../pages/login.html", document.currentScript.src).href;
  }

  function cachedLabel() {
    try {
      return localStorage.getItem(DISPLAY_CACHE_KEY) || "";
    } catch (_error) {
      return "";
    }
  }

  function cacheLabel(label) {
    try {
      if (label && label !== DEFAULT_LABEL) localStorage.setItem(DISPLAY_CACHE_KEY, label);
      else localStorage.removeItem(DISPLAY_CACHE_KEY);
    } catch (_error) {}
  }

  function ensureFloatingAuthLink() {
    const existing = document.getElementById(FLOATING_LINK_ID);
    if (existing) return existing;

    const link = document.createElement("a");
    link.id = FLOATING_LINK_ID;
    link.href = loginUrl();
    link.dataset.authLink = "";
    link.dataset.authFloating = "";
    link.textContent = cachedLabel() || DEFAULT_LABEL;
    link.setAttribute("aria-label", "Account");

    const style = document.createElement("style");
    style.textContent = `
      #${FLOATING_LINK_ID} {
        position: fixed;
        top: max(0.65rem, env(safe-area-inset-top));
        left: max(0.65rem, env(safe-area-inset-left));
        z-index: 2147483000;
        max-width: min(13rem, calc(100vw - 1.3rem));
        min-height: 2.35rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 999px;
        padding: 0.55rem 0.82rem;
        background: rgba(5, 6, 7, 0.78);
        color: #fff;
        box-shadow: 0 14px 38px rgba(0,0,0,0.38);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        font: 800 0.82rem/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        touch-action: manipulation;
      }

      #${FLOATING_LINK_ID}:hover {
        border-color: rgba(255,255,255,0.36);
        background: rgba(20, 24, 28, 0.88);
      }

      @media (max-width: 560px) {
        #${FLOATING_LINK_ID} {
          top: max(0.45rem, env(safe-area-inset-top));
          left: max(0.45rem, env(safe-area-inset-left));
          min-height: 2rem;
          max-width: min(10.5rem, calc(100vw - 0.9rem));
          padding: 0.45rem 0.66rem;
          font-size: 0.74rem;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(link);
    return link;
  }

  function setAuthLabel(link, label) {
    const icon = link.querySelector("svg, i");
    link.textContent = "";

    if (icon) {
      link.appendChild(icon);
      link.append(" ");
    }

    link.append(label);
    link.title = label === DEFAULT_LABEL ? "Sign in" : `Signed in as ${label}`;
  }

  function publishAuthState(authState) {
    window.UMAuth = authState;
    document.documentElement.dataset.authState = authState.signedIn ? "signed-in" : "signed-out";

    if (resolveInitialAuth) {
      resolveInitialAuth(window.UMAuth);
      resolveInitialAuth = null;
    }

    window.dispatchEvent(new CustomEvent("um:auth-ready", { detail: window.UMAuth }));
  }

  function paint(label) {
    ensureFloatingAuthLink();
    document.querySelectorAll("[data-auth-link]").forEach((link) => {
      setAuthLabel(link, label);
    });
  }

  async function renderAuthNav() {
    const cached = cachedLabel();
    paint(cached || DEFAULT_LABEL);

    try {
      const auth = await import(AUTH_MODULE_URL);
      const user = await auth.getCurrentUser();

      if (!user) {
        cacheLabel("");
        paint(DEFAULT_LABEL);
        publishAuthState({ signedIn: false, user: null, profile: null, displayName: DEFAULT_LABEL });
        return;
      }

      const profile = await auth.getProfile(user.id);
      const label = auth.displayName(profile, user.email?.split("@")[0] || "Profile");
      cacheLabel(label);
      paint(label);
      publishAuthState({ signedIn: true, user, profile, displayName: label });
    } catch (_error) {
      const fallback = cachedLabel() || DEFAULT_LABEL;
      paint(fallback);
      publishAuthState({ signedIn: fallback !== DEFAULT_LABEL, user: null, profile: null, displayName: fallback });
    }
  }

  ensureFloatingAuthLink();
  renderAuthNav();

  window.addEventListener("um:profile-updated", (event) => {
    const profile = event.detail || null;
    const label = profile?.display_name || profile?.username || cachedLabel() || DEFAULT_LABEL;
    cacheLabel(label);
    paint(label);
    renderAuthNav();
  });

  import(AUTH_MODULE_URL).then((auth) => {
    auth.supabase.auth.onAuthStateChange(() => {
      renderAuthNav();
    });
  }).catch(() => {});
})();
