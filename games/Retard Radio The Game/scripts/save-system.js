(function (global) {
  const ACTIVE_SLOT_KEY = 'holdTheLine.activeSaveSlot.v1';
  const SAVE_SLOTS_KEY = 'holdTheLine.saveSlots.v1';
  const DEFAULT_SLOTS = [
    { id: 'slot1', name: 'Player 1', createdAt: '', updatedAt: '' },
    { id: 'slot2', name: 'Player 2', createdAt: '', updatedAt: '' },
    { id: 'slot3', name: 'Player 3', createdAt: '', updatedAt: '' }
  ];

  function getSlots() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) {
        return DEFAULT_SLOTS.map((slot, index) => ({ ...slot, ...(saved[index] || {}) }));
      }
    } catch (error) {
      // Fall back to default slots.
    }
    return DEFAULT_SLOTS.map(slot => ({ ...slot }));
  }

  function saveSlots(slots) {
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  }

  function getActiveSlotId() {
    try {
      const saved = localStorage.getItem(ACTIVE_SLOT_KEY);
      if (saved && getSlots().some(slot => slot.id === saved)) return saved;
    } catch (error) {
      // Use first slot if storage is unavailable.
    }
    return DEFAULT_SLOTS[0].id;
  }

  function setActiveSlot(id) {
    if (!getSlots().some(slot => slot.id === id)) return;
    localStorage.setItem(ACTIVE_SLOT_KEY, id);
  }

  function renameSlot(id, name) {
    const slots = getSlots();
    const slot = slots.find(item => item.id === id);
    if (!slot) return;
    slot.name = String(name || slot.name).trim().slice(0, 24) || slot.name;
    slot.updatedAt = new Date().toISOString();
    saveSlots(slots);
  }

  function touchSlot(id = getActiveSlotId()) {
    const slots = getSlots();
    const slot = slots.find(item => item.id === id);
    if (!slot) return;
    const now = new Date().toISOString();
    if (!slot.createdAt) slot.createdAt = now;
    slot.updatedAt = now;
    saveSlots(slots);
  }

  function scopedKey(baseKey, slotId = getActiveSlotId()) {
    return `${baseKey}.${slotId}`;
  }

  function getProgress(slotId = getActiveSlotId()) {
    const scoped = Number.parseInt(localStorage.getItem(scopedKey('holdTheLine.highestUnlockedLevel.v1', slotId)), 10);
    if (Number.isInteger(scoped)) return Math.max(1, Math.min(4, scoped));
    if (slotId !== DEFAULT_SLOTS[0].id) return 1;
    const legacy = Number.parseInt(localStorage.getItem('holdTheLine.highestUnlockedLevel.v1'), 10);
    return Number.isInteger(legacy) ? Math.max(1, Math.min(4, legacy)) : 1;
  }

  function resetSlot(id) {
    localStorage.removeItem(scopedKey('holdTheLine.highestUnlockedLevel.v1', id));
    const slots = getSlots();
    const slot = slots.find(item => item.id === id);
    if (slot) {
      slot.createdAt = '';
      slot.updatedAt = '';
      saveSlots(slots);
    }
  }

  global.HOLD_LINE_SAVE = {
    getSlots,
    getActiveSlotId,
    setActiveSlot,
    renameSlot,
    touchSlot,
    scopedKey,
    getProgress,
    resetSlot
  };
})(window);
