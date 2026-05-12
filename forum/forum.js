(() => {
  const STORAGE_KEY = "uncensoredMedia.forum.v1";
  const PROFILE_KEY = "uncensoredMedia.forum.profile.v1";
  const REACTION_KEY = "uncensoredMedia.forum.reactions.v1";
  const POLL_KEY = "uncensoredMedia.forum.polls.v1";

  const categories = [
    { id: "all", label: "All Threads", icon: "layout-list" },
    { id: "announcements", label: "Announcements", icon: "radio" },
    { id: "debate", label: "Debate Room", icon: "swords" },
    { id: "sources", label: "Source Requests", icon: "file-search" },
    { id: "edits", label: "Edit Bay", icon: "film" },
    { id: "gaming", label: "Gaming", icon: "gamepad-2" },
    { id: "general", label: "General", icon: "message-circle" }
  ];

  const seedThreads = [
    {
      id: "welcome-signal",
      title: "Forum launch thread",
      category: "announcements",
      author: "Uncensored Media",
      body: "The floor is open. Drop source requests, debate threads, clip ideas, gaming notes, and anything that needs more room than a comment section.",
      tags: ["welcome", "house"],
      createdAt: "2026-05-10T18:15:00.000Z",
      updatedAt: "2026-05-11T20:40:00.000Z",
      pinned: true,
      votes: 18,
      flame: 12,
      replies: [
        {
          id: "reply-launch-1",
          author: "Archive Runner",
          body: "Good. A real thread board makes requests way easier to track.",
          createdAt: "2026-05-11T20:40:00.000Z",
          votes: 4
        }
      ]
    },
    {
      id: "source-requests-master",
      title: "Source request board",
      category: "sources",
      author: "Receipt Desk",
      body: "Post the clip, claim, topic, or quote that needs sourcing. Clean links and timestamps get priority.",
      tags: ["sources", "research", "archive"],
      createdAt: "2026-05-09T15:25:00.000Z",
      updatedAt: "2026-05-11T15:10:00.000Z",
      pinned: true,
      votes: 25,
      flame: 7,
      replies: [
        {
          id: "reply-source-1",
          author: "Clip Miner",
          body: "Can we keep one thread per claim once this gets busy?",
          createdAt: "2026-05-11T15:10:00.000Z",
          votes: 2
        }
      ]
    },
    {
      id: "edits-drop-zone",
      title: "Edit ideas for the next drop",
      category: "edits",
      author: "Timeline Cutter",
      body: "Looking for hooks, captions, and quick cuts that could turn archive moments into short-form posts.",
      tags: ["edits", "clips", "shorts"],
      createdAt: "2026-05-08T21:05:00.000Z",
      updatedAt: "2026-05-10T21:18:00.000Z",
      pinned: false,
      votes: 11,
      flame: 9,
      poll: {
        question: "Which edit format should lead?",
        options: [
          { id: "hard-cut", label: "Hard-cut montage", votes: 6 },
          { id: "receipt-thread", label: "Receipt thread", votes: 9 },
          { id: "caption-heavy", label: "Caption-heavy clip", votes: 4 }
        ]
      },
      replies: []
    },
    {
      id: "gaming-night-thread",
      title: "Gaming desk check-in",
      category: "gaming",
      author: "Lobby Host",
      body: "Use this for game bugs, scoreboard talk, stream-night ideas, and anything from the playable side of the site.",
      tags: ["games", "bugs", "stream"],
      createdAt: "2026-05-07T22:30:00.000Z",
      updatedAt: "2026-05-10T12:45:00.000Z",
      pinned: false,
      votes: 14,
      flame: 5,
      replies: [
        {
          id: "reply-game-1",
          author: "Button Masher",
          body: "Back links are working now. Next thing I would add is a high-score wall.",
          createdAt: "2026-05-10T12:45:00.000Z",
          votes: 3
        }
      ]
    },
    {
      id: "debate-cage-rules",
      title: "Debate room: best format for long threads",
      category: "debate",
      author: "Floor Moderator",
      body: "One giant rolling debate thread, or separate threads per topic? Vote and argue your case.",
      tags: ["debate", "format"],
      createdAt: "2026-05-06T19:15:00.000Z",
      updatedAt: "2026-05-09T17:50:00.000Z",
      pinned: false,
      votes: 8,
      flame: 10,
      poll: {
        question: "Thread format",
        options: [
          { id: "rolling", label: "One rolling room", votes: 5 },
          { id: "separate", label: "Separate topic threads", votes: 12 }
        ]
      },
      replies: []
    }
  ];

  const state = {
    threads: loadThreads(),
    filter: "all",
    sort: "hot",
    query: "",
    selectedId: "",
    profile: localStorage.getItem(PROFILE_KEY) || "Guest Signal",
    reactions: loadJSON(REACTION_KEY, {}),
    pollVotes: loadJSON(POLL_KEY, {})
  };

  const els = {
    categoryList: document.getElementById("categoryList"),
    threadList: document.getElementById("threadList"),
    threadDetail: document.getElementById("threadDetail"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    boardTitle: document.getElementById("boardTitle"),
    profileInput: document.getElementById("profileInput"),
    threadCount: document.getElementById("threadCount"),
    replyCount: document.getElementById("replyCount"),
    activeCount: document.getElementById("activeCount"),
    newThreadBtn: document.getElementById("newThreadBtn"),
    composePanel: document.getElementById("composePanel"),
    closeComposeBtn: document.getElementById("closeComposeBtn"),
    cancelComposeBtn: document.getElementById("cancelComposeBtn"),
    threadForm: document.getElementById("threadForm"),
    threadTitle: document.getElementById("threadTitle"),
    threadCategory: document.getElementById("threadCategory"),
    threadTags: document.getElementById("threadTags"),
    threadBody: document.getElementById("threadBody"),
    threadPoll: document.getElementById("threadPoll"),
    exportBtn: document.getElementById("exportBtn"),
    resetBtn: document.getElementById("resetBtn"),
    toast: document.getElementById("toast")
  };

  els.profileInput.value = state.profile;
  state.selectedId = getInitialThreadId();

  seedCategoryOptions();
  bindEvents();
  render();

  function loadJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value || fallback;
    } catch {
      return fallback;
    }
  }

  function loadThreads() {
    const saved = loadJSON(STORAGE_KEY, null);
    if (!Array.isArray(saved) || saved.length === 0) return clone(seedThreads);
    return saved.map(normalizeThread);
  }

  function normalizeThread(thread) {
    return {
      id: thread.id || uid("thread"),
      title: thread.title || "Untitled thread",
      category: thread.category || "general",
      author: thread.author || "Guest Signal",
      body: thread.body || "",
      tags: Array.isArray(thread.tags) ? thread.tags : [],
      createdAt: thread.createdAt || new Date().toISOString(),
      updatedAt: thread.updatedAt || thread.createdAt || new Date().toISOString(),
      pinned: Boolean(thread.pinned),
      votes: Number(thread.votes || 0),
      flame: Number(thread.flame || 0),
      poll: thread.poll || null,
      replies: Array.isArray(thread.replies) ? thread.replies : []
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.threads));
    localStorage.setItem(REACTION_KEY, JSON.stringify(state.reactions));
    localStorage.setItem(POLL_KEY, JSON.stringify(state.pollVotes));
  }

  function bindEvents() {
    els.categoryList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.filter = button.dataset.category;
      state.selectedId = "";
      render();
    });

    els.threadList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-thread-id]");
      if (!button) return;
      state.selectedId = button.dataset.threadId;
      history.replaceState(null, "", `#${state.selectedId}`);
      render();
    });

    els.threadDetail.addEventListener("click", (event) => {
      const reactButton = event.target.closest("[data-react]");
      if (reactButton) {
        reactToThread(reactButton.dataset.react);
        return;
      }

      const pollButton = event.target.closest("[data-poll-option]");
      if (pollButton) {
        votePoll(pollButton.dataset.pollOption);
      }
    });

    els.threadDetail.addEventListener("submit", (event) => {
      if (!event.target.matches("#replyForm")) return;
      event.preventDefault();
      addReply(event.target);
    });

    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value.trim().toLowerCase();
      state.selectedId = "";
      render();
    });

    els.sortSelect.addEventListener("change", () => {
      state.sort = els.sortSelect.value;
      render();
    });

    els.profileInput.addEventListener("input", () => {
      state.profile = cleanText(els.profileInput.value) || "Guest Signal";
      localStorage.setItem(PROFILE_KEY, state.profile);
    });

    els.newThreadBtn.addEventListener("click", openComposer);
    els.closeComposeBtn.addEventListener("click", closeComposer);
    els.cancelComposeBtn.addEventListener("click", closeComposer);
    els.composePanel.addEventListener("click", (event) => {
      if (event.target === els.composePanel) closeComposer();
    });

    els.threadForm.addEventListener("submit", createThread);
    els.exportBtn.addEventListener("click", exportForum);
    els.resetBtn.addEventListener("click", resetDemo);

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      state.threads = loadThreads();
      render();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.composePanel.hidden) closeComposer();
    });
  }

  function seedCategoryOptions() {
    els.threadCategory.innerHTML = categories
      .filter((category) => category.id !== "all")
      .map((category) => `<option value="${category.id}">${escapeHTML(category.label)}</option>`)
      .join("");
  }

  function render() {
    renderCategories();
    renderStats();
    const threads = getVisibleThreads();

    if (!state.selectedId || !threads.some((thread) => thread.id === state.selectedId)) {
      state.selectedId = threads[0]?.id || "";
    }

    renderThreadList(threads);
    renderDetail();
    refreshIcons();
  }

  function renderCategories() {
    els.categoryList.innerHTML = categories.map((category) => {
      const count = category.id === "all"
        ? state.threads.length
        : state.threads.filter((thread) => thread.category === category.id).length;

      return `
        <button class="category-button ${state.filter === category.id ? "active" : ""}" type="button" data-category="${category.id}">
          <span><i data-lucide="${category.icon}"></i>${escapeHTML(category.label)}</span>
          <small>${count}</small>
        </button>
      `;
    }).join("");
  }

  function renderStats() {
    const replies = state.threads.reduce((sum, thread) => sum + thread.replies.length, 0);
    const active = state.threads.filter((thread) => daysSince(thread.updatedAt) < 7).length;
    els.threadCount.textContent = state.threads.length;
    els.replyCount.textContent = replies;
    els.activeCount.textContent = active;
  }

  function renderThreadList(threads) {
    const category = categories.find((item) => item.id === state.filter);
    els.boardTitle.textContent = category ? category.label : "All Threads";

    if (threads.length === 0) {
      els.threadList.innerHTML = `
        <div class="thread-card">
          <h3>No threads found</h3>
          <p>Start the next one.</p>
        </div>
      `;
      return;
    }

    els.threadList.innerHTML = threads.map((thread) => {
      const active = thread.id === state.selectedId ? "active" : "";
      const pinned = thread.pinned ? "pinned" : "";
      const categoryLabel = getCategoryLabel(thread.category);

      return `
        <button class="thread-card ${active} ${pinned}" type="button" data-thread-id="${thread.id}">
          <div class="thread-meta">
            ${thread.pinned ? '<span class="pill pinned">Pinned</span>' : ""}
            <span>${escapeHTML(categoryLabel)}</span>
            <span>${timeAgo(thread.updatedAt)}</span>
          </div>
          <h3>${escapeHTML(thread.title)}</h3>
          <p>${escapeHTML(thread.body)}</p>
          <div class="thread-meta">
            <span class="pill hot">${thread.flame} heat</span>
            <span>${thread.votes} votes</span>
            <span>${thread.replies.length} replies</span>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderDetail() {
    const thread = getSelectedThread();
    if (!thread) {
      els.threadDetail.innerHTML = `
        <div class="detail-empty">
          <div>
            <i data-lucide="messages-square"></i>
            <h2>No thread selected</h2>
            <p>Start one and take the floor.</p>
          </div>
        </div>
      `;
      return;
    }

    const reaction = state.reactions[thread.id] || {};

    els.threadDetail.innerHTML = `
      <header>
        <div class="detail-meta">
          ${thread.pinned ? '<span class="pill pinned">Pinned</span>' : ""}
          <span>${escapeHTML(getCategoryLabel(thread.category))}</span>
          <span>By ${escapeHTML(thread.author)}</span>
          <span>${formatDate(thread.createdAt)}</span>
        </div>
        <h2>${escapeHTML(thread.title)}</h2>
        <div class="tag-row">${thread.tags.map((tag) => `<span class="tag">#${escapeHTML(tag)}</span>`).join("")}</div>
      </header>

      <div class="detail-body">${escapeHTML(thread.body)}</div>

      <div class="reaction-row">
        <button class="reaction-button ${reaction.vote ? "active" : ""}" type="button" data-react="vote">
          <i data-lucide="thumbs-up"></i>${thread.votes}
        </button>
        <button class="reaction-button ${reaction.flame ? "active" : ""}" type="button" data-react="flame">
          <i data-lucide="flame"></i>${thread.flame}
        </button>
        <span class="pill">${thread.replies.length} replies</span>
      </div>

      ${renderPoll(thread)}

      <section class="replies" aria-label="Replies">
        ${thread.replies.map(renderReply).join("")}
      </section>

      <form id="replyForm" class="reply-form">
        <label>
          <span>Reply</span>
          <textarea name="reply" required></textarea>
        </label>
        <button class="primary-action" type="submit"><i data-lucide="reply"></i>Post Reply</button>
      </form>
    `;
  }

  function renderReply(reply) {
    return `
      <article class="reply-card">
        <div class="reply-meta">
          <strong>${escapeHTML(reply.author)}</strong>
          <span>${timeAgo(reply.createdAt)}</span>
          <span>${Number(reply.votes || 0)} votes</span>
        </div>
        <div class="reply-body">${escapeHTML(reply.body)}</div>
      </article>
    `;
  }

  function renderPoll(thread) {
    if (!thread.poll || !Array.isArray(thread.poll.options)) return "";

    const total = thread.poll.options.reduce((sum, option) => sum + Number(option.votes || 0), 0) || 1;
    const selected = state.pollVotes[thread.id];

    return `
      <section class="poll-box" aria-label="Poll">
        <strong>${escapeHTML(thread.poll.question || "Poll")}</strong>
        ${thread.poll.options.map((option) => {
          const votes = Number(option.votes || 0);
          const pct = Math.round((votes / total) * 100);
          return `
            <button class="poll-button ${selected === option.id ? "active" : ""}" type="button" data-poll-option="${option.id}">
              <span class="poll-fill" style="--poll-width: ${pct}%"></span>
              <span>${escapeHTML(option.label)}</span>
              <strong>${pct}%</strong>
            </button>
          `;
        }).join("")}
      </section>
    `;
  }

  function getVisibleThreads() {
    const query = state.query;
    return state.threads
      .filter((thread) => state.filter === "all" || thread.category === state.filter)
      .filter((thread) => {
        if (!query) return true;
        const haystack = [
          thread.title,
          thread.body,
          thread.author,
          getCategoryLabel(thread.category),
          thread.tags.join(" "),
          thread.replies.map((reply) => `${reply.author} ${reply.body}`).join(" ")
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .sort(sortThreads);
  }

  function sortThreads(a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (state.sort === "new") return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    if (state.sort === "top") return scoreThread(b) - scoreThread(a);
    if (state.sort === "replies") return b.replies.length - a.replies.length;
    return hotScore(b) - hotScore(a);
  }

  function scoreThread(thread) {
    return Number(thread.votes || 0) + Number(thread.flame || 0) + thread.replies.length;
  }

  function hotScore(thread) {
    const recency = Math.max(0, 14 - daysSince(thread.updatedAt));
    return (thread.votes * 2) + (thread.flame * 3) + (thread.replies.length * 4) + recency;
  }

  function getSelectedThread() {
    return state.threads.find((thread) => thread.id === state.selectedId);
  }

  function getInitialThreadId() {
    const hashId = decodeURIComponent(window.location.hash.replace("#", ""));
    if (hashId && state.threads.some((thread) => thread.id === hashId)) return hashId;
    return state.threads[0]?.id || "";
  }

  function getCategoryLabel(id) {
    return categories.find((category) => category.id === id)?.label || "General";
  }

  function reactToThread(type) {
    const thread = getSelectedThread();
    if (!thread) return;

    const reaction = state.reactions[thread.id] || {};
    const active = Boolean(reaction[type]);
    reaction[type] = !active;
    state.reactions[thread.id] = reaction;

    if (type === "vote") thread.votes += active ? -1 : 1;
    if (type === "flame") thread.flame += active ? -1 : 1;
    thread.votes = Math.max(0, thread.votes);
    thread.flame = Math.max(0, thread.flame);
    thread.updatedAt = new Date().toISOString();

    save();
    render();
  }

  function votePoll(optionId) {
    const thread = getSelectedThread();
    if (!thread?.poll) return;
    if (state.pollVotes[thread.id]) {
      showToast("Poll vote already logged.");
      return;
    }

    const option = thread.poll.options.find((item) => item.id === optionId);
    if (!option) return;

    option.votes = Number(option.votes || 0) + 1;
    state.pollVotes[thread.id] = optionId;
    thread.updatedAt = new Date().toISOString();
    save();
    render();
    showToast("Poll vote logged.");
  }

  function addReply(form) {
    const thread = getSelectedThread();
    if (!thread) return;
    const textarea = form.elements.reply;
    const body = cleanText(textarea.value);
    if (!body) return;

    thread.replies.push({
      id: uid("reply"),
      author: cleanText(state.profile) || "Guest Signal",
      body,
      createdAt: new Date().toISOString(),
      votes: 0
    });
    thread.updatedAt = new Date().toISOString();
    textarea.value = "";
    save();
    render();
    showToast("Reply posted.");
  }

  function createThread(event) {
    event.preventDefault();
    const title = cleanText(els.threadTitle.value);
    const body = cleanText(els.threadBody.value);
    const category = els.threadCategory.value || "general";
    if (!title || !body) return;

    const thread = {
      id: uid("thread"),
      title,
      category,
      author: cleanText(state.profile) || "Guest Signal",
      body,
      tags: parseTags(els.threadTags.value),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      votes: 1,
      flame: 0,
      replies: []
    };

    const pollChoices = parsePollChoices(els.threadPoll.value);
    if (pollChoices.length >= 2) {
      thread.poll = {
        question: "Community read",
        options: pollChoices.map((label) => ({ id: uid("poll"), label, votes: 0 }))
      };
    }

    state.threads.unshift(thread);
    state.selectedId = thread.id;
    state.filter = "all";
    history.replaceState(null, "", `#${thread.id}`);
    save();
    closeComposer();
    render();
    showToast("Thread posted.");
  }

  function openComposer() {
    els.threadForm.reset();
    els.threadCategory.value = state.filter === "all" ? "general" : state.filter;
    els.composePanel.hidden = false;
    els.threadTitle.focus();
    refreshIcons();
  }

  function closeComposer() {
    els.composePanel.hidden = true;
  }

  function exportForum() {
    const payload = {
      exportedAt: new Date().toISOString(),
      threads: state.threads
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "uncensored-media-forum-export.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Forum export ready.");
  }

  function resetDemo() {
    const confirmed = window.confirm("Reset local forum threads on this browser?");
    if (!confirmed) return;

    state.threads = clone(seedThreads);
    state.reactions = {};
    state.pollVotes = {};
    state.selectedId = state.threads[0].id;
    history.replaceState(null, "", `#${state.selectedId}`);
    save();
    render();
    showToast("Forum reset.");
  }

  function parseTags(value) {
    return value
      .split(",")
      .map((tag) => cleanText(tag).replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 6);
  }

  function parsePollChoices(value) {
    return value
      .split(",")
      .map(cleanText)
      .filter(Boolean)
      .slice(0, 5);
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function uid(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function daysSince(date) {
    const elapsed = Date.now() - Date.parse(date);
    return Math.max(0, elapsed / 86400000);
  }

  function timeAgo(date) {
    const elapsed = Date.now() - Date.parse(date);
    const minutes = Math.round(elapsed / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(date);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(date));
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
})();
