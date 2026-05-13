(() => {
  const archive = window.UNCENSORED_AUDIO_ARCHIVE || { tracks: [], years: [] };
  const state = {
    year: "all",
    query: "",
    sort: "date-asc",
    selectedId: "",
    autoplay: false
  };

  const els = {
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    totalTracks: document.getElementById("totalTracks"),
    totalYears: document.getElementById("totalYears"),
    totalSize: document.getElementById("totalSize"),
    visibleCount: document.getElementById("visibleCount"),
    yearFilters: document.getElementById("yearFilters"),
    trackList: document.getElementById("trackList"),
    selectedTrack: document.getElementById("selectedTrack"),
    listTitle: document.getElementById("listTitle")
  };

  state.selectedId = archive.tracks[0]?.id || "";

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

    els.trackList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-track-id]");
      if (!card) return;
      if (event.target.closest("a")) return;
      selectTrack(card.dataset.trackId, true);
    });

    els.trackList.addEventListener("keydown", (event) => {
      const card = event.target.closest("[data-track-id]");
      if (!card || event.target !== card) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectTrack(card.dataset.trackId, true);
    });

    els.selectedTrack.addEventListener("click", (event) => {
      const playButton = event.target.closest("[data-player-action='play']");
      if (playButton) {
        playSelectedTrack();
        return;
      }

      const action = event.target.closest("[data-select-action]");
      if (!action) return;
      const visible = getVisibleTracks();
      const index = visible.findIndex((track) => track.id === state.selectedId);
      if (index < 0) return;
      const nextIndex = action.dataset.selectAction === "next"
        ? (index + 1) % visible.length
        : (index - 1 + visible.length) % visible.length;
      selectTrack(visible[nextIndex].id, true);
    });
  }

  function selectTrack(id, autoplay = false) {
    state.selectedId = id;
    state.autoplay = autoplay;
    render();
    els.selectedTrack.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function render() {
    const visible = getVisibleTracks();
    if (!visible.some((track) => track.id === state.selectedId)) {
      state.selectedId = visible[0]?.id || archive.tracks[0]?.id || "";
    }

    renderStats(visible);
    renderYearFilters();
    renderList(visible);
    renderSelected();
    refreshIcons();
    wirePlayer();
  }

  function renderStats(visible) {
    const populatedYears = archive.years.filter((year) => year.count > 0);
    els.totalTracks.textContent = archive.totalTracks || archive.tracks.length;
    els.totalYears.textContent = populatedYears.length;
    els.totalSize.textContent = archive.totalSizeLabel || formatBytes(sumBytes(archive.tracks));
    els.visibleCount.textContent = visible.length;
    els.listTitle.textContent = state.year === "all" ? "All Audio" : `${state.year} Audio`;
  }

  function renderYearFilters() {
    const buttons = [
      `<button class="year-button ${state.year === "all" ? "active" : ""}" type="button" data-year="all"><span>All Years</span><small>${archive.tracks.length}</small></button>`,
      ...archive.years.map((year) => (
        `<button class="year-button ${state.year === year.year ? "active" : ""}" type="button" data-year="${escapeHTML(year.year)}"><span>${escapeHTML(year.year)}</span><small>${year.count}</small></button>`
      ))
    ];
    els.yearFilters.innerHTML = buttons.join("");
  }

  function renderList(tracks) {
    if (!tracks.length) {
      els.trackList.innerHTML = `<div class="empty-state">No MP3 files match that search.</div>`;
      return;
    }

    const grouped = groupByYear(tracks);
    els.trackList.innerHTML = Object.entries(grouped).map(([year, items]) => `
      <section class="year-group" aria-label="${escapeHTML(year)} audio">
        <h3 class="year-title">${escapeHTML(year)} <span class="pill">${items.length} MP3s</span></h3>
        ${items.map(renderTrackCard).join("")}
      </section>
    `).join("");
  }

  function renderTrackCard(track) {
    const active = track.id === state.selectedId ? "active" : "";
    return `
      <article class="track-card ${active}" tabindex="0" role="button" aria-pressed="${active ? "true" : "false"}" data-track-id="${escapeHTML(track.id)}">
        <div class="track-meta">
          <span class="pill year">${escapeHTML(track.year)}</span>
          <span class="pill ext">${escapeHTML(track.extension)}</span>
          <span>${escapeHTML(track.sizeLabel)}</span>
        </div>
        <h3>${escapeHTML(track.title)}</h3>
        <div class="track-actions">
          <button class="text-link" type="button"><i data-lucide="play"></i>Play Here</button>
        </div>
      </article>
    `;
  }

  function renderSelected() {
    const track = archive.tracks.find((item) => item.id === state.selectedId);
    if (!track) {
      els.selectedTrack.innerHTML = `<div class="selected-card"><div class="selected-body">Select an MP3 to play it.</div></div>`;
      return;
    }

    els.selectedTrack.innerHTML = `
      <article class="selected-card">
        <div class="selected-player">
          <audio id="audioPlayer" controls preload="metadata" src="${assetUrl(track.path)}">Your browser cannot play this MP3 inline.</audio>
        </div>
        <div class="selected-body">
          <div class="track-meta">
            <span class="pill year">${escapeHTML(track.year)}</span>
            <span class="pill ext">${escapeHTML(track.extension)}</span>
            <span>${escapeHTML(track.sizeLabel)}</span>
          </div>
          <h2>${escapeHTML(track.title)}</h2>
          <p id="playerStatus" class="player-status" role="status">Ready to play from the audio archive.</p>
          <div class="selected-actions">
            <button class="button button-primary" type="button" data-player-action="play"><i data-lucide="play"></i>Play</button>
            <button class="button button-secondary" type="button" data-select-action="prev"><i data-lucide="arrow-left"></i>Previous</button>
            <button class="button button-secondary" type="button" data-select-action="next">Next<i data-lucide="arrow-right"></i></button>
            <a class="text-link original-link" href="${assetUrl(track.path)}" target="_blank" rel="noopener"><i data-lucide="file-audio"></i>Open MP3</a>
          </div>
        </div>
      </article>
    `;
  }

  function wirePlayer() {
    const player = document.getElementById("audioPlayer");
    const status = document.getElementById("playerStatus");
    if (!player || !status) return;

    player.addEventListener("loadedmetadata", () => {
      status.textContent = "Loaded in the player.";
      status.classList.remove("error");
    }, { once: true });

    player.addEventListener("error", () => {
      status.textContent = "This MP3 did not load inline. Check that the file exists at the listed path and is committed as a normal asset.";
      status.classList.add("error");
    }, { once: true });

    if (state.autoplay) {
      state.autoplay = false;
      playSelectedTrack();
    }
  }

  function playSelectedTrack() {
    const player = document.getElementById("audioPlayer");
    const status = document.getElementById("playerStatus");
    if (!player) return;

    player.load();
    const playAttempt = player.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt
        .then(() => {
          if (status) {
            status.textContent = "Playing in the page.";
            status.classList.remove("error");
          }
        })
        .catch(() => {
          if (status) {
            status.textContent = "The browser blocked autoplay. Press play on the audio controls.";
            status.classList.add("error");
          }
        });
    }
  }

  function getVisibleTracks() {
    const query = state.query;
    return archive.tracks
      .filter((track) => state.year === "all" || track.year === state.year)
      .filter((track) => {
        if (!query) return true;
        return [
          track.title,
          track.filename,
          track.year,
          track.extension,
          track.sizeLabel
        ].join(" ").toLowerCase().includes(query);
      })
      .sort(sortTracks);
  }

  function sortTracks(a, b) {
    if (state.sort === "date-desc") return b.sortKey.localeCompare(a.sortKey);
    if (state.sort === "size-desc") return b.size - a.size;
    if (state.sort === "title") return a.title.localeCompare(b.title);
    return a.sortKey.localeCompare(b.sortKey);
  }

  function groupByYear(tracks) {
    return tracks.reduce((groups, track) => {
      if (!groups[track.year]) groups[track.year] = [];
      groups[track.year].push(track);
      return groups;
    }, {});
  }

  function sumBytes(tracks) {
    return tracks.reduce((sum, track) => sum + Number(track.size || 0), 0);
  }

  function formatBytes(bytes) {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  function assetUrl(path) {
    return String(path || "").split("/").map((part) => encodeURIComponent(part)).join("/");
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
