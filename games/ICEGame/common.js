const STORAGE_KEY = "PX_WAVE_SHOOTER_SAVE_V1";

export function defaultSave(){
  return {
    unlockedLevel: 1,      // levels 1..5
    coins: 0,              // spend in upgrades
    upgrades: {
      gunLevel: 0,         // each level = more damage
      tazerLevel: 0,       // each level = more range + stun
      healthLevel: 0,      // each level = more max hp
      droneOwned: false,   // auto taze only
      robotOwned: false    // auto taze + gun
    }
  };
}

export function loadSave(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    // merge for forward-compat
    const def = defaultSave();
    return {
      ...def,
      ...parsed,
      upgrades: { ...def.upgrades, ...(parsed.upgrades || {}) }
    };
  }catch{
    return defaultSave();
  }
}

export function saveSave(save){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function resetSave(){
  localStorage.removeItem(STORAGE_KEY);
}

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function fmtTime(seconds){
  seconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(seconds/60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}
