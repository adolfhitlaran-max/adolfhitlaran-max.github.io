import {
  displayName as getDisplayName,
  getCurrentUser,
  getProfile,
  supabase
} from "./supabaseClient.js";

const DEFAULT_LABEL = "Login";

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
  const links = document.querySelectorAll("[data-auth-link]");
  if (!links.length) return;

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
