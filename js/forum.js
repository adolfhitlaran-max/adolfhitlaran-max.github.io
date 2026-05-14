import {
  createComment,
  createPost,
  displayName,
  formatDate,
  getCurrentUserAndProfile,
  getPost,
  listPosts,
  supabase
} from "./supabaseClient.js";

const els = {
  message: document.getElementById("message"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileName: document.getElementById("profileName"),
  profileDetail: document.getElementById("profileDetail"),
  postForm: document.getElementById("postForm"),
  postTitle: document.getElementById("postTitle"),
  postBody: document.getElementById("postBody"),
  postList: document.getElementById("postList"),
  refreshBtn: document.getElementById("refreshBtn"),
  detailPlaceholder: document.getElementById("detailPlaceholder"),
  detailContent: document.getElementById("detailContent"),
  detailAvatar: document.getElementById("detailAvatar"),
  detailIdentity: document.getElementById("detailIdentity"),
  detailTitle: document.getElementById("detailTitle"),
  detailMeta: document.getElementById("detailMeta"),
  detailBody: document.getElementById("detailBody"),
  detailCommentCount: document.getElementById("detailCommentCount"),
  commentList: document.getElementById("commentList"),
  commentForm: document.getElementById("commentForm"),
  commentBody: document.getElementById("commentBody"),
  commentNote: document.getElementById("commentNote")
};

let currentUser = null;
let currentProfile = null;
let activePostId = null;
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
  console.log("Forum page auth/profile state", lastAuthState);
  pageLoading = false;
  console.log("Page render complete");
}, 7000);

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `notice ${type}`.trim();
}

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => {
      resolve({
        user: null,
        profile: null,
        error: new Error(message)
      });
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(text || ""));
}

function profileUrl(profile) {
  if (!profile?.username) return "./profile.html";
  return `./profile.html?username=${encodeURIComponent(profile.username)}`;
}

function initials(profile) {
  const source = displayName(profile, "UM");
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

function avatarFallback(profile) {
  const fallback = document.createElement("div");
  fallback.className = "avatar-fallback";
  fallback.textContent = initials(profile);
  return fallback;
}

function avatarNode(profile) {
  const url = avatarUrl(profile);
  if (!url) return avatarFallback(profile);

  const image = document.createElement("img");
  image.className = "avatar";
  image.src = url;
  image.alt = `${displayName(profile)} avatar`;
  image.addEventListener("error", () => image.replaceWith(avatarFallback(profile)), { once: true });
  return image;
}

function renderIdentity(container, profile, options = {}) {
  const name = document.createElement("strong");
  appendText(name, displayName(profile));

  const handle = document.createElement("span");
  appendText(handle, profile?.username ? `@${profile.username}` : options.fallbackHandle || "@anonymous");

  if (profile?.username) {
    const link = document.createElement("a");
    link.href = profileUrl(profile);
    link.append(name, handle);
    container.replaceChildren(link);
  } else {
    container.replaceChildren(name, handle);
  }
}

function setLinkedMessage(target, prefix, href, label) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.style.textDecoration = "underline";
  link.style.fontWeight = "950";

  target.replaceChildren(
    document.createTextNode(`${prefix} `),
    link,
    document.createTextNode(".")
  );
}

function commentLabel(count) {
  const number = Number(count || 0);
  return `${number.toLocaleString()} ${number === 1 ? "comment" : "comments"}`;
}

function previewText(body) {
  const text = String(body || "").replace(/\s+/g, " ").trim();
  if (text.length <= 220) return text;
  return `${text.slice(0, 217)}...`;
}

function updatePostSelection() {
  els.postList.querySelectorAll("[data-post-id]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.postId) === Number(activePostId));
  });
}

function updateCommentFormState() {
  const canComment = !!activePostId && !!currentProfile?.username;
  els.commentBody.disabled = !canComment;
  els.commentForm.querySelector("button").disabled = !canComment;

  if (!activePostId) {
    els.commentNote.textContent = "";
  } else if (!currentUser) {
    setLinkedMessage(els.commentNote, "Log in before commenting.", "./login.html", "Login");
  } else if (!currentProfile?.username) {
    setLinkedMessage(els.commentNote, "Create a username before commenting.", "./profile.html", "Create your profile");
  } else {
    els.commentNote.textContent = `Commenting as @${currentProfile.username}`;
  }
}

function renderPostCard(post) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "post-card";
  button.dataset.postId = post.id;

  const author = document.createElement("div");
  author.className = "author-row";
  const authorAvatar = avatarNode(post.author);
  const identity = document.createElement("div");
  identity.className = "identity";
  renderIdentity(identity, post.author);
  author.append(authorAvatar, identity);

  const title = document.createElement("h3");
  appendText(title, post.title || "Untitled thread");

  const preview = document.createElement("p");
  preview.className = "preview";
  appendText(preview, previewText(post.body));

  const footer = document.createElement("div");
  footer.className = "post-footer";

  const time = document.createElement("span");
  appendText(time, formatDate(post.created_at));
  const comments = document.createElement("span");
  comments.className = "pill";
  appendText(comments, commentLabel(post.comment_count));

  footer.append(time, comments);
  button.append(author, title, preview, footer);
  button.addEventListener("click", () => openPost(post.id));
  return button;
}

function renderEmpty(target, text) {
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = text;
  target.replaceChildren(empty);
}

function renderComments(comments) {
  els.commentList.replaceChildren();

  if (!comments.length) {
    renderEmpty(els.commentList, "No comments yet.");
    return;
  }

  comments.forEach((comment) => {
    const article = document.createElement("article");
    article.className = "comment-card";

    const author = document.createElement("div");
    author.className = "author-row";
    const identity = document.createElement("div");
    identity.className = "identity";
    renderIdentity(identity, comment.author);
    author.append(avatarNode(comment.author), identity);

    const meta = document.createElement("div");
    meta.className = "meta";
    appendText(meta, formatDate(comment.created_at));

    const body = document.createElement("p");
    body.className = "comment-body";
    appendText(body, comment.body);

    article.append(author, meta, body);
    els.commentList.appendChild(article);
  });
}

function renderPostDetail(post) {
  els.detailPlaceholder.hidden = true;
  els.detailContent.hidden = false;
  els.detailAvatar.replaceChildren(avatarNode(post.author));
  renderIdentity(els.detailIdentity, post.author);
  els.detailTitle.textContent = post.title || "Untitled thread";
  els.detailBody.textContent = post.body || "";
  els.detailCommentCount.textContent = commentLabel(post.comments.length);

  const time = document.createElement("span");
  appendText(time, formatDate(post.created_at));
  const updated = document.createElement("span");
  appendText(updated, post.updated_at && post.updated_at !== post.created_at ? `Updated ${formatDate(post.updated_at)}` : "");
  els.detailMeta.replaceChildren(time);
  if (updated.textContent) els.detailMeta.appendChild(updated);

  renderComments(post.comments);
  updateCommentFormState();
}

function showDetailPlaceholder(text) {
  els.detailPlaceholder.hidden = false;
  els.detailPlaceholder.textContent = text;
  els.detailContent.hidden = true;
}

async function refreshProfile() {
  try {
    const result = await withTimeout(
      getCurrentUserAndProfile(),
      7000,
      "Still loading. Please refresh or sign in again."
    );
    lastAuthState = result;
    currentUser = result.user;
    currentProfile = result.profile;
    authProfileError = !!result.error;

    if (result.error) {
      console.error("Forum auth/profile load failed:", result.error);
      els.profileAvatar.replaceChildren(avatarFallback(null));
      els.profileName.textContent = currentUser ? "Profile error" : "Not signed in";
      els.profileDetail.textContent = result.error.message;
      els.postForm.querySelector("button").disabled = true;
      setMessage(result.error.message, "error");
      updateCommentFormState();
      return;
    }

    if (!currentUser) {
      authProfileError = false;
      currentProfile = null;
      els.profileAvatar.replaceChildren(avatarFallback(null));
      els.profileName.textContent = "Signed out";
      setLinkedMessage(els.profileDetail, "Not signed in.", "./login.html", "Login");
      els.postForm.querySelector("button").disabled = true;
      updateCommentFormState();
      return;
    }

    if (!currentProfile?.username) {
      authProfileError = false;
      els.profileAvatar.replaceChildren(avatarFallback(null));
      els.profileName.textContent = currentUser.email || "Logged in";
      setLinkedMessage(els.profileDetail, "No username yet.", "./profile.html", "Create your profile");
      els.postForm.querySelector("button").disabled = true;
      updateCommentFormState();
      return;
    }

    authProfileError = false;
    els.profileAvatar.replaceChildren(avatarNode(currentProfile));
    els.profileName.textContent = displayName(currentProfile);
    els.profileDetail.textContent = `@${currentProfile.username}`;
    els.postForm.querySelector("button").disabled = false;
    updateCommentFormState();
  } catch (error) {
    console.error("Forum profile detection failed:", error);
    authProfileError = true;
    lastAuthState = { user: null, profile: null, error };
    setMessage(error.message, "error");
    currentUser = null;
    currentProfile = null;
    els.postForm.querySelector("button").disabled = true;
    updateCommentFormState();
  }
}

async function refreshPosts() {
  let completed = false;
  const loadingTimeout = window.setTimeout(() => {
    if (completed) return;
    renderEmpty(els.postList, "Forum posts are taking too long to load. Try refresh in a moment.");
    if (!authProfileError) setMessage("Forum posts are taking too long to load. Your sign-in check can still finish separately.", "error");
  }, 8000);

  try {
    renderEmpty(els.postList, "Loading forum posts...");
    const posts = await listPosts();
    completed = true;
    window.clearTimeout(loadingTimeout);
    if (!posts.length) {
      renderEmpty(els.postList, "No posts yet. Start the first thread.");
      showDetailPlaceholder("Open a post to read the thread.");
    } else {
      els.postList.replaceChildren(...posts.map(renderPostCard));
      updatePostSelection();
    }

    if (authProfileError) return;
    if (!currentUser) {
      setLinkedMessage(els.message, "Not signed in.", "./login.html", "Login");
    } else if (!currentProfile?.username) {
      setLinkedMessage(els.message, "Profile missing.", "./profile.html", "Create your profile");
    } else {
      setMessage("Forum synced.", "ok");
    }

    const requestedPost = new URLSearchParams(window.location.search).get("post");
    if (!activePostId && requestedPost) {
      await openPost(requestedPost, { updateUrl: false });
    }
  } catch (error) {
    completed = true;
    window.clearTimeout(loadingTimeout);
    console.error("Forum posts load failed:", error);
    setMessage(error.message, "error");
    renderEmpty(els.postList, "Posts could not be loaded.");
  }
}

async function openPost(postId, options = {}) {
  const id = Number.parseInt(postId, 10);
  if (!Number.isFinite(id)) return;

  activePostId = id;
  updatePostSelection();
  showDetailPlaceholder("Loading thread...");

  try {
    const post = await getPost(id);
    activePostId = post.id;
    renderPostDetail(post);
    updatePostSelection();

    if (options.updateUrl !== false) {
      window.history.replaceState({}, "", `./forum.html?post=${encodeURIComponent(post.id)}`);
    }
  } catch (error) {
    console.error("Forum post detail load failed:", error);
    setMessage(error.message, "error");
    showDetailPlaceholder("Thread could not be loaded.");
  }
}

async function boot() {
  setMessage("Checking sign in...", "");
  renderEmpty(els.postList, "Loading forum posts...");
  showDetailPlaceholder("Open a post to read the thread.");
  await refreshProfile();
  pageLoading = false;
  console.log("Page render complete");
  await refreshPosts();
}

els.postForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentProfile?.username) {
    setMessage("Create a username before posting.", "error");
    setLinkedMessage(els.message, "Create a username before posting.", "./profile.html", "Create your profile");
    return;
  }

  try {
    const post = await createPost({
      title: els.postTitle.value,
      body: els.postBody.value
    });

    els.postForm.reset();
    setMessage("Post published.", "ok");
    activePostId = post.id;
    await refreshPosts();
    await openPost(post.id);
  } catch (error) {
    console.error("Forum post submit failed:", error);
    setMessage(error.message, "error");
  }
});

els.commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activePostId) {
    setMessage("Open a post before commenting.", "error");
    return;
  }

  if (!currentProfile?.username) {
    setMessage("Create a username before commenting.", "error");
    setLinkedMessage(els.commentNote, "Create a username before commenting.", "./profile.html", "Create your profile");
    return;
  }

  try {
    await createComment({
      postId: activePostId,
      body: els.commentBody.value
    });

    els.commentForm.reset();
    setMessage("Comment added.", "ok");
    await openPost(activePostId, { updateUrl: false });
    await refreshPosts();
  } catch (error) {
    console.error("Forum comment submit failed:", error);
    setMessage(error.message, "error");
  }
});

els.refreshBtn.addEventListener("click", refreshPosts);
supabase.auth.onAuthStateChange(() => refreshProfile());
boot();
