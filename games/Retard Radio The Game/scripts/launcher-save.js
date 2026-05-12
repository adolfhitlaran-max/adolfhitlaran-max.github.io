(function () {
  const save = window.HOLD_LINE_SAVE;
  if (!save) return;

  const slotsEl = document.getElementById('saveSlots');
  const activeNameEl = document.getElementById('activePlayerName');
  const activeProgressEl = document.getElementById('activePlayerProgress');
  const continueBtn = document.getElementById('continueBtn');
  const startBtn = document.getElementById('startCampaignBtn');
  const resetBtn = document.getElementById('resetSaveBtn');
  const renameBtn = document.getElementById('renameSaveBtn');
  const nameInput = document.getElementById('playerNameInput');
  const routeLinks = Array.from(document.querySelectorAll('.launcher-route-preview [data-level]'));

  render();

  function render() {
    const slots = save.getSlots();
    const activeId = save.getActiveSlotId();
    const activeSlot = slots.find(slot => slot.id === activeId) || slots[0];
    const progress = save.getProgress(activeId);

    activeNameEl.textContent = activeSlot.name;
    activeProgressEl.textContent = `Level ${progress} unlocked`;
    nameInput.value = activeSlot.name;
    continueBtn.href = progress > 1 ? 'map.html' : 'video.html?src=assets/videos/1.mp4&next=prelevel.html';
    startBtn.href = 'video.html?src=assets/videos/1.mp4&next=prelevel.html';
    updateRoutePreview(progress);

    slotsEl.innerHTML = '';
    for (const slot of slots) {
      const button = document.createElement('button');
      const name = document.createElement('span');
      const progressLabel = document.createElement('strong');
      button.type = 'button';
      button.className = `save-slot${slot.id === activeId ? ' active' : ''}`;
      name.textContent = slot.name;
      progressLabel.textContent = `Level ${save.getProgress(slot.id)}`;
      button.append(name, progressLabel);
      button.addEventListener('click', () => {
        save.setActiveSlot(slot.id);
        render();
      });
      slotsEl.appendChild(button);
    }
  }

  function updateRoutePreview(progress) {
    routeLinks.forEach(link => {
      const level = Number.parseInt(link.dataset.level, 10);
      const locked = Number.isInteger(level) && level > progress;
      link.classList.toggle('locked', locked);
      link.classList.toggle('completed', Number.isInteger(level) && level < progress);
      link.classList.toggle('active', Number.isInteger(level) && level === progress);
      if (locked) {
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('title', `Complete level ${level - 1} to unlock this route.`);
      } else {
        link.removeAttribute('aria-disabled');
        link.removeAttribute('title');
      }
    });
  }

  routeLinks.forEach(link => {
    link.addEventListener('click', event => {
      if (!link.classList.contains('locked')) {
        save.touchSlot();
        return;
      }
      event.preventDefault();
    });
  });

  renameBtn.addEventListener('click', () => {
    save.renameSlot(save.getActiveSlotId(), nameInput.value);
    render();
  });

  resetBtn.addEventListener('click', () => {
    const activeSlot = save.getSlots().find(slot => slot.id === save.getActiveSlotId());
    if (!window.confirm(`Reset progress for ${activeSlot?.name || 'this player'}?`)) return;
    save.resetSlot(save.getActiveSlotId());
    render();
  });

  startBtn.addEventListener('click', event => {
    const activeId = save.getActiveSlotId();
    const activeSlot = save.getSlots().find(slot => slot.id === activeId);
    if (save.getProgress(activeId) > 1) {
      const confirmed = window.confirm(`Start a new run for ${activeSlot?.name || 'this player'}? This resets campaign progress.`);
      if (!confirmed) {
        event.preventDefault();
        return;
      }
      save.resetSlot(activeId);
    }
    save.touchSlot(activeId);
  });
  continueBtn.addEventListener('click', () => {
    save.touchSlot();
  });
})();
