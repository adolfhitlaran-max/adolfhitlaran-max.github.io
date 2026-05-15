(() => {
  const schedule = [
    {
      title: "Historical Speech Marathon",
      detail: "Long-form archive stream featuring speeches and contextual notes."
    },
    {
      title: "WWII Documentary Night",
      detail: "Documentary blocks, discussion prompts, and archive tie-ins."
    },
    {
      title: "Ancient Rome Discussion",
      detail: "A history-room stream for Rome, republics, empire, and sources."
    },
    {
      title: "Live Debate Stream",
      detail: "Open format live discussion with audience topics and follow-up threads."
    }
  ];

  const announcements = [
    {
      title: "New archive uploads",
      detail: "Fresh speech and document additions will be posted here as the library grows."
    },
    {
      title: "Upcoming livestreams",
      detail: "Schedule changes and special stream blocks will appear on this page."
    },
    {
      title: "Community events",
      detail: "Forum events, game nights, and stream discussions will be announced here."
    }
  ];

  function renderList(id, items, className = "") {
    const container = document.getElementById(id);
    if (!container) return;

    container.replaceChildren(...items.map((item) => {
      const node = document.createElement("article");
      node.className = `item ${className}`.trim();

      const title = document.createElement("strong");
      title.textContent = item.title;

      const detail = document.createElement("span");
      detail.textContent = item.detail;

      node.append(title, detail);
      return node;
    }));
  }

  function setStreamMeta() {
    const meta = document.getElementById("streamMeta");
    if (!meta) return;

    const now = new Date();
    meta.textContent = `Historical Speeches channel / ${now.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })}`;
  }

  renderList("scheduleList", schedule);
  renderList("announcementList", announcements, "announcement");
  setStreamMeta();
})();
