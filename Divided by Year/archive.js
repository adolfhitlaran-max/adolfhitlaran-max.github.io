(() => {
  const archive = window.UNCENSORED_VIDEO_ARCHIVE || { videos: [], years: [] };
  const state = {
    year: "all",
    query: "",
    sort: "date-asc",
    selectedId: ""
  };

  const els = {
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    totalVideos: document.getElementById("totalVideos"),
    totalYears: document.getElementById("totalYears"),
    totalSize: document.getElementById("totalSize"),
    visibleCount: document.getElementById("visibleCount"),
    yearFilters: document.getElementById("yearFilters"),
    videoList: document.getElementById("videoList"),
    selectedVideo: document.getElementById("selectedVideo"),
    listTitle: document.getElementById("listTitle")
  };

  const playableExtensions = new Set(["MP4", "WEBM", "M4V", "MOV"]);

  state.selectedId = archive.videos[0]?.id || "";

  bindEvents();
  render();

  function bindEvents() {
    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value.trim().toLowerCase();
      render();
    });

    els.sortSelect.addEventListener("change", () => {
      state.sort = els.sortSelect.value;
      render();
    });

    els.clearFiltersBtn.addEventListener("click", () => {
      state.year = "all";
      state.query = "";
      state.sort = "date-asc";
      els.searchInput.value = "";
      els.sortSelect.value = "date-asc";
      render();
    });

    els.yearFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-year]");
      if (!button) return;
      state.year = button.dataset.year;
      render();
    });

    els.videoList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-video-id]");
      if (!card) return;
      if (event.target.closest("a")) return;
      state.selectedId = card.dataset.videoId;
      render();
    });

    els.videoList.addEventListener("keydown", (event) => {
      const card = event.target.closest("[data-video-id]");
      if (!card || event.target !== card) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.selectedId = card.dataset.videoId;
      render();
    });

    els.selectedVideo.addEventListener("click", (event) => {
      const action = event.target.closest("[data-select-action]");
      if (!action) return;
      const visible = getVisibleVideos();
      const index = visible.findIndex((video) => video.id === state.selectedId);
      if (index < 0) return;
      const nextIndex = action.dataset.selectAction === "next"
        ? (index + 1) % visible.length
        : (index - 1 + visible.length) % visible.length;
      state.selectedId = visible[nextIndex].id;
      render();
    });
  }

  function render() {
    const visible = getVisibleVideos();
    if (!visible.some((video) => video.id === state.selectedId)) {
      state.selectedId = visible[0]?.id || archive.videos[0]?.id || "";
    }

    renderStats(visible);
    renderYearFilters();
    renderList(visible);
    renderSelected(visible);
    refreshIcons();
  }

  function renderStats(visible) {
    const activeYears = archive.years.filter((year) => year.count > 0);
    els.totalVideos.textContent = archive.totalVideos || archive.videos.length;
    els.totalYears.textContent = activeYears.length;
    els.totalSize.textContent = archive.totalSizeLabel || formatBytes(sumBytes(archive.videos));
    els.visibleCount.textContent = visible.length;
    els.listTitle.textContent = state.year === "all" ? "All Videos" : `${state.year} Videos`;
  }

  function renderYearFilters() {
    const activeYears = archive.years.filter((year) => year.count > 0);
    const buttons = [
      `<button class="year-button ${state.year === "all" ? "active" : ""}" type="button" data-year="all"><span>All Years</span><small>${archive.videos.length}</small></button>`,
      ...activeYears.map((year) => (
        `<button class="year-button ${state.year === year.year ? "active" : ""}" type="button" data-year="${escapeHTML(year.year)}"><span>${escapeHTML(year.year)}</span><small>${year.count}</small></button>`
      ))
    ];
    els.yearFilters.innerHTML = buttons.join("");
  }

  function renderList(videos) {
    if (!videos.length) {
      els.videoList.innerHTML = `<div class="empty-state">No videos match that search.</div>`;
      return;
    }

    const grouped = groupByYear(videos);
    els.videoList.innerHTML = Object.entries(grouped).map(([year, items]) => `
      <section class="year-group" aria-label="${escapeHTML(year)} videos">
        <h3 class="year-title">${escapeHTML(year)} <span class="pill">${items.length} videos</span></h3>
        ${items.map(renderVideoCard).join("")}
      </section>
    `).join("");
  }

  function renderVideoCard(video) {
    const active = video.id === state.selectedId ? "active" : "";
    return `
      <article class="video-card ${active}" tabindex="0" role="button" aria-pressed="${active ? "true" : "false"}" data-video-id="${escapeHTML(video.id)}">
        <div class="video-meta">
          <span class="pill year">${escapeHTML(video.year)}</span>
          <span class="pill ext">${escapeHTML(video.extension)}</span>
          <span>${escapeHTML(video.sizeLabel)}</span>
        </div>
        <h3>${escapeHTML(video.title)}</h3>
        <div class="card-actions">
          <button class="text-link" type="button"><i data-lucide="play"></i>Load Player</button>
          <a class="text-link" href="${assetUrl(video.path)}" target="_blank" rel="noopener"><i data-lucide="external-link"></i>Open File</a>
        </div>
      </article>
    `;
  }

  function renderSelected(visible) {
    const video = archive.videos.find((item) => item.id === state.selectedId);
    if (!video) {
      els.selectedVideo.innerHTML = `<div class="selected-card"><div class="selected-body">Select a video to preview it.</div></div>`;
      return;
    }

    const canPlay = playableExtensions.has(video.extension);
    els.selectedVideo.innerHTML = `
      <article class="selected-card">
        <div class="selected-media">
          ${canPlay ? `<video controls preload="metadata" src="${assetUrl(video.path)}"></video>` : `<div class="empty-state">Preview unavailable for ${escapeHTML(video.extension)} files.</div>`}
        </div>
        <div class="selected-body">
          <div class="video-meta">
            <span class="pill year">${escapeHTML(video.year)}</span>
            <span class="pill ext">${escapeHTML(video.extension)}</span>
            <span>${escapeHTML(video.sizeLabel)}</span>
          </div>
          <h2>${escapeHTML(video.title)}</h2>
          <p class="selected-note">Large archive files may take a moment to load. If the browser cannot preview this format, open the file directly.</p>
          <div class="selected-actions">
            <a class="button button-primary" href="${assetUrl(video.path)}" target="_blank" rel="noopener"><i data-lucide="external-link"></i>Open File</a>
            <button class="button button-secondary" type="button" data-select-action="prev"><i data-lucide="arrow-left"></i>Previous</button>
            <button class="button button-secondary" type="button" data-select-action="next">Next<i data-lucide="arrow-right"></i></button>
          </div>
        </div>
      </article>
    `;
  }

  function getVisibleVideos() {
    const query = state.query;
    return archive.videos
      .filter((video) => state.year === "all" || video.year === state.year)
      .filter((video) => {
        if (!query) return true;
        return [
          video.title,
          video.filename,
          video.year,
          video.extension,
          video.sizeLabel
        ].join(" ").toLowerCase().includes(query);
      })
      .sort(sortVideos);
  }

  function sortVideos(a, b) {
    if (state.sort === "date-desc") return b.sortKey.localeCompare(a.sortKey);
    if (state.sort === "size-desc") return b.size - a.size;
    if (state.sort === "title") return a.title.localeCompare(b.title);
    return a.sortKey.localeCompare(b.sortKey);
  }

  function groupByYear(videos) {
    return videos.reduce((groups, video) => {
      if (!groups[video.year]) groups[video.year] = [];
      groups[video.year].push(video);
      return groups;
    }, {});
  }

  function sumBytes(videos) {
    return videos.reduce((sum, video) => sum + Number(video.size || 0), 0);
  }

  function formatBytes(bytes) {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  function assetUrl(path) {
    return encodeURI(path).replace(/'/g, "%27");
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

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
})();
