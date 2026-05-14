import {
  displayName as getDisplayName,
  getCurrentUser,
  getProfile,
  supabase
} from "./supabaseClient.js";

const DEFAULT_LABEL = "Login";
const FLOATING_LINK_ID = "umAuthFloatingLink";

function ensureFloatingAuthLink() {
  const existing = document.getElementById(FLOATING_LINK_ID);
  if (existing) return existing;

  const link = document.createElement("a");
  link.id = FLOATING_LINK_ID;
  link.href = new URL("../pages/login.html", import.meta.url).href;
  link.dataset.authLink = "";
  link.textContent = DEFAULT_LABEL;
  link.setAttribute("aria-label", "Account");

  const style = document.createElement("style");
  style.textContent = `
    #${FLOATING_LINK_ID} {
      position: fixed;
      top: max(0.65rem, env(safe-area-inset-top));
      right: max(0.65rem, env(safe-area-inset-right));
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
        right: max(0.45rem, env(safe-area-inset-right));
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
  link.title = label === DEFAULT_LABEL ? "Login" : `Signed in as ${label}`;
}

async function renderAuthNav() {
  let links = document.querySelectorAll("[data-auth-link]");
  if (!links.length) {
    ensureFloatingAuthLink();
    links = document.querySelectorAll("[data-auth-link]");
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      links.forEach((link) => setAuthLabel(link, DEFAULT_LABEL));
      return;
    }

    const profile = await getProfile(user.id);
    const label = getDisplayName(profile, user.email?.split("@")[0] || "Profile");
    links.forEach((link) => setAuthLabel(link, label));
  } catch (_error) {
    links.forEach((link) => setAuthLabel(link, DEFAULT_LABEL));
  }
}

renderAuthNav();
supabase.auth.onAuthStateChange(() => {
  renderAuthNav();
});
window.addEventListener("um:profile-updated", renderAuthNav);
