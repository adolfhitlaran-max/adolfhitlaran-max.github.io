import {
  displayName,
  formatDate,
  getCurrentUserAndProfile,
  getProfilesForUserIds,
  supabase
} from "./supabaseClient.js";

const ROOMS = [
  { id: "global", label: "Global", hint: "Site-wide" },
  { id: "stream", label: "Stream", hint: "Live chat" },
  { id: "games", label: "Games", hint: "Arcade" },
  { id: "archive", label: "Archive", hint: "Audio/PDFs" }
];

const MESSAGE_COLUMNS = "id, user_id, room, body, created_at";
const MAX_MESSAGES = 100;
const QUERY_TIMEOUT_MS = 8000;

const els = {
  roomTabs: document.getElementById("roomTabs"),
  roomTitle: document.getElementById("roomTitle"),
  status: document.getElementById("status"),
  messages: document.getElementById("messages"),
  chatForm: document.getElementById("chatForm"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  profileLine: document.getElementById("profileLine")
};

let activeRoom = roomFromUrl();
let currentUser = null;
let currentProfile = null;
let activeChannel = null;
let messages = [];
let profiles = new Map();

function withTimeout(promise, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), QUERY_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function roomFromUrl() {
  const requested = new URLSearchParams(window.location.search).get("room");
  return ROOMS.some((room) => room.id === requested) ? requested : "global";
}

function setStatus(message, type = "") {
  els.status.className = `status ${type}`.trim();
  els.status.replaceChildren(document.createTextNode(message || ""));
}

function setLinkedStatus(message, href, label, type = "") {
  els.status.className = `status ${type}`.trim();
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  els.status.replaceChildren(document.createTextNode(message), link);
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(text || ""));
}

function initials(profile) {
  return displayName(profile)
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
  if (!url) return avatarFallback(profile);

  const image = document.createElement("img");
  image.className = "avatar";
  image.src = url;
  image.alt = `${displayName(profile)} avatar`;
  image.addEventListener("error", () => image.replaceWith(avatarFallback(profile)), { once: true });
  return image;
}

function avatarFallback(profile) {
  const fallback = document.createElement("div");
  fallback.className = "avatar-fallback";
  fallback.textContent = initials(profile);
  return fallback;
}

function profileForMessage(message) {
  return profiles.get(message.user_id) || null;
}

function renderRooms() {
  els.roomTabs.replaceChildren(...ROOMS.map((room) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = room.id === activeRoom ? "room-tab active" : "room-tab";
    button.dataset.room = room.id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", room.id === activeRoom ? "true" : "false");
    button.append(document.createTextNode(room.label), document.createElement("span"));
    button.querySelector("span").textContent = room.hint;
    button.addEventListener("click", () => switchRoom(room.id));
    return button;
  }));
}

function renderMessages() {
  els.messages.replaceChildren();

  if (!messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = `No messages in ${activeRoom} yet.`;
    els.messages.appendChild(empty);
    return;
  }

  messages.forEach((message) => {
    const profile = profileForMessage(message);
    const row = document.createElement("article");
    row.className = "message";

    const body = document.createElement("div");
    body.className = "message-body";

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const name = document.createElement("strong");
    appendText(name, displayName(profile, "Anonymous"));
    const username = document.createElement("span");
    appendText(username, profile?.username ? `@${profile.username}` : "@anonymous");
    const time = document.createElement("span");
    appendText(time, formatDate(message.created_at));
    meta.append(name, username, time);

    const copy = document.createElement("p");
    copy.className = "message-text";
    appendText(copy, message.body);

    body.append(meta, copy);
    row.append(avatarNode(profile), body);
    els.messages.appendChild(row);
  });

  els.messages.scrollTop = els.messages.scrollHeight;
}

function renderEmpty(text) {
  els.messages.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = text;
  els.messages.appendChild(empty);
}

function canSendMessages() {
  return Boolean(currentUser && currentProfile?.username);
}

async function loadProfilesForMessages(rows) {
  const missingIds = [...new Set((rows || [])
    .map((row) => row.user_id)
    .filter((id) => id && !profiles.has(id)))];

  if (!missingIds.length) return;

  try {
    const loaded = await getProfilesForUserIds(missingIds);
    loaded.forEach((profile, id) => profiles.set(id, profile));
  } catch (error) {
    console.error("Chat profile lookup failed:", error);
    setStatus(`Messages loaded without some usernames: ${error.message}`, "error");
  }
}

async function loadMessages() {
  setStatus(`Loading ${activeRoom} chat...`);
  els.messages.replaceChildren();
  const loading = document.createElement("div");
  loading.className = "empty";
  loading.textContent = "Loading messages...";
  els.messages.appendChild(loading);

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("chat_messages")
        .select(MESSAGE_COLUMNS)
        .eq("room", activeRoom)
        .order("created_at", { ascending: true })
        .limit(MAX_MESSAGES),
      "Chat messages query timed out."
    );

    if (error) {
      console.error("Chat messages load failed:", error);
      messages = [];
      renderMessages();
      setStatus(`Chat load failed: ${error.message}`, "error");
      return;
    }

    messages = data || [];
    await loadProfilesForMessages(messages);
    renderMessages();
    setStatus(canSendMessages() ? `${activeRoom} chat connected.` : `${activeRoom} chat is readable. Log in with a profile to send.`, "ok");
  } catch (error) {
    console.error("Chat messages load failed:", error);
    messages = [];
    renderMessages();
    setStatus(`Chat load failed: ${error.message}`, "error");
  }
}

function unsubscribeRoom() {
  if (!activeChannel) return;
  supabase.removeChannel(activeChannel);
  activeChannel = null;
}

function subscribeRoom() {
  unsubscribeRoom();

  activeChannel = supabase
    .channel(`chat:${activeRoom}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "chat_messages",
      filter: `room=eq.${activeRoom}`
    }, async (payload) => {
      const row = payload.new;
      if (!row || messages.some((message) => message.id === row.id)) return;

      messages = [...messages, row].slice(-MAX_MESSAGES);
      await loadProfilesForMessages([row]);
      renderMessages();
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setStatus(canSendMessages() ? `${activeRoom} chat live.` : `${activeRoom} chat is live. Log in with a profile to send.`, "ok");
      } else if (status === "CHANNEL_ERROR") {
        console.error("Chat realtime channel error:", { room: activeRoom, status });
        setStatus("Realtime chat connection failed. Messages can still refresh on room switch.", "error");
      }
    });
}

async function refreshProfile() {
  const result = await getCurrentUserAndProfile();
  currentUser = result.user;
  currentProfile = result.profile;

  if (result.error) {
    console.error("Chat auth/profile check failed:", result.error);
    els.profileLine.textContent = result.error.message;
    setStatus(`Profile check failed: ${result.error.message}`, "error");
    setComposerEnabled(false);
    return;
  }

  if (!currentUser) {
    els.profileLine.innerHTML = "";
    const link = document.createElement("a");
    link.href = "./login.html";
    link.textContent = "Log in to send messages.";
    els.profileLine.appendChild(link);
    setLinkedStatus("Not signed in.", "./login.html", "Login", "error");
    setComposerEnabled(false);
    return;
  }

  if (!currentProfile?.username) {
    els.profileLine.innerHTML = "";
    const link = document.createElement("a");
    link.href = "./profile.html";
    link.textContent = "Create a profile to send messages.";
    els.profileLine.appendChild(link);
    setLinkedStatus("Profile missing.", "./profile.html", "Create profile", "error");
    setComposerEnabled(false);
    return;
  }

  profiles.set(currentProfile.id, currentProfile);
  els.profileLine.textContent = `Posting as ${displayName(currentProfile)} (@${currentProfile.username})`;
  setComposerEnabled(true);
}

function setComposerEnabled(enabled) {
  els.messageInput.disabled = !enabled;
  els.sendButton.disabled = !enabled;
}

async function switchRoom(room) {
  if (!ROOMS.some((item) => item.id === room)) return;
  activeRoom = room;
  messages = [];
  profiles = currentProfile?.id ? new Map([[currentProfile.id, currentProfile]]) : new Map();
  const label = ROOMS.find((item) => item.id === activeRoom)?.label || "Chat";
  els.roomTitle.textContent = label;
  window.history.replaceState({}, "", `./chat.html?room=${encodeURIComponent(activeRoom)}`);
  renderRooms();

  await loadMessages();
  subscribeRoom();
}

async function sendMessage(event) {
  event.preventDefault();

  if (!currentUser) {
    setLinkedStatus("Not signed in.", "./login.html", "Login", "error");
    return;
  }

  if (!currentProfile?.username) {
    setLinkedStatus("Profile missing.", "./profile.html", "Create profile", "error");
    return;
  }

  const body = els.messageInput.value.trim();
  if (!body) {
    setStatus("Write a message before sending.", "error");
    return;
  }

  els.sendButton.disabled = true;
  setStatus("Sending message...");

  let data = null;
  try {
    const result = await withTimeout(
      supabase
        .from("chat_messages")
        .insert({
          user_id: currentUser.id,
          room: activeRoom,
          body
        })
        .select(MESSAGE_COLUMNS)
        .single(),
      "Chat message send timed out."
    );

    data = result.data;

    if (result.error) {
      console.error("Chat message insert failed:", result.error);
      setStatus(`Message failed: ${result.error.message}`, "error");
      els.sendButton.disabled = false;
      return;
    }
  } catch (error) {
    console.error("Chat message insert failed:", error);
    setStatus(`Message failed: ${error.message}`, "error");
    els.sendButton.disabled = false;
    return;
  }

  els.messageInput.value = "";
  if (data && !messages.some((message) => message.id === data.id)) {
    messages = [...messages, data].slice(-MAX_MESSAGES);
    await loadProfilesForMessages([data]);
    renderMessages();
  }
  setStatus("Message sent.", "ok");
  els.sendButton.disabled = false;
}

async function boot() {
  renderRooms();
  els.chatForm.addEventListener("submit", sendMessage);
  els.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      els.chatForm.requestSubmit();
    }
  });

  try {
    await refreshProfile();
  } catch (error) {
    console.error("Chat boot profile check failed:", error);
    setStatus(error.message, "error");
    setComposerEnabled(false);
  }

  await switchRoom(activeRoom);
}

window.addEventListener("beforeunload", unsubscribeRoom);
boot();
