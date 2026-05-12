(function () {
  const STORAGE_KEY = window.HOLD_LINE_SAVE
    ? window.HOLD_LINE_SAVE.scopedKey('holdTheLine.highestUnlockedLevel.v1')
    : 'holdTheLine.highestUnlockedLevel.v1';
  const POSITION_STORAGE_KEY = 'holdTheLine.mapMarkerPositions.v1';
  const DEFAULT_POSITIONS = {
    1: { x: 51, y: 45.5 },
    2: { x: 75.1, y: 39.6 },
    3: { x: 16, y: 96.8 },
    4: { x: 88.1, y: 75.7 }
  };
  const LEVEL_NAMES = ['Crash Site', 'Salvage', 'Home Run', 'On The Road'];
  const DISPATCH_COPY = [
    'The crash beacon is still hot. Hold the site and turn the wreckage into a foothold.',
    'The salvage field is open. Pull what you can from the road and keep the wall standing.',
    'The route home is exposed. Hold the rally point before the swarm cuts it off.',
    'The last road is visible. Break through and carry the line toward Agartha.'
  ];
  const highestUnlocked = getHighestUnlockedLevel();
  const savedPositions = getSavedMarkerPositions();
  const markers = Array.from(document.querySelectorAll('.level-marker'));
  const levelCards = Array.from(document.querySelectorAll('[data-level-card]'));
  const params = new URLSearchParams(window.location.search);
  const mapDevMode = params.get('dev') === '1';

  markers.forEach(marker => {
    const level = Number.parseInt(marker.dataset.level, 10);
    if (!Number.isInteger(level)) return;
    applySavedPosition(marker, savedPositions[level] || DEFAULT_POSITIONS[level]);
    applyLevelState(marker, level, highestUnlocked, mapDevMode);
    marker.addEventListener('mouseenter', () => updateDispatchPreview(level));
    marker.addEventListener('focus', () => updateDispatchPreview(level));
    marker.addEventListener('mouseleave', () => updateRouteUi(highestUnlocked));
    marker.addEventListener('blur', () => updateRouteUi(highestUnlocked));
    if (mapDevMode || level <= highestUnlocked) return;

    marker.classList.add('locked');
    marker.setAttribute('aria-disabled', 'true');
    marker.setAttribute('title', `Complete level ${level - 1} to unlock this level.`);
    marker.addEventListener('click', event => {
      event.preventDefault();
    });
  });
  levelCards.forEach(card => {
    const level = Number.parseInt(card.dataset.levelCard, 10);
    if (!Number.isInteger(level)) return;
    applyLevelState(card, level, highestUnlocked, mapDevMode);
    card.addEventListener('mouseenter', () => updateDispatchPreview(level));
    card.addEventListener('focus', () => updateDispatchPreview(level));
    card.addEventListener('mouseleave', () => updateRouteUi(highestUnlocked));
    card.addEventListener('blur', () => updateRouteUi(highestUnlocked));
    if (mapDevMode || level <= highestUnlocked) return;
    card.classList.add('locked');
    card.setAttribute('aria-disabled', 'true');
    card.setAttribute('title', `Complete level ${level - 1} to unlock this level.`);
    card.addEventListener('click', event => {
      event.preventDefault();
    });
  });
  updateRouteUi(highestUnlocked);
  initMapDevMode();

  function getHighestUnlockedLevel() {
    try {
      const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY), 10);
      if (!Number.isInteger(saved)) return 1;
      return Math.max(1, Math.min(4, saved));
    } catch (error) {
      return 1;
    }
  }

  function getSavedMarkerPositions() {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || 'null');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function applySavedPosition(marker, position) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
    marker.style.setProperty('--x', clamp(position.x, 2, 98));
    marker.style.setProperty('--y', clamp(position.y, 8, 98));
  }

  function getMarkerPositionsFromDom() {
    const positions = {};
    markers.forEach(marker => {
      const level = Number.parseInt(marker.dataset.level, 10);
      if (!Number.isInteger(level)) return;
      positions[level] = {
        x: roundOne(readMarkerPercent(marker, 'x')),
        y: roundOne(readMarkerPercent(marker, 'y'))
      };
    });
    return positions;
  }

  function readMarkerPercent(marker, axis) {
    const value = marker.style.getPropertyValue(`--${axis}`) || getComputedStyle(marker).getPropertyValue(`--${axis}`);
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : DEFAULT_POSITIONS[Number.parseInt(marker.dataset.level, 10)]?.[axis] || 50;
  }

  function saveMarkerPositions() {
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(getMarkerPositionsFromDom()));
      setMapDevStatus('Saved');
    } catch (error) {
      setMapDevStatus('Save failed');
    }
  }

  function resetMarkerPositions() {
    try {
      localStorage.removeItem(POSITION_STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
    markers.forEach(marker => {
      const level = Number.parseInt(marker.dataset.level, 10);
      applySavedPosition(marker, DEFAULT_POSITIONS[level]);
    });
    exportMarkerPositions();
    setMapDevStatus('Reset');
  }

  function exportMarkerPositions() {
    const exportEl = document.getElementById('mapMarkerExport');
    if (!exportEl) return;
    exportEl.value = JSON.stringify(getMarkerPositionsFromDom(), null, 2);
    exportEl.select();
    setMapDevStatus('Exported');
  }

  function importMarkerPositions() {
    const exportEl = document.getElementById('mapMarkerExport');
    if (!exportEl) return;
    try {
      const parsed = JSON.parse(exportEl.value);
      const positions = parsed.positions && typeof parsed.positions === 'object' ? parsed.positions : parsed;
      markers.forEach(marker => {
        const level = Number.parseInt(marker.dataset.level, 10);
        applySavedPosition(marker, positions[level]);
      });
      saveMarkerPositions();
      exportMarkerPositions();
      setMapDevStatus('Imported');
    } catch (error) {
      setMapDevStatus(`Import failed`);
    }
  }

  function initMapDevMode() {
    if (!mapDevMode) return;
    const panel = document.getElementById('mapDevPanel');
    const saveBtn = document.getElementById('mapMarkerSaveBtn');
    const resetBtn = document.getElementById('mapMarkerResetBtn');
    const exportBtn = document.getElementById('mapMarkerExportBtn');
    const importBtn = document.getElementById('mapMarkerImportBtn');
    const board = document.getElementById('mapBoard');
    const panelHead = panel?.querySelector('.map-dev-head');
    let draggingMarker = null;
    let draggingPanel = false;
    let panelDragOffset = { x: 0, y: 0 };

    panel.hidden = false;
    panelHead?.addEventListener('pointerdown', event => {
      const rect = panel.getBoundingClientRect();
      draggingPanel = true;
      panelDragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      panel.setPointerCapture(event.pointerId);
      panel.classList.add('dragging');
      event.preventDefault();
    });
    panel?.addEventListener('pointermove', event => {
      if (!draggingPanel) return;
      moveMapDevPanel(panel, event, panelDragOffset);
    });
    panel?.addEventListener('pointerup', event => {
      if (!draggingPanel) return;
      draggingPanel = false;
      panel.releasePointerCapture(event.pointerId);
      panel.classList.remove('dragging');
    });
    markers.forEach(marker => {
      marker.classList.remove('locked');
      marker.removeAttribute('aria-disabled');
      marker.classList.add('dev-draggable');
      marker.addEventListener('click', event => event.preventDefault());
      marker.addEventListener('pointerdown', event => {
        draggingMarker = marker;
        marker.setPointerCapture(event.pointerId);
        moveMarkerToPointer(marker, event, board);
        event.preventDefault();
      });
      marker.addEventListener('pointermove', event => {
        if (draggingMarker !== marker) return;
        moveMarkerToPointer(marker, event, board);
      });
      marker.addEventListener('pointerup', event => {
        if (draggingMarker !== marker) return;
        marker.releasePointerCapture(event.pointerId);
        draggingMarker = null;
        setMapDevStatus(`${marker.dataset.name}: ${roundOne(readMarkerPercent(marker, 'x'))}, ${roundOne(readMarkerPercent(marker, 'y'))}`);
      });
    });
    saveBtn?.addEventListener('click', saveMarkerPositions);
    resetBtn?.addEventListener('click', resetMarkerPositions);
    exportBtn?.addEventListener('click', exportMarkerPositions);
    importBtn?.addEventListener('click', importMarkerPositions);
    exportMarkerPositions();
  }

  function moveMarkerToPointer(marker, event, board) {
    const rect = board.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 2, 98);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 98);
    marker.style.setProperty('--x', x);
    marker.style.setProperty('--y', y);
    setMapDevStatus(`${marker.dataset.name}: ${roundOne(x)}, ${roundOne(y)}`);
  }

  function moveMapDevPanel(panel, event, offset) {
    const board = document.getElementById('mapBoard');
    const boardRect = board.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const left = clamp(event.clientX - boardRect.left - offset.x, 8, boardRect.width - panelRect.width - 8);
    const top = clamp(event.clientY - boardRect.top - offset.y, 8, boardRect.height - panelRect.height - 8);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';
  }

  function setMapDevStatus(text) {
    const status = document.getElementById('mapDevStatus');
    if (status) status.textContent = text;
  }

  function applyLevelState(element, level, unlockedLevel, devModeEnabled) {
    const available = devModeEnabled || level <= unlockedLevel;
    element.classList.toggle('available', available);
    element.classList.toggle('active', !devModeEnabled && level === unlockedLevel);
    element.classList.toggle('completed', !devModeEnabled && level < unlockedLevel);
    element.classList.toggle('locked', !available);
  }

  function roundOne(value) {
    return Math.round(value * 10) / 10;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateRouteUi(unlockedLevel) {
    const activeLevel = Math.max(1, Math.min(LEVEL_NAMES.length, unlockedLevel));
    const progressText = document.getElementById('routeProgressText');
    const objectiveText = document.getElementById('routeObjectiveText');
    const dispatchTitle = document.getElementById('dispatchTitle');
    const dispatchBody = document.getElementById('dispatchBody');

    if (progressText) progressText.textContent = `Signal ${activeLevel} of ${LEVEL_NAMES.length} Active`;
    if (objectiveText) objectiveText.textContent = `Secure ${LEVEL_NAMES[activeLevel - 1]}`;
    if (dispatchTitle) dispatchTitle.textContent = LEVEL_NAMES[activeLevel - 1];
    if (dispatchBody) dispatchBody.textContent = DISPATCH_COPY[activeLevel - 1];

    document.querySelectorAll('.route-progress span').forEach(step => {
      const level = Number.parseInt(step.dataset.step, 10);
      step.classList.toggle('active', Number.isInteger(level) && level <= activeLevel);
      step.classList.toggle('current', Number.isInteger(level) && level === activeLevel);
    });
  }

  function updateDispatchPreview(level) {
    const dispatchTitle = document.getElementById('dispatchTitle');
    const dispatchBody = document.getElementById('dispatchBody');
    if (!Number.isInteger(level)) return;
    if (dispatchTitle) dispatchTitle.textContent = LEVEL_NAMES[level - 1] || 'Unknown Signal';
    if (dispatchBody) {
      dispatchBody.textContent = level <= highestUnlocked
        ? DISPATCH_COPY[level - 1]
        : `Signal locked. Complete ${LEVEL_NAMES[level - 2] || 'the previous stand'} to open this route.`;
    }
  }
})();
