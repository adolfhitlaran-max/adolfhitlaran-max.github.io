// =============================================================
// HOLD THE LINE WAVE FIGHTER BASE
// Enemies come from the right. Player defends the left barricade.
// Drop PNGs into /assets and add their paths in the ASSETS object.
// =============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const CURRENT_PLAYER = 'genz';

function playerAnimPaths(character, action, count) {
  return Array.from({ length: count }, (_, index) => `assets/player/${character}/${action}/${index + 1}.png`);
}

function numberedAssetPaths(folder, count) {
  return Array.from({ length: count }, (_, index) => `${folder}/${index + 1}.png`);
}

// -------------------------------------------------------------
// PNG ASSET HOOKS
// Examples:
// background: 'assets/backgrounds/level1.png'
// idle: ['assets/player/genz/idle/1.png', 'assets/player/genz/idle/2.png']
// grunt: ['assets/enemies/grunt/1.png', 'assets/enemies/grunt/2.png']
// barricade: 'assets/base/barricade/1.png'
// -------------------------------------------------------------
const ASSETS = {
  background: '',
  foreground: '',
  foregrounds: {
    lootFromCraft: numberedAssetPaths('assets/foregrounds/lootfromcraft', 9)
  },
  base: {
    barricade: '',
    flag: ''
  },
  players: {
    genz: {
      idle: playerAnimPaths('genz', 'idle', 1),
      run: playerAnimPaths('genz', 'run', 3),
      jump: playerAnimPaths('genz', 'jump', 3),
      attack: playerAnimPaths('genz', 'punch', 3),
      punch: playerAnimPaths('genz', 'punch', 3),
      kick: playerAnimPaths('genz', 'kick', 3),
      shoot: playerAnimPaths('genz', 'shoot', 3),
      shockwave: playerAnimPaths('genz', 'shockwave', 2),
      hurt: []
    },
    uncensored: {
      idle: playerAnimPaths('uncensored', 'idle', 1),
      run: playerAnimPaths('uncensored', 'run', 3),
      jump: playerAnimPaths('uncensored', 'jump', 3),
      attack: playerAnimPaths('uncensored', 'attack', 7),
      punch: playerAnimPaths('uncensored', 'punch', 3),
      kick: playerAnimPaths('uncensored', 'kick', 3),
      shoot: [],
      shockwave: [],
      hurt: []
    }
  },
  get player() {
    return this.players[CURRENT_PLAYER] || this.players.genz;
  },
  ashtar: {
    idle: ['assets/ashtar/idle/1.png'],
    walking: [
      'assets/ashtar/walking/1.png',
      'assets/ashtar/walking/2.png',
      'assets/ashtar/walking/3.png'
    ],
    gathering: [
      'assets/ashtar/gathering/1.png',
      'assets/ashtar/gathering/2.png',
      'assets/ashtar/gathering/3.png'
    ],
    carrying: [
      'assets/ashtar/carrying/1.png',
      'assets/ashtar/carrying/2.png',
      'assets/ashtar/carrying/3.png'
    ]
  },
  enemies: {
    grunt: {
      run: [
        'assets/enemies/grunt/run/1.png',
        'assets/enemies/grunt/run/2.png',
        'assets/enemies/grunt/run/3.png'
      ],
      attack: [
        'assets/enemies/grunt/attack/1.png',
        'assets/enemies/grunt/attack/2.png',
        'assets/enemies/grunt/attack/3.png'
      ]
    },
    runner: {
      run: [
        'assets/enemies/runner/run/1.png',
        'assets/enemies/runner/run/2.png',
        'assets/enemies/runner/run/3.png'
      ],
      attack: [
        'assets/enemies/runner/attack/1.png',
        'assets/enemies/runner/attack/2.png',
        'assets/enemies/runner/attack/3.png'
      ]
    },
    brute: {
      walk: [
        'assets/enemies/brute/walk/1.png',
        'assets/enemies/brute/walk/2.png',
        'assets/enemies/brute/walk/3.png'
      ],
      attack: [
        'assets/enemies/brute/attack/1.png',
        'assets/enemies/brute/attack/2.png',
        'assets/enemies/brute/attack/3.png'
      ]
    },
    shooter: {
      walk: [
        'assets/enemies/shooter/walk/1.png',
        'assets/enemies/shooter/walk/2.png',
        'assets/enemies/shooter/walk/3.png'
      ],
      attack: [
        'assets/enemies/shooter/attack/1.png',
        'assets/enemies/shooter/attack/2.png',
        'assets/enemies/shooter/attack/3.png'
      ]
    }
  },
  bosses: {
    level1: {
      idle: numberedAssetPaths('assets/enemies/bosses/level1/idle', 1),
      walk: numberedAssetPaths('assets/enemies/bosses/level1/walk', 3),
      basic: numberedAssetPaths('assets/enemies/bosses/level1/basic', 4),
      cast: numberedAssetPaths('assets/enemies/bosses/level1/cast', 4),
      riftLance: [],
      gravityBloom: numberedAssetPaths('assets/enemies/bosses/level1/gravity-bloom', 6),
      starfallShards: [],
      phaseBreak: numberedAssetPaths('assets/enemies/bosses/level1/phase-break', 1),
      ultimate: [],
      hurt: numberedAssetPaths('assets/enemies/bosses/level1/hurt', 3),
      death: numberedAssetPaths('assets/enemies/bosses/level1/death', 8),
      projectiles: []
    },
    level2: {
      idle: [],
      walk: [],
      basic: [],
      cast: [],
      magnetHex: [],
      scrapSwarm: [],
      batteryDrain: [],
      salvageTotem: [],
      ultimate: [],
      hurt: [],
      death: [],
      projectiles: []
    },
    level3: {
      idle: [],
      walk: [],
      basic: [],
      cast: [],
      mirrorHalo: [],
      emberRing: [],
      rootSnare: [],
      recallCurse: [],
      ultimate: [],
      hurt: [],
      death: [],
      projectiles: []
    },
    level4: {
      idle: [],
      walk: [],
      basic: [],
      cast: [],
      leylineDash: [],
      blueComet: [],
      roadSplit: [],
      timeMile: [],
      ultimate: [],
      hurt: [],
      death: [],
      projectiles: []
    }
  },
  pickups: {
    coin: '',
    heart: ''
  },
  effects: {
    slash: '',
    hit: ''
  }
};

const images = new Map();
const renderedImageCache = new Map();
function queueImage(src) {
  if (!src || images.has(src)) return;
  const img = new Image();
  img.src = src;
  images.set(src, img);
}
function queueGroup(group) {
  Object.values(group).forEach(value => {
    if (Array.isArray(value)) value.forEach(queueImage);
    else if (value && typeof value === 'object') queueGroup(value);
    else queueImage(value);
  });
}
function preloadAssets() {
  queueImage(ASSETS.background);
  queueImage(ASSETS.foreground);
  queueGroup(ASSETS.foregrounds);
  queueGroup(ASSETS.base);
  queueGroup(ASSETS.player);
  queueGroup(ASSETS.ashtar);
  queueGroup(ASSETS.enemies);
  queueGroup(ASSETS.bosses);
  queueGroup(ASSETS.pickups);
  queueGroup(ASSETS.effects);
}
preloadAssets();

const WORLD = {
  width: 1500,
  height: 720,
  groundY: 585,
  defaultGroundY: 585,
  gravity: 2600,
  friction: 0.82
};

const DEFENSE = {
  barricadeX: 46,
  barricadeY: 314,
  barricadeW: 82,
  barricadeH: 272,
  lineX: 136,
  playerMinX: 84,
  playerMaxX: VIEW_W - 84,
  maxHp: 100
};

const LEVELS = [
  {
    name: 'Crash Site',
    background: 'assets/backgrounds/level1map.png',
    sky: ['#15234f', '#07101f'],
    baseHp: 100,
    waves: [
      { label: 'Wave 1', rest: 1.0, spawns: [{ type: 'grunt', count: 7, every: 0.75 }] },
      { label: 'Wave 2', rest: 1.2, spawns: [{ type: 'grunt', count: 9, every: 0.58 }, { type: 'runner', count: 3, every: 1.05 }] },
      { label: 'Wave 3', rest: 1.3, spawns: [{ type: 'grunt', count: 11, every: 0.52 }, { type: 'runner', count: 5, every: 0.9 }] },
      { label: 'Wave 4', rest: 1.4, spawns: [{ type: 'grunt', count: 12, every: 0.48 }, { type: 'runner', count: 6, every: 0.82 }, { type: 'brute', count: 1, every: 1.2, delay: 2.2 }] },
      { label: 'Wave 5', rest: 1.6, spawns: [{ type: 'grunt', count: 14, every: 0.44 }, { type: 'runner', count: 7, every: 0.72 }, { type: 'brute', count: 2, every: 2.8, delay: 1.6 }] },
      { label: 'Boss Fight', rest: 0, spawns: [{ type: 'boss', count: 1, every: 0.4, boss: true }] }
    ]
  },
  {
    name: 'Salvage',
    sky: ['#26304f', '#0b1019'],
    baseHp: 115,
    waves: [
      { label: 'Wave 1', rest: 1.0, spawns: [{ type: 'grunt', count: 10, every: 0.55 }, { type: 'runner', count: 4, every: 0.95 }] },
      { label: 'Wave 2', rest: 1.15, spawns: [{ type: 'grunt', count: 12, every: 0.48 }, { type: 'shooter', count: 2, every: 1.55 }] },
      { label: 'Wave 3', rest: 1.25, spawns: [{ type: 'runner', count: 9, every: 0.62 }, { type: 'grunt', count: 8, every: 0.5 }, { type: 'brute', count: 1, every: 1.6, delay: 2.0 }] },
      { label: 'Wave 4', rest: 1.35, spawns: [{ type: 'grunt', count: 15, every: 0.42 }, { type: 'shooter', count: 3, every: 1.25 }, { type: 'brute', count: 2, every: 2.2, delay: 1.5 }] },
      { label: 'Wave 5', rest: 1.6, spawns: [{ type: 'grunt', count: 18, every: 0.38 }, { type: 'runner', count: 9, every: 0.65 }, { type: 'shooter', count: 4, every: 1.3 }, { type: 'brute', count: 2, every: 2.4, delay: 2.1 }] },
      { label: 'Boss Fight', rest: 0, spawns: [{ type: 'boss', count: 1, every: 0.4, boss: true }] }
    ]
  },
  {
    name: 'Home Run',
    sky: ['#401f45', '#0d0615'],
    baseHp: 125,
    waves: [
      { label: 'Wave 1', rest: 1.0, spawns: [{ type: 'grunt', count: 12, every: 0.45 }, { type: 'runner', count: 7, every: 0.65 }] },
      { label: 'Wave 2', rest: 1.15, spawns: [{ type: 'grunt', count: 14, every: 0.42 }, { type: 'shooter', count: 3, every: 1.4 }] },
      { label: 'Wave 3', rest: 1.2, spawns: [{ type: 'runner', count: 13, every: 0.55 }, { type: 'brute', count: 2, every: 2.1, delay: 1.4 }] },
      { label: 'Wave 4', rest: 1.35, spawns: [{ type: 'grunt', count: 17, every: 0.38 }, { type: 'runner', count: 8, every: 0.6 }, { type: 'shooter', count: 4, every: 1.15 }, { type: 'brute', count: 2, every: 2.3, delay: 2.0 }] },
      { label: 'Wave 5', rest: 1.6, spawns: [{ type: 'grunt', count: 20, every: 0.36 }, { type: 'runner', count: 11, every: 0.56 }, { type: 'shooter', count: 5, every: 1.05 }, { type: 'brute', count: 3, every: 2.1, delay: 1.3 }] },
      { label: 'Boss Fight', rest: 0, spawns: [{ type: 'boss', count: 1, every: 0.4, boss: true }] }
    ]
  },
  {
    name: 'On The Road',
    sky: ['#203743', '#090d12'],
    baseHp: 140,
    waves: [
      { label: 'Mile 1', rest: 1.0, spawns: [{ type: 'runner', count: 10, every: 0.52 }, { type: 'grunt', count: 10, every: 0.48 }] },
      { label: 'Roadblock', rest: 1.1, spawns: [{ type: 'grunt', count: 16, every: 0.38 }, { type: 'shooter', count: 5, every: 1.0 }, { type: 'brute', count: 1, every: 1.8, delay: 2.2 }] },
      { label: 'Convoy Break', rest: 1.2, spawns: [{ type: 'runner', count: 16, every: 0.46 }, { type: 'brute', count: 3, every: 1.7, delay: 1.5 }, { type: 'shooter', count: 4, every: 0.95 }] },
      { label: 'Long Haul', rest: 1.35, spawns: [{ type: 'grunt', count: 20, every: 0.34 }, { type: 'runner', count: 14, every: 0.45 }, { type: 'shooter', count: 6, every: 0.9 }, { type: 'brute', count: 3, every: 1.8, delay: 1.8 }] },
      { label: 'Last Stretch', rest: 1.6, spawns: [{ type: 'grunt', count: 24, every: 0.32 }, { type: 'runner', count: 18, every: 0.42 }, { type: 'shooter', count: 8, every: 0.82 }, { type: 'brute', count: 4, every: 1.7, delay: 1.2 }] },
      { label: 'Boss Fight', rest: 0, spawns: [{ type: 'boss', count: 1, every: 0.4, boss: true }] }
    ]
  }
];
LEVELS.forEach(level => queueImage(level.background));

const ENEMY_STATS = {
  grunt: { w: 50, h: 78, hp: 38, speed: 110, damage: 7, baseDamage: 4, color: '#ff4d6d', coin: 2, attackRange: 52, attackCooldown: 0.85, aggroRange: 110 },
  runner: { w: 75, h: 116, hp: 24, speed: 190, damage: 5, baseDamage: 3, color: '#ffb703', coin: 3, attackRange: 48, attackCooldown: 0.62, aggroRange: 100 },
  brute: { w: 76, h: 112, hp: 125, speed: 68, damage: 15, baseDamage: 11, color: '#9b5de5', coin: 12, attackRange: 76, attackCooldown: 1.15, aggroRange: 135 },
  shooter: { w: 50, h: 76, hp: 34, speed: 78, damage: 5, baseDamage: 5, color: '#5dd8ff', coin: 6, attackRange: 370, attackCooldown: 1.45, aggroRange: 420 },
  boss: { w: 104, h: 150, hp: 170, speed: 58, damage: 18, baseDamage: 16, color: '#ff006e', coin: 24, attackRange: 92, attackCooldown: 1.05, aggroRange: 165 }
};

const keys = new Set();
const mouse = { x: 0, y: 0, down: false };
const input = {
  jumpBuffer: 0,
  coyote: 0,
  lastJumpDown: false
};

const state = {
  mode: 'start',
  levelIndex: 0,
  waveIndex: 0,
  waveRunning: false,
  waveClearTimer: 0,
  spawnPlans: [],
  enemies: [],
  projectiles: [],
  hazards: [],
  pickups: [],
  particles: [],
  shockwaves: [],
  pendingShockwaveHits: [],
  floatingText: [],
  coins: 0,
  upgradeChoices: [],
  totalWavesCleared: 0,
  combo: 0,
  comboTimer: 0,
  baseHp: DEFENSE.maxHp,
  baseMaxHp: DEFENSE.maxHp,
  lootBoxFrame: 0,
  time: 0,
  slowMo: 0,
  dangerPulse: 0,
  timeSlow: 0
};

const player = {
  x: 190,
  y: WORLD.groundY - 110,
  w: 56,
  h: 110,
  vx: 0,
  vy: 0,
  speed: 330,
  jumpPower: 920,
  facing: 1,
  onGround: false,
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  invuln: 0,
  attacking: 0,
  attackKind: '',
  meleeCombo: 0,
  meleeComboTimer: 0,
  attackCooldown: 0,
  shootCooldown: 0,
  specialCooldown: 0,
  dashCooldown: 0,
  hurtFlash: 0,
  rootTimer: 0,
  animTime: 0
};

const runner = {
  x: 72,
  y: WORLD.groundY - 110,
  w: 56,
  h: 110,
  speed: 82,
  facing: 1,
  targetIndex: 1,
  segmentStartIndex: 0,
  pauseTimer: 0,
  scale: 1,
  animTime: 0,
  path: { points: [] }
};

const FEEL = Object.freeze({
  jumpBufferTime: 0.11,
  coyoteTime: 0.09,
  comboRewardEvery: 5,
  comboCoinCap: 35,
  playerSpriteWidthScale: 1.1
});
const MAX_GAME_PARTICLES = 280;
const MAX_GAME_FLOATING_TEXT = 90;
const MAX_GAME_PICKUPS = 120;
const MAX_GAME_SHOCKWAVE_TARGETS = 30;
const MAX_GAME_SHOCKWAVE_HITS_PER_FRAME = 5;
const MAX_GAME_SHOCKWAVE_DEATH_EFFECTS = 5;

const PROGRESS_STORAGE_KEY = window.HOLD_LINE_SAVE
  ? window.HOLD_LINE_SAVE.scopedKey('holdTheLine.highestUnlockedLevel.v1')
  : 'holdTheLine.highestUnlockedLevel.v1';
const FLOOR_STORAGE_KEY = 'holdTheLine.levelFloorY.v1';
const RUNNER_PATH_STORAGE_KEY = 'holdTheLine.runnerPath.v1';
const params = new URLSearchParams(window.location.search);
const gameDevMode = params.get('dev') === '1';

const PLAYER_BASELINE = Object.freeze({
  speed: 330,
  jumpPower: 920,
  maxHp: 100,
  maxStamina: 100
});

function getUpgradeStats() {
  if (window.UPGRADE_SYSTEM) return window.UPGRADE_SYSTEM.getStats();
  return {
    playerMaxHp: 100,
    playerSpeed: 330,
    jumpPower: 920,
    staminaMax: 100,
    staminaRegen: 30,
    attackDamage: 24,
    attackCost: 4,
    attackCooldown: 0.26,
    meleeCritChance: 0,
    meleeCritMultiplier: 1.75,
    kickDamageMultiplier: 1.45,
    kickStun: 0,
    comboDamageBonus: 0,
    energyDamageMultiplier: 1,
    energyPierce: 0,
    energySizeBonus: 0,
    energySpeedBonus: 0,
    specialDamage: 42,
    specialRadius: 205,
    specialCost: 38,
    specialCooldown: 3.2,
    shockwaveSlow: 0,
    shockwaveRefund: 0,
    dashCost: 22,
    dashVelocity: 820,
    dashCooldown: 0.7,
    dashInvulnBonus: 0,
    pickupMagnet: 0,
    pickupHealBonus: 0,
    baseMaxHpBonus: 0,
    baseRepairPerWave: 0,
    waveHeal: 0,
    ashtarDamageReduction: 0,
    coinMultiplier: 1,
    bonusChoiceChance: 0,
    barricadeThorns: 0
  };
}

function resetPlayerBaseline() {
  player.speed = PLAYER_BASELINE.speed;
  player.jumpPower = PLAYER_BASELINE.jumpPower;
  player.maxHp = PLAYER_BASELINE.maxHp;
  player.maxStamina = PLAYER_BASELINE.maxStamina;
}

function applyUpgradeBonuses(options = {}) {
  const stats = getUpgradeStats();
  const oldMaxHp = player.maxHp || stats.playerMaxHp;
  const oldMaxStamina = player.maxStamina || stats.staminaMax;
  const hpRatio = oldMaxHp > 0 ? player.hp / oldMaxHp : 1;
  const staminaRatio = oldMaxStamina > 0 ? player.stamina / oldMaxStamina : 1;

  player.maxHp = stats.playerMaxHp;
  player.speed = stats.playerSpeed;
  player.jumpPower = stats.jumpPower;
  player.maxStamina = stats.staminaMax;

  if (options.preserveRatios) {
    player.hp = clamp(player.maxHp * hpRatio, 1, player.maxHp);
    player.stamina = clamp(player.maxStamina * staminaRatio, 0, player.maxStamina);
  }
  if (options.healBetweenWaves) player.hp = clamp(player.hp + stats.waveHeal, 0, player.maxHp);
  if (options.refillStamina) player.stamina = player.maxStamina;

  const baseMax = currentLevel().baseHp + stats.baseMaxHpBonus;
  DEFENSE.maxHp = baseMax;
  state.baseMaxHp = baseMax;
  state.baseHp = clamp(state.baseHp, 0, state.baseMaxHp);
  if (options.repairBetweenWaves) {
    state.baseHp = clamp(state.baseHp + stats.baseRepairPerWave, 0, state.baseMaxHp);
  }
}

const ui = {
  hpFill: document.getElementById('hpFill'),
  staminaFill: document.getElementById('staminaFill'),
  baseFill: document.getElementById('baseFill'),
  hpNumber: document.getElementById('hpNumber'),
  staminaNumber: document.getElementById('staminaNumber'),
  baseNumber: document.getElementById('baseNumber'),
  waveText: document.getElementById('waveText'),
  levelText: document.getElementById('levelText'),
  enemyText: document.getElementById('enemyText'),
  coinsText: document.getElementById('coinsText'),
  comboText: document.getElementById('comboText'),
  upgradeText: document.getElementById('upgradeText'),
  threatText: document.getElementById('threatText'),
  attackChip: document.getElementById('attackChip'),
  specialChip: document.getElementById('specialChip'),
  shootChip: document.getElementById('shootChip'),
  dashChip: document.getElementById('dashChip'),
  floorDevPanel: document.getElementById('floorDevPanel'),
  floorDevSlider: document.getElementById('floorDevSlider'),
  floorDevValue: document.getElementById('floorDevValue'),
  runnerPathDevValue: document.getElementById('runnerPathDevValue'),
  runnerPathExport: document.getElementById('runnerPathExport'),
  startScreen: document.getElementById('startScreen'),
  levelScreen: document.getElementById('levelScreen'),
  levelChoices: document.getElementById('levelChoices'),
  pauseScreen: document.getElementById('pauseScreen'),
  upgradeScreen: document.getElementById('upgradeScreen'),
  upgradeIntro: document.getElementById('upgradeIntro'),
  upgradeChoices: document.getElementById('upgradeChoices'),
  upgradePointsText: document.getElementById('upgradePointsText'),
  resultScreen: document.getElementById('resultScreen'),
  resultTitle: document.getElementById('resultTitle'),
  resultBody: document.getElementById('resultBody'),
  nextBtn: document.getElementById('nextBtn')
};

const startBtn = document.getElementById('startBtn');
const levelSelectBtn = document.getElementById('levelSelectBtn');
const launcherBtn = document.getElementById('launcherBtn');
const levelBackBtn = document.getElementById('levelBackBtn');
const pauseLevelSelectBtn = document.getElementById('pauseLevelSelectBtn');
const pauseLauncherBtn = document.getElementById('pauseLauncherBtn');
const howBtn = document.getElementById('howBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtnPause = document.getElementById('restartBtnPause');
const restartBtnResult = document.getElementById('restartBtnResult');
const upgradeSkipBtn = document.getElementById('upgradeSkipBtn');
const resultMapBtn = document.getElementById('resultMapBtn');
const floorDevSaveBtn = document.getElementById('floorDevSaveBtn');
const floorDevResetBtn = document.getElementById('floorDevResetBtn');
const runnerPathSaveBtn = document.getElementById('runnerPathSaveBtn');
const runnerPathUndoBtn = document.getElementById('runnerPathUndoBtn');
const runnerPathClearBtn = document.getElementById('runnerPathClearBtn');
const runnerPathResetBtn = document.getElementById('runnerPathResetBtn');
const runnerPathExportBtn = document.getElementById('runnerPathExportBtn');
const runnerPathImportBtn = document.getElementById('runnerPathImportBtn');

startBtn.addEventListener('click', () => startGame());
levelSelectBtn.addEventListener('click', goToMap);
launcherBtn.addEventListener('click', goToLauncher);
levelBackBtn.addEventListener('click', showStartMenu);
pauseLevelSelectBtn.addEventListener('click', goToMap);
pauseLauncherBtn.addEventListener('click', goToLauncher);
howBtn.addEventListener('click', () => {
  alert('Protect Ashtar while waves push in from the right. Clear waves to choose upgrades. Combos improve coin drops, hearts heal you, and green packs heal Ashtar. Keyboard: A/D or arrows move, W/Arrow Up jumps, left click or J punches, Q shoots, Space shockwave, Shift dash, P/Esc pause, R restarts. Phone: use the on-screen move, punch, shot, shock, dash, and pause controls.');
});
resumeBtn.addEventListener('click', () => togglePause(false));
restartBtnPause.addEventListener('click', restartLevel);
restartBtnResult.addEventListener('click', restartLevel);
ui.nextBtn.addEventListener('click', nextLevel);
upgradeSkipBtn.addEventListener('click', bankRepairAndContinue);
resultMapBtn.addEventListener('click', goToMap);
if (gameDevMode) setupFloorDevMode();

window.addEventListener('keydown', e => {
  keys.add(e.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (state.mode === 'playing') togglePause(true);
    else if (state.mode === 'paused') togglePause(false);
    else if (state.mode === 'levelSelect') showStartMenu();
  }
  if (e.code === 'KeyR' && ['playing', 'paused', 'dead', 'victory'].includes(state.mode)) restartLevel();
});
window.addEventListener('keyup', e => keys.delete(e.code));

canvas.addEventListener('mousemove', e => {
  updateMouseFromEvent(e);
});
canvas.addEventListener('mousedown', e => {
  updateMouseFromEvent(e);
  mouse.down = true;
  if (gameDevMode && e.button === 0) {
    addRunnerPathPoint(mouse.x, mouse.y);
    e.preventDefault();
    return;
  }
  if (state.mode === 'playing' && e.button === 0) doMeleeAttack();
});
canvas.addEventListener('contextmenu', e => {
  if (gameDevMode) e.preventDefault();
});
window.addEventListener('mouseup', () => { mouse.down = false; });

function updateMouseFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
  mouse.y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
}

function startGame() {
  state.levelIndex = 0;
  startRunAtLevel(0);
}

function startRunAtLevel(levelIndex = 0) {
  state.levelIndex = clamp(levelIndex, 0, LEVELS.length - 1);
  state.coins = 0;
  state.totalWavesCleared = 0;
  resetPlayerBaseline();
  if (window.UPGRADE_SYSTEM) window.UPGRADE_SYSTEM.reset();
  resetLevel();
  state.mode = 'playing';
  hideScreens();
}

function showStartMenu() {
  state.mode = 'start';
  hideScreens();
  ui.startScreen.classList.add('show');
}

function showLevelSelect() {
  state.mode = 'levelSelect';
  hideScreens();
  renderLevelChoices();
  ui.levelScreen.classList.add('show');
}

function goToLauncher() {
  window.location.href = 'launcher.html';
}

function goToMap() {
  window.location.href = 'map.html';
}

function renderLevelChoices() {
  ui.levelChoices.innerHTML = '';
  const descriptions = [
    'Wake up in the wreckage and hold the first line while you find your footing.',
    'Scavenge under pressure while faster waves and shooters test your timing.',
    'Make the last push home through dense packs, elites, and a boss wave.',
    'Take the fight mobile with the longest, meanest road defense yet.'
  ];
  LEVELS.forEach((level, index) => {
    const totalEnemies = level.waves.reduce((sum, wave) => sum + wave.spawns.reduce((waveSum, spawn) => waveSum + spawn.count, 0), 0);
    const button = document.createElement('button');
    button.className = 'level-card';
    button.innerHTML = `
      <span class="level-number">Level ${index + 1}</span>
      <span class="level-name">${level.name}</span>
      <span class="level-meta">${level.waves.length} waves - ${totalEnemies} enemies - ${level.baseHp} Ashtar HP</span>
      <span class="level-desc">${descriptions[index] || 'A custom hold-the-line challenge.'}</span>
    `;
    button.addEventListener('click', () => startRunAtLevel(index));
    ui.levelChoices.appendChild(button);
  });
}

function restartLevel() {
  resetLevel();
  state.mode = 'playing';
  hideScreens();
}

function nextLevel() {
  if (state.mode === 'victory') {
    goToMap();
    return;
  }
  state.levelIndex++;
  if (state.levelIndex >= LEVELS.length) {
    startRunAtLevel(0);
    return;
  }
  resetLevel();
  state.mode = 'playing';
  hideScreens();
}

function resetLevel() {
  const level = currentLevel();
  WORLD.groundY = getSavedFloorY(state.levelIndex);
  applyRunnerPath(getSavedRunnerPath(state.levelIndex));
  applyUpgradeBonuses({ preserveRatios: false });
  const levelBaseMax = level.baseHp + getUpgradeStats().baseMaxHpBonus;
  DEFENSE.maxHp = levelBaseMax;
  Object.assign(player, {
    x: 190,
    y: WORLD.groundY - player.h,
    vx: 0,
    vy: 0,
    hp: player.maxHp,
    stamina: player.maxStamina,
    invuln: 0,
    attacking: 0,
    attackKind: '',
    meleeCombo: 0,
    meleeComboTimer: 0,
    attackCooldown: 0,
    shootCooldown: 0,
    specialCooldown: 0,
    dashCooldown: 0,
    rootTimer: 0,
    hurtFlash: 0,
    facing: 1,
    onGround: true
  });
  placeRunnerAtPathPoint(0);
  runner.facing = 1;
  runner.targetIndex = 1;
  runner.segmentStartIndex = 0;
  runner.pauseTimer = 0;
  runner.scale = getRunnerScaleAtPoint(0);
  runner.animTime = 0;
  input.jumpBuffer = 0;
  input.coyote = 0;
  input.lastJumpDown = false;
  Object.assign(state, {
    waveIndex: 0,
    waveRunning: false,
    waveClearTimer: 1.0,
    spawnPlans: [],
    enemies: [],
    projectiles: [],
    hazards: [],
    pickups: [],
    particles: [],
    shockwaves: [],
    pendingShockwaveHits: [],
    floatingText: [],
    upgradeChoices: [],
    combo: 0,
    comboTimer: 0,
    baseHp: levelBaseMax,
    baseMaxHp: levelBaseMax,
    lootBoxFrame: 0,
    dangerPulse: 0,
    slowMo: 0,
    timeSlow: 0
  });
  beginWave();
  syncFloorDevPanel();
  syncRunnerPathDevPanel();
  updateHUD();
}

function beginWave() {
  const wave = currentWave();
  if (!wave) return;
  state.waveRunning = true;
  state.waveClearTimer = 0;
  state.spawnPlans = wave.spawns.map((group, index) => ({
    type: group.type,
    countLeft: group.count,
    every: group.every,
    timer: group.delay ?? index * 0.45 + 0.35,
    boss: Boolean(group.boss)
  }));
  addFloatingText(455, 255, wave.label.toUpperCase(), '#ffd166', 1.3, -20);
}

function clearLevel() {
  unlockLevel(state.levelIndex + 2);
  state.mode = 'victory';
  ui.resultTitle.textContent = state.levelIndex >= LEVELS.length - 1 ? 'Campaign Held' : 'Line Held';
  ui.resultBody.textContent = `You defended ${currentLevel().name}. Returning to Road to Agartha with the next route signal unlocked.`;
  ui.nextBtn.textContent = 'Road to Agartha';
  hideScreens();
  ui.resultScreen.classList.add('show');
  window.setTimeout(goToMap, 1400);
}

function gameOver(reason = 'The line fell.') {
  state.mode = 'dead';
  ui.resultTitle.textContent = 'You Were Overrun';
  ui.resultBody.textContent = reason;
  ui.nextBtn.textContent = 'Restart Campaign';
  hideScreens();
  ui.resultScreen.classList.add('show');
}

function togglePause(force) {
  const pause = typeof force === 'boolean' ? force : state.mode !== 'paused';
  if (pause) {
    state.mode = 'paused';
    hideScreens();
    ui.pauseScreen.classList.add('show');
  } else {
    state.mode = 'playing';
    hideScreens();
  }
}

function hideScreens() {
  ui.startScreen.classList.remove('show');
  ui.levelScreen.classList.remove('show');
  ui.pauseScreen.classList.remove('show');
  ui.upgradeScreen.classList.remove('show');
  ui.resultScreen.classList.remove('show');
}

function currentLevel() { return LEVELS[state.levelIndex]; }
function currentWave() { return currentLevel().waves[state.waveIndex]; }

function applyInitialLaunchOptions() {
  if (params.get('start') === 'campaign') {
    startRunAtLevel(0);
    return;
  }

  const requestedLevel = Number.parseInt(params.get('level'), 10);
  if (Number.isInteger(requestedLevel)) {
    const allowedLevel = clamp(Math.min(requestedLevel, getHighestUnlockedLevel()), 1, LEVELS.length);
    startRunAtLevel(allowedLevel - 1);
  }
}

function setupFloorDevMode() {
  if (!ui.floorDevPanel || !ui.floorDevSlider) return;
  ui.floorDevPanel.hidden = false;
  ui.floorDevSlider.addEventListener('input', () => {
    setFloorY(Number(ui.floorDevSlider.value));
  });
  floorDevSaveBtn?.addEventListener('click', saveCurrentFloorY);
  floorDevResetBtn?.addEventListener('click', resetCurrentFloorY);
  runnerPathSaveBtn?.addEventListener('click', saveCurrentRunnerPath);
  runnerPathUndoBtn?.addEventListener('click', undoRunnerPathPoint);
  runnerPathClearBtn?.addEventListener('click', clearRunnerPath);
  runnerPathResetBtn?.addEventListener('click', resetCurrentRunnerPath);
  runnerPathExportBtn?.addEventListener('click', exportCurrentRunnerPath);
  runnerPathImportBtn?.addEventListener('click', importCurrentRunnerPath);
  syncFloorDevPanel();
  syncRunnerPathDevPanel();
}

function syncFloorDevPanel() {
  if (!gameDevMode || !ui.floorDevSlider || !ui.floorDevValue) return;
  ui.floorDevSlider.value = String(Math.round(WORLD.groundY));
  ui.floorDevValue.textContent = `Y ${Math.round(WORLD.groundY)} - ${currentLevel().name}`;
}

function setFloorY(value) {
  WORLD.groundY = clamp(value, 420, 690);
  player.y = WORLD.groundY - player.h;
  player.vy = 0;
  player.onGround = true;
  if (runner.path.points.length < 2) applyRunnerPath(getDefaultRunnerPath());
  for (const enemy of state.enemies) enemy.y = WORLD.groundY - enemy.h;
  syncFloorDevPanel();
}

function saveCurrentFloorY() {
  const floors = getSavedFloors();
  floors[String(state.levelIndex + 1)] = Math.round(WORLD.groundY);
  try {
    localStorage.setItem(FLOOR_STORAGE_KEY, JSON.stringify(floors));
  } catch (error) {
    // Floor editing is a temporary convenience; play can continue without storage.
  }
  syncFloorDevPanel();
}

function resetCurrentFloorY() {
  const floors = getSavedFloors();
  delete floors[String(state.levelIndex + 1)];
  try {
    localStorage.setItem(FLOOR_STORAGE_KEY, JSON.stringify(floors));
  } catch (error) {
    // Ignore storage failures.
  }
  setFloorY(WORLD.defaultGroundY);
}

function getSavedFloorY(levelIndex) {
  const levelNumber = String(levelIndex + 1);
  const saved = getSavedFloors()[levelNumber];
  return Number.isFinite(saved) ? clamp(saved, 420, 690) : WORLD.defaultGroundY;
}

function getSavedFloors() {
  try {
    const saved = JSON.parse(localStorage.getItem(FLOOR_STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch (error) {
    return {};
  }
}

function syncRunnerPathDevPanel() {
  if (!gameDevMode || !ui.runnerPathDevValue) return;
  ui.runnerPathDevValue.textContent = `${runner.path.points.length} point${runner.path.points.length === 1 ? '' : 's'}`;
}

function exportCurrentRunnerPath() {
  if (!ui.runnerPathExport) return;
  const payload = {
    level: state.levelIndex + 1,
    name: currentLevel().name,
    points: runner.path.points.map(point => ({
      x: Math.round(point.x),
      y: Math.round(point.y)
    }))
  };
  ui.runnerPathExport.value = JSON.stringify(payload, null, 2);
  ui.runnerPathExport.select();
}

function importCurrentRunnerPath() {
  if (!ui.runnerPathExport) return;
  try {
    const parsed = JSON.parse(ui.runnerPathExport.value);
    const points = Array.isArray(parsed) ? parsed : parsed.points;
    if (!Array.isArray(points) || points.length < 2) throw new Error('Path needs at least two points.');
    applyRunnerPath({ points });
    placeRunnerAtPathPoint(0);
    runner.targetIndex = 1;
    runner.segmentStartIndex = 0;
    runner.pauseTimer = 0;
    saveCurrentRunnerPath();
    exportCurrentRunnerPath();
  } catch (error) {
    ui.runnerPathExport.value = `Import failed: ${error.message}`;
  }
}

function addRunnerPathPoint(x, y) {
  runner.path.points.push(clampRunnerPathPoint({ x, y }));
  runner.targetIndex = Math.min(1, Math.max(0, runner.path.points.length - 1));
  runner.segmentStartIndex = 0;
  runner.pauseTimer = 0;
  placeRunnerAtPathPoint(0);
  syncRunnerPathDevPanel();
}

function applyRunnerPath(path) {
  const points = Array.isArray(path?.points)
    ? path.points
    : path?.startX
      ? [{ x: path.startX + runner.w / 2, y: WORLD.groundY }, { x: path.endX + runner.w / 2, y: WORLD.groundY }]
      : getDefaultRunnerPath().points;
  runner.path = {
    points: points.map(clampRunnerPathPoint)
  };
  if (runner.path.points.length < 2) runner.path = getDefaultRunnerPath();
}

function saveCurrentRunnerPath() {
  const paths = getSavedRunnerPaths();
  paths[String(state.levelIndex + 1)] = {
    points: runner.path.points.map(point => ({
      x: Math.round(point.x),
      y: Math.round(point.y)
    }))
  };
  try {
    localStorage.setItem(RUNNER_PATH_STORAGE_KEY, JSON.stringify(paths));
  } catch (error) {
    // Play can continue without saving the temporary dev path.
  }
  syncRunnerPathDevPanel();
}

function resetCurrentRunnerPath() {
  const paths = getSavedRunnerPaths();
  delete paths[String(state.levelIndex + 1)];
  try {
    localStorage.setItem(RUNNER_PATH_STORAGE_KEY, JSON.stringify(paths));
  } catch (error) {
    // Ignore storage failures.
  }
  applyRunnerPath(getDefaultRunnerPath());
  placeRunnerAtPathPoint(0);
  runner.targetIndex = 1;
  runner.segmentStartIndex = 0;
  runner.pauseTimer = 0;
  syncRunnerPathDevPanel();
}

function getSavedRunnerPath(levelIndex) {
  const saved = getSavedRunnerPaths()[String(levelIndex + 1)];
  if (!Array.isArray(saved?.points) || saved.points.length < 2) return getDefaultRunnerPath();
  return isOldShortDefaultRunnerPath(saved.points) ? getDefaultRunnerPath() : saved;
}

function isOldShortDefaultRunnerPath(points) {
  if (points.length !== 2) return false;
  const first = points[0];
  const second = points[1];
  return Math.abs(Number(first?.x) - 93) <= 2 &&
    Math.abs(Number(second?.x) - 259) <= 2;
}

function getSavedRunnerPaths() {
  try {
    const saved = JSON.parse(localStorage.getItem(RUNNER_PATH_STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch (error) {
    return {};
  }
}

function undoRunnerPathPoint() {
  if (runner.path.points.length <= 2) return;
  runner.path.points.pop();
  runner.targetIndex = Math.min(runner.targetIndex, runner.path.points.length - 1);
  runner.segmentStartIndex = Math.min(runner.segmentStartIndex, runner.path.points.length - 1);
  runner.pauseTimer = 0;
  placeRunnerAtPathPoint(0);
  syncRunnerPathDevPanel();
}

function clearRunnerPath() {
  runner.path.points = [];
  runner.targetIndex = 0;
  runner.segmentStartIndex = 0;
  runner.pauseTimer = 0;
  syncRunnerPathDevPanel();
}

function getDefaultRunnerPath() {
  return {
    points: [
      { x: 103, y: 564 },
      { x: 170, y: 562 },
      { x: 229, y: 561 },
      { x: 298, y: 559 },
      { x: 288, y: 521 },
      { x: 259, y: 500 },
      { x: 224, y: 479 },
      { x: 164, y: 445 },
      { x: 222, y: 474 },
      { x: 257, y: 493 },
      { x: 286, y: 516 },
      { x: 302, y: 561 },
      { x: 232, y: 558 }
    ]
  };
}

function clampRunnerPathPoint(point) {
  return {
    x: clamp(Number(point?.x) || 93, 24, 500),
    y: clamp(Number(point?.y) || WORLD.groundY, 160, 700)
  };
}

function placeRunnerAtPathPoint(index) {
  const point = runner.path.points[index] || getDefaultRunnerPath().points[0];
  runner.x = point.x - runner.w / 2;
  runner.y = point.y - runner.h;
  runner.scale = getRunnerScaleAtPoint(index);
}

function getHighestUnlockedLevel() {
  try {
    const saved = Number.parseInt(localStorage.getItem(PROGRESS_STORAGE_KEY), 10);
    if (!Number.isInteger(saved)) return 1;
    return clamp(saved, 1, LEVELS.length);
  } catch (error) {
    return 1;
  }
}

function unlockLevel(levelNumber) {
  const nextUnlocked = clamp(levelNumber, 1, LEVELS.length);
  if (nextUnlocked <= getHighestUnlockedLevel()) return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, String(nextUnlocked));
    if (window.HOLD_LINE_SAVE) window.HOLD_LINE_SAVE.touchSlot();
  } catch (error) {
    // Progress saving is optional; the game can still play without storage access.
  }
}

let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 30);
  try {
    if (state.mode === 'playing') update(dt);
    render();
  } catch (error) {
    recoverFromGameLoopError(error);
  }
  requestAnimationFrame(loop);
}

function recoverFromGameLoopError(error) {
  console.error('Game loop recovered after error:', error);
  window.__holdLineLastLoopError = {
    message: error?.message || String(error),
    stack: error?.stack || ''
  };
  state.projectiles = [];
  state.hazards = [];
  state.shockwaves = [];
  state.pendingShockwaveHits = [];
  state.pickups = state.pickups.filter(isValidGamePickup);
  state.particles = [];
  state.floatingText = [];
  player.attackKind = '';
  player.attacking = 0;
}
applyInitialLaunchOptions();
requestAnimationFrame(loop);

function update(dt) {
  state.time += dt;
  if (state.slowMo > 0) {
    state.slowMo -= dt;
    dt *= 0.45;
  }
  if (state.timeSlow > 0) {
    state.timeSlow = Math.max(0, state.timeSlow - dt);
    dt *= 0.72;
  }
  updatePlayer(dt);
  updateRunner(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateBossHazards(dt);
  updateProjectiles(dt);
  updatePickups(dt);
  updateParticles(dt);
  updateShockwaves(dt);
  updatePendingShockwaveHits();
  updateFloatingText(dt);
  updateWaveState(dt);
  updateHUD();
  if (state.dangerPulse > 0) state.dangerPulse = Math.max(0, state.dangerPulse - dt);
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
}

function updatePlayer(dt) {
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const jump = keys.has('KeyW') || keys.has('ArrowUp');
  const attack = keys.has('KeyJ');
  const special = keys.has('Space');
  const shoot = keys.has('KeyQ');
  const dash = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const jumpPressed = jump && !input.lastJumpDown;
  input.lastJumpDown = jump;
  const rooted = player.rootTimer > 0;
  if (jumpPressed) input.jumpBuffer = FEEL.jumpBufferTime;
  else input.jumpBuffer = Math.max(0, input.jumpBuffer - dt);
  input.coyote = player.onGround ? FEEL.coyoteTime : Math.max(0, input.coyote - dt);

  let move = 0;
  if (!rooted && left) move -= 1;
  if (!rooted && right) move += 1;
  if (move !== 0) {
    player.vx += move * player.speed * 7.5 * dt;
    player.facing = move;
  } else {
    player.vx *= Math.pow(WORLD.friction, dt * 60);
  }
  const maxSpeed = player.speed + (player.stamina > 10 ? 0 : -80);
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
  if (!rooted && input.jumpBuffer > 0 && input.coyote > 0) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    input.jumpBuffer = 0;
    input.coyote = 0;
    spawnDust(player.x + player.w / 2, WORLD.groundY, 10);
  }
  if (!jump && player.vy < -180) player.vy *= 0.92;
  if (attack) doMeleeAttack();
  if (special) doSpecial();
  if (shoot) doEnergyShot();
  if (!rooted && dash) doDash();

  player.vy += WORLD.gravity * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.y + player.h >= WORLD.groundY) {
    if (!player.onGround && player.vy > 500) spawnDust(player.x + player.w / 2, WORLD.groundY, 12);
    player.y = WORLD.groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  player.x = clamp(player.x, DEFENSE.playerMinX, DEFENSE.playerMaxX - player.w);
  player.stamina = clamp(player.stamina + getUpgradeStats().staminaRegen * dt, 0, player.maxStamina);
  player.invuln = Math.max(0, player.invuln - dt);
  player.attacking = Math.max(0, player.attacking - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  player.specialCooldown = Math.max(0, player.specialCooldown - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.hurtFlash = Math.max(0, player.hurtFlash - dt);
  player.rootTimer = Math.max(0, player.rootTimer - dt);
  player.meleeComboTimer = Math.max(0, player.meleeComboTimer - dt);
  if (player.meleeComboTimer <= 0) player.meleeCombo = 0;
  if (player.attacking <= 0) player.attackKind = '';
  player.animTime += dt;
}

function updateRunner(dt) {
  const points = runner.path.points;
  if (points.length < 2) return;
  if (runner.pauseTimer > 0) {
    runner.pauseTimer = Math.max(0, runner.pauseTimer - dt);
    runner.animTime += dt;
    return;
  }
  const target = points[runner.targetIndex] || points[0];
  const startIndex = clamp(runner.segmentStartIndex, 0, points.length - 1);
  const start = points[startIndex] || points[0];
  const footX = runner.x + runner.w / 2;
  const footY = runner.y + runner.h;
  const dx = target.x - footX;
  const dy = target.y - footY;
  const dist = Math.hypot(dx, dy);
  const segmentLength = Math.max(1, Math.hypot(target.x - start.x, target.y - start.y));
  const progress = clamp(1 - dist / segmentLength, 0, 1);
  runner.scale = getRunnerScaleAlongSegment(startIndex, runner.targetIndex, progress);
  const step = runner.speed * dt;
  if (dist <= step || dist <= 3) {
    runner.x = target.x - runner.w / 2;
    runner.y = target.y - runner.h;
    runner.scale = getRunnerScaleAtPoint(runner.targetIndex);
    if (runner.targetIndex === 7) runner.pauseTimer = 7;
    if (runner.targetIndex >= points.length - 1) {
      runner.segmentStartIndex = 0;
      runner.targetIndex = Math.min(1, points.length - 1);
      placeRunnerAtPathPoint(0);
      advanceLootBoxFrame();
    } else {
      runner.segmentStartIndex = runner.targetIndex;
      runner.targetIndex++;
    }
  } else {
    runner.facing = dx >= 0 ? 1 : -1;
    runner.x += (dx / dist) * step;
    runner.y += (dy / dist) * step;
  }
  runner.animTime += dt;
}

function advanceLootBoxFrame() {
  const frames = ASSETS.foregrounds.lootFromCraft;
  if (!frames.length) return;
  state.lootBoxFrame = Math.min(state.lootBoxFrame + 1, frames.length - 1);
}

function getRunnerScaleAlongSegment(startIndex, targetIndex, progress) {
  if (targetIndex === 0 && startIndex > targetIndex) return 1;
  return getRunnerScaleAtVirtualPoint(startIndex + (targetIndex - startIndex) * progress);
}

function getRunnerScaleAtPoint(index) {
  return getRunnerScaleAtVirtualPoint(index);
}

function getRunnerScaleAtVirtualPoint(index) {
  if (index >= 3 && index <= 7) return 1 - ((index - 3) / 4) * 0.5;
  if (index > 7 && index <= 11) return 0.5 + ((index - 7) / 4) * 0.5;
  return 1;
}

function doMeleeAttack() {
  const stats = getUpgradeStats();
  if (player.attackCooldown > 0 || player.attacking > 0) return;
  const isKick = player.meleeCombo >= 2;
  const staminaCost = isKick ? stats.attackCost + 5 : Math.max(1, stats.attackCost - 1);
  if (player.stamina < staminaCost) return;
  player.meleeCombo = isKick ? 0 : player.meleeCombo + 1;
  player.meleeComboTimer = 1.15;
  player.attackKind = isKick ? 'kick' : 'punch';
  player.attacking = isKick ? 0.46 : 0.32;
  player.animTime = 0;
  player.attackCooldown = isKick ? stats.attackCooldown + 0.16 : stats.attackCooldown;
  player.stamina = Math.max(0, player.stamina - staminaCost);
  hitMeleeArc(stats, isKick);
}

function hitMeleeArc(stats, isKick) {
  const reach = isKick ? 96 : 72;
  const height = isKick ? 74 : 62;
  const comboBonus = 1 + Math.min(state.combo, 30) * stats.comboDamageBonus;
  let damage = stats.attackDamage * comboBonus * (isKick ? stats.kickDamageMultiplier : 0.8);
  const crit = Math.random() < stats.meleeCritChance;
  if (crit) damage *= stats.meleeCritMultiplier;
  const hitbox = {
    x: player.facing === 1 ? player.x + player.w - 8 : player.x - reach + 8,
    y: player.y + 30,
    w: reach,
    h: height
  };
  let hitAny = false;
  for (const enemy of state.enemies) {
    if (!enemy.dead && rectsOverlap(hitbox, enemy)) {
      hitAny = true;
      hitEnemy(enemy, damage, player.facing, isKick, isKick ? 1.4 : 0.75);
      if (isKick && stats.kickStun > 0) enemy.stunTimer = Math.max(enemy.stunTimer, stats.kickStun);
      if (crit) addFloatingText(enemy.x + enemy.w / 2, enemy.y - 28, 'CRIT', '#ffd166', 0.62, -28);
    }
  }
  addMeleeEffect(hitbox, isKick, hitAny);
}

function doEnergyShot() {
  const stats = getUpgradeStats();
  const shootCost = getEnergyShotCost(stats);
  const shootCooldown = getEnergyShotCooldown(stats);
  if (player.shootCooldown > 0 || player.attacking > 0) return;
  if (player.stamina < shootCost) return;
  player.attackKind = 'shoot';
  player.attacking = 0.34;
  player.animTime = 0;
  player.shootCooldown = shootCooldown;
  player.stamina = Math.max(0, player.stamina - shootCost);
  shootPlayerEnergyBall(stats);
}

function shootPlayerEnergyBall(stats) {
  const dir = player.facing;
  const x = dir === 1 ? player.x + player.w + 12 : player.x - 12;
  const y = player.y + player.h * 0.48;
  const speed = 760 + stats.energySpeedBonus + Math.max(0, stats.dashVelocity - 820) * 0.2;
  state.projectiles.push({
    target: 'enemy',
    x,
    y,
    vx: dir * speed,
    vy: 0,
    r: 7 + stats.energySizeBonus * 0.38,
    life: 0.85,
    damage: stats.attackDamage * stats.energyDamageMultiplier,
    pierce: stats.energyPierce,
    color: '#5dd8ff',
    kind: 'playerEnergy'
  });
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x,
      y,
      vx: dir * rand(58, 190) + rand(-34, 34),
      vy: rand(-58, 58),
      r: rand(1.4, 3.4),
      life: rand(0.12, 0.24),
      maxLife: 0.24,
      color: '#5dd8ff'
    });
  }
}

function getEnergyShotCost(stats = getUpgradeStats()) {
  return Math.max(6, Math.round(stats.dashCost * 0.55));
}

function getEnergyShotCooldown(stats = getUpgradeStats()) {
  return Math.max(0.18, stats.dashCooldown * 0.62);
}

function doSpecial() {
  const stats = getUpgradeStats();
  if (player.specialCooldown > 0 || player.stamina < stats.specialCost) return;
  player.attackKind = 'shockwave';
  player.attacking = 0.45;
  player.animTime = 0;
  player.specialCooldown = stats.specialCooldown;
  player.stamina -= stats.specialCost;
  state.slowMo = 0.08;
  const radius = stats.specialRadius;
  const centerX = player.x + player.w / 2;
  const centerY = player.y + player.h / 2;
  const radiusSq = radius * radius;
  const targets = [];
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.remove) continue;
    const dx = enemy.x + enemy.w / 2 - centerX;
    const dy = enemy.y + enemy.h / 2 - centerY;
    if (dx * dx + dy * dy < radiusSq) targets.push(enemy);
    if (targets.length >= MAX_GAME_SHOCKWAVE_TARGETS) break;
  }
  state.pendingShockwaveHits.push({
    x: centerX,
    y: centerY,
    damage: stats.specialDamage,
    slow: stats.shockwaveSlow,
    targets,
    hitCount: 0,
    deathEffects: 0
  });
  if (targets.length > 0 && stats.shockwaveRefund > 0) {
    const refund = Math.min(stats.specialCost, stats.specialCost * stats.shockwaveRefund * targets.length);
    player.stamina = clamp(player.stamina + refund, 0, player.maxStamina);
    addFloatingText(centerX, centerY - 44, `+${Math.round(refund)} stamina`, '#5dd8ff', 0.72, -32);
  }
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 160 + Math.random() * 520;
    state.particles.push({ x: centerX, y: centerY, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 3 + Math.random() * 5, life: 0.45 + Math.random() * 0.18, maxLife: 0.65, color: '#5dd8ff' });
  }
  capGameParticles();
  addShockwaveBlast(centerX, centerY, radius);
}

function doDash() {
  const stats = getUpgradeStats();
  if (player.dashCooldown > 0 || player.stamina < stats.dashCost) return;
  player.dashCooldown = stats.dashCooldown;
  player.stamina -= stats.dashCost;
  player.vx = player.facing * stats.dashVelocity;
  player.invuln = 0.16 + stats.dashInvulnBonus;
  spawnDust(player.x + player.w / 2, WORLD.groundY, 14);
}

function updateSpawns(dt) {
  if (!state.waveRunning) return;
  if (state.pendingShockwaveHits.length) return;
  for (const plan of state.spawnPlans) {
    if (plan.countLeft <= 0) continue;
    plan.timer -= dt;
    if (plan.timer <= 0) {
      spawnEnemy(plan.type, plan.boss);
      plan.countLeft--;
      plan.timer = plan.every;
    }
  }
}

function spawnEnemy(type, boss = false) {
  const base = ENEMY_STATS[type];
  const scale = boss ? (type === 'boss' ? 1.25 : 1.8) : 1;
  const bossHpMultiplier = type === 'boss' ? 3.4 : 5.5;
  const bossSpeedMultiplier = type === 'boss' ? 0.82 : 0.65;
  const pressure = 1 + state.levelIndex * 0.12 + state.waveIndex * 0.06;
  const eliteChance = Math.min(0.18, 0.05 + state.levelIndex * 0.035 + state.waveIndex * 0.018);
  const elite = !boss && Math.random() < eliteChance;
  const enemy = {
    type,
    x: VIEW_W + 80 + Math.random() * 240,
    y: WORLD.groundY - base.h * scale,
    w: base.w * scale,
    h: base.h * scale,
    vx: 0,
    vy: 0,
    hp: base.hp * (boss ? bossHpMultiplier : 1) * pressure * (elite ? 1.65 : 1),
    maxHp: base.hp * (boss ? bossHpMultiplier : 1) * pressure * (elite ? 1.65 : 1),
    speed: base.speed * (boss ? bossSpeedMultiplier : 1) * (elite ? 1.18 : 1) * (0.9 + Math.random() * 0.2),
    damage: base.damage * (boss ? 1.8 : 1) * (elite ? 1.25 : 1),
    baseDamage: base.baseDamage * (boss ? 2.1 : 1) * (elite ? 1.2 : 1),
    color: boss ? '#ff006e' : (elite ? '#f15bb5' : base.color),
    coin: base.coin * (boss ? 8 : 1) * (elite ? 2.5 : 1),
    attackRange: base.attackRange * (boss ? 1.2 : 1),
    attackCooldown: base.attackCooldown,
    aggroRange: base.aggroRange,
    attackTimer: 0.3 + Math.random() * 0.45,
    attackAnim: 0,
    slowTimer: 0,
    stunTimer: 0,
    hurt: 0,
    dead: false,
    boss,
    bossLevel: boss ? state.levelIndex + 1 : 0,
    bossAbilityTimer: boss ? 1.4 : 0,
    bossAbilityIndex: 0,
    bossCasting: '',
    bossCastTimer: 0,
    damageReduction: 0,
    afterimageTimer: 0,
    elite,
    facing: -1,
    animTime: Math.random() * 10,
    attackingBase: false
  };
  state.enemies.push(enemy);
  addFloatingText(enemy.x + enemy.w / 2, enemy.y - 18, boss ? 'BOSS' : type.toUpperCase(), boss ? '#ff4d6d' : '#ffffff');
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.animTime += dt;
    enemy.hurt = Math.max(0, enemy.hurt - dt);
    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    enemy.attackAnim = Math.max(0, enemy.attackAnim - dt);
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
    if (enemy.stunTimer > 0) {
      enemy.vx = 0;
      continue;
    }
    if (enemy.boss) {
      updateBossEnemy(enemy, dt);
      continue;
    }

    const px = player.x + player.w / 2;
    const py = player.y + player.h * 0.54;
    const ex = enemy.x + enemy.w / 2;
    const ey = enemy.y + enemy.h * 0.54;
    const dx = px - ex;
    const distToPlayer = Math.hypot(dx, py - ey);
    const atBarricade = enemy.x <= DEFENSE.lineX + 12;
    enemy.attackingBase = atBarricade && enemy.x > DEFENSE.barricadeX - 8;

    if (enemy.type === 'shooter') {
      updateShooter(enemy, dt, distToPlayer, dx, atBarricade);
      continue;
    }

    if (atBarricade) {
      enemy.vx = 0;
      enemy.x = Math.max(enemy.x, DEFENSE.barricadeX + 8);
      enemy.facing = -1;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackCooldown;
        enemy.attackAnim = 0.38;
        damageBase(enemy.baseDamage, enemy);
        addEnemyAttackEffect(enemy, true);
      }
      continue;
    }

    if (distToPlayer < enemy.aggroRange && Math.abs(dx) < enemy.aggroRange) {
      enemy.facing = dx >= 0 ? 1 : -1;
      enemy.vx = Math.sign(dx) * getEnemyMoveSpeed(enemy);
      if (Math.abs(dx) < enemy.attackRange && Math.abs(py - ey) < 90 && enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackCooldown;
        enemy.attackAnim = 0.34;
        damagePlayer(enemy.damage, enemy.facing);
        addEnemyAttackEffect(enemy, false);
      }
    } else {
      enemy.facing = -1;
      enemy.vx = -getEnemyMoveSpeed(enemy);
    }

    enemy.x += enemy.vx * dt;
    enemy.x = clamp(enemy.x, DEFENSE.barricadeX + 8, WORLD.width - enemy.w - 20);
  }
  state.enemies = state.enemies.filter(enemy => !enemy.remove);
}

function updateShooter(enemy, dt, distToPlayer, dx, atBarricade) {
  const shouldShootPlayer = distToPlayer < enemy.attackRange && player.hp > 0;
  enemy.facing = shouldShootPlayer ? (dx >= 0 ? 1 : -1) : -1;

  if (shouldShootPlayer && enemy.attackTimer <= 0) {
    enemy.attackTimer = enemy.attackCooldown;
    enemy.attackAnim = 0.38;
    shootAtPlayer(enemy);
  }

  if (!shouldShootPlayer && enemy.x > 760) {
    enemy.vx = -getEnemyMoveSpeed(enemy);
  } else if (enemy.x <= 760 && !atBarricade) {
    enemy.vx = -getEnemyMoveSpeed(enemy) * 0.18;
    if (enemy.attackTimer <= 0) {
      enemy.attackTimer = enemy.attackCooldown + 0.35;
      enemy.attackAnim = 0.38;
      shootAtBase(enemy);
    }
  } else if (atBarricade) {
    enemy.vx = 0;
    if (enemy.attackTimer <= 0) {
      enemy.attackTimer = enemy.attackCooldown;
      enemy.attackAnim = 0.38;
      damageBase(enemy.baseDamage, enemy);
      addEnemyAttackEffect(enemy, true);
    }
  }

  enemy.x += enemy.vx * dt;
  enemy.x = clamp(enemy.x, DEFENSE.barricadeX + 8, WORLD.width - enemy.w - 20);
}

function updateBossEnemy(enemy, dt) {
  enemy.damageReduction = Math.max(0, enemy.damageReduction - dt * 0.35);
  enemy.afterimageTimer = Math.max(0, enemy.afterimageTimer - dt);
  enemy.bossAbilityTimer = Math.max(0, enemy.bossAbilityTimer - dt);
  enemy.bossCastTimer = Math.max(0, enemy.bossCastTimer - dt);
  const desiredX = clamp(760 - state.levelIndex * 34, 610, 800);
  const playerDx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
  const playerDistance = Math.hypot(playerDx, player.y + player.h * 0.5 - (enemy.y + enemy.h * 0.5));
  const runnerBox = getRunnerHitbox();
  const runnerDx = runnerBox.x + runnerBox.w / 2 - (enemy.x + enemy.w / 2);
  const atBarricade = enemy.x <= DEFENSE.lineX + 34;

  if (enemy.x > desiredX + 18) enemy.vx = -getEnemyMoveSpeed(enemy);
  else if (enemy.x < desiredX - 18) enemy.vx = getEnemyMoveSpeed(enemy) * 0.55;
  else enemy.vx = Math.sin(state.time * 1.7 + enemy.bossLevel) * 22;
  if (Math.abs(enemy.vx) > 8 && enemy.bossCastTimer <= 0 && enemy.attackAnim <= 0) enemy.facing = enemy.vx > 0 ? 1 : -1;
  enemy.x += enemy.vx * dt;
  enemy.x = clamp(enemy.x, DEFENSE.barricadeX + 8, WORLD.width - enemy.w - 20);

  if (enemy.attackTimer <= 0) {
    if (playerDistance < enemy.attackRange + 56 && Math.abs(playerDx) < enemy.attackRange + 64) {
      bossBasicRiftClaw(enemy, playerDx >= 0 ? 1 : -1, false);
      return;
    }
    if (atBarricade) {
      bossBasicRiftClaw(enemy, runnerDx >= 0 ? 1 : -1, true);
      return;
    }
  }

  if (enemy.bossAbilityTimer <= 0) castBossAbility(enemy);
}

function bossBasicRiftClaw(enemy, dir, hitBase) {
  enemy.facing = dir;
  enemy.attackTimer = enemy.attackCooldown;
  enemy.attackAnim = 0.46;
  enemy.bossCasting = 'basic';
  enemy.bossCastTimer = 0.44;
  const slashX = dir === 1 ? enemy.x + enemy.w * 0.62 : enemy.x - enemy.w * 0.18;
  const slashY = enemy.y + enemy.h * 0.46;
  const slash = {
    kind: 'riftClaw',
    school: 'rift',
    x: slashX,
    y: slashY,
    w: enemy.w * 0.66,
    h: enemy.h * 0.45,
    dir,
    life: 0.36,
    maxLife: 0.36,
    damage: hitBase ? enemy.baseDamage * 0.85 : enemy.damage,
    color: '#7df9ff',
    accent: '#9b5de5',
    core: '#ffffff',
    hitPlayer: false,
    hitBase: false
  };
  state.hazards.push(slash);
  if (hitBase) damageBase(enemy.baseDamage * 0.5, enemy);
  addBossRiftClawParticles(slash);
}

function castBossAbility(enemy) {
  const kits = {
    1: ['riftLance', 'gravityBloom', 'starfallShards', 'phaseBreak'],
    2: ['magnetHex', 'scrapSwarm', 'batteryDrain', 'salvageTotem'],
    3: ['mirrorHalo', 'emberRing', 'rootSnare', 'recallCurse'],
    4: ['leylineDash', 'blueComet', 'roadSplit', 'timeMile']
  };
  const kit = kits[enemy.bossLevel] || kits[1];
  const ability = kit[enemy.bossAbilityIndex % kit.length];
  enemy.bossAbilityIndex++;
  const targetX = ability === 'starfallShards' ? runner.x + runner.w / 2 : player.x + player.w / 2;
  enemy.facing = targetX >= enemy.x + enemy.w / 2 ? 1 : -1;
  enemy.vx = 0;
  enemy.attackAnim = 0.58;
  enemy.bossCasting = ability;
  enemy.bossCastTimer = 0.82;
  enemy.bossAbilityTimer = 3.2 + enemy.bossLevel * 0.32;
  addFloatingText(enemy.x + enemy.w / 2, enemy.y - 34, bossAbilityLabel(ability), '#b8f3ff', 0.95, -24);

  if (ability === 'riftLance') castRiftLance(enemy);
  else if (ability === 'gravityBloom') castGravityBloom(enemy);
  else if (ability === 'starfallShards') castStarfallShards(enemy);
  else if (ability === 'phaseBreak') castPhaseBreak(enemy);
  else if (ability === 'magnetHex') castMagnetHex(enemy);
  else if (ability === 'scrapSwarm') castScrapSwarm(enemy);
  else if (ability === 'batteryDrain') castBatteryDrain(enemy);
  else if (ability === 'salvageTotem') castSalvageTotem(enemy);
  else if (ability === 'mirrorHalo') castMirrorHalo(enemy);
  else if (ability === 'emberRing') castEmberRing(enemy);
  else if (ability === 'rootSnare') castRootSnare(enemy);
  else if (ability === 'recallCurse') castRecallCurse(enemy);
  else if (ability === 'leylineDash') castLeylineDash(enemy);
  else if (ability === 'blueComet') castBlueComet(enemy);
  else if (ability === 'roadSplit') castRoadSplit(enemy);
  else if (ability === 'timeMile') castTimeMile(enemy);
}

function bossAbilityLabel(ability) {
  return ability.replace(/[A-Z]/g, letter => ` ${letter}`).replace(/^./, letter => letter.toUpperCase());
}

function castRiftLance(enemy) {
  const y = player.y + player.h * 0.52;
  state.hazards.push({ kind: 'beam', school: 'rift', x1: DEFENSE.lineX + 18, x2: VIEW_W - 80, y, h: 38, telegraph: 0.85, maxTelegraph: 0.85, life: 1.1, maxLife: 1.1, damage: 18, color: '#7df9ff', accent: '#9b5de5', core: '#ffffff', runeSpin: rand(0, Math.PI * 2), hitPlayer: false, hitBase: false });
}

function castGravityBloom(enemy) {
  const x = player.x + player.w / 2;
  const y = Math.min(WORLD.groundY - 80, player.y + player.h * 0.48);
  state.hazards.push({ kind: 'gravityBloom', school: 'rift', x, y, r: 132, telegraph: 1.05, maxTelegraph: 1.05, life: 1.42, maxLife: 1.42, damage: 16, color: '#9b5de5', accent: '#7df9ff', core: '#ffffff', runeSpin: rand(0, Math.PI * 2), hitPlayer: false });
}

function castStarfallShards(enemy) {
  const centers = [player.x + player.w / 2, runner.x + runner.w / 2, rand(260, 780), rand(360, 860)];
  centers.forEach((x, index) => {
    state.hazards.push({ kind: 'circleBlast', school: 'rift', x: clamp(x, 130, VIEW_W - 80), y: WORLD.groundY - 6, r: 58, telegraph: 0.78 + index * 0.12, maxTelegraph: 0.78 + index * 0.12, life: 1.1 + index * 0.12, maxLife: 1.1 + index * 0.12, damage: 13, color: '#b8f3ff', accent: '#7df9ff', core: '#ffffff', shardTilt: rand(-0.45, 0.45), runeSpin: rand(0, Math.PI * 2), hitPlayer: false, hitBase: false, falling: true });
  });
}

function castPhaseBreak(enemy) {
  const targetX = clamp(player.x + player.facing * -150, 300, VIEW_W - enemy.w - 80);
  state.hazards.push({ kind: 'phaseBreak', school: 'rift', enemy, fromX: enemy.x, toX: targetX, y: enemy.y, telegraph: 0.55, maxTelegraph: 0.55, life: 0.95, maxLife: 0.95, damage: 15, color: '#5dd8ff', accent: '#9b5de5', core: '#ffffff', runeSpin: rand(0, Math.PI * 2), hitPlayer: false });
}

function castMagnetHex(enemy) {
  for (let i = 0; i < 3; i++) {
    state.hazards.push({ kind: 'sweepLine', x: VIEW_W + i * 95, y: WORLD.groundY - 110 - i * 42, w: 170, h: 24, vx: -340, life: 2.2, damage: 11, color: '#ffb703', hitPlayer: false });
  }
}

function castScrapSwarm(enemy) {
  for (let i = 0; i < 7; i++) {
    const ex = enemy.x + enemy.w * 0.45;
    const ey = enemy.y + enemy.h * 0.35;
    const tx = (i % 2 === 0 ? player.x + player.w / 2 : runner.x + runner.w / 2) + rand(-35, 35);
    const ty = (i % 2 === 0 ? player.y + player.h * 0.45 : runner.y + runner.h * 0.45) + rand(-25, 25);
    const a = Math.atan2(ty - ey, tx - ex);
    const speed = 230 + i * 18;
    state.projectiles.push({ x: ex, y: ey, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 8, damage: 9, life: 3.2, fromEnemy: true, target: i % 2 === 0 ? 'player' : 'base', color: '#ffb703', kind: 'scrap' });
  }
}

function castBatteryDrain(enemy) {
  state.hazards.push({ kind: 'batteryDrain', enemy, telegraph: 0.35, life: 2.15, tick: 0, damage: 3, color: '#70e000' });
}

function castSalvageTotem(enemy) {
  enemy.damageReduction = Math.max(enemy.damageReduction, 0.55);
  state.hazards.push({ kind: 'totemShield', enemy, x: enemy.x - 48, y: WORLD.groundY - 96, r: 48, life: 4.5, tick: 0, damage: 7, color: '#ffd166' });
}

function castMirrorHalo(enemy) {
  enemy.damageReduction = Math.max(enemy.damageReduction, 0.42);
  state.hazards.push({ kind: 'mirrorHalo', enemy, life: 3.4, color: '#ffd166' });
}

function castEmberRing(enemy) {
  state.hazards.push({ kind: 'emberRing', x: enemy.x + enemy.w / 2, y: WORLD.groundY - 14, r: 20, maxR: 360, life: 1.7, damage: 14, color: '#ff7a33', hitPlayer: false, hitBase: false });
}

function castRootSnare(enemy) {
  [player.x + player.w / 2, player.x + player.w / 2 + rand(-130, 130), runner.x + runner.w / 2].forEach((x, index) => {
    state.hazards.push({ kind: 'rootSnare', x: clamp(x, 130, VIEW_W - 90), y: WORLD.groundY - 10, r: 46, telegraph: 0.72 + index * 0.1, life: 1.22 + index * 0.1, damage: 8, color: '#70e000', hitPlayer: false, hitBase: false });
  });
}

function castRecallCurse(enemy) {
  state.hazards.push({ kind: 'recallCurse', x: player.x + player.w / 2, y: player.y + player.h / 2, telegraph: 1.25, life: 1.65, damage: 16, color: '#f15bb5', hitPlayer: false });
}

function castLeylineDash(enemy) {
  const fromX = enemy.x;
  const toX = clamp(player.x + player.w / 2 - enemy.w / 2, 220, VIEW_W - enemy.w - 80);
  state.hazards.push({ kind: 'leylineDash', enemy, fromX, toX, y: WORLD.groundY - 42, telegraph: 0.48, life: 0.95, damage: 17, color: '#5dd8ff', hitPlayer: false });
}

function castBlueComet(enemy) {
  [player.x + player.w / 2, runner.x + runner.w / 2, rand(280, 760), rand(360, 860)].forEach((x, index) => {
    state.hazards.push({ kind: 'blueComet', x: clamp(x, 130, VIEW_W - 80), y: WORLD.groundY - 6, r: 58, telegraph: 0.88 + index * 0.16, life: 1.28 + index * 0.16, damage: 15, color: '#5dd8ff', hitPlayer: false, hitBase: false });
  });
}

function castRoadSplit(enemy) {
  for (let i = 0; i < 4; i++) {
    const y = WORLD.groundY - 22 - i * 46;
    state.hazards.push({ kind: 'roadSplit', x: 120, y, w: VIEW_W - 220, h: 26, telegraph: 0.9 + i * 0.08, life: 1.38 + i * 0.08, damage: 12, color: '#7df9ff', hitPlayer: false, hitBase: false });
  }
}

function castTimeMile(enemy) {
  state.timeSlow = Math.max(state.timeSlow, 2.35);
  enemy.afterimageTimer = Math.max(enemy.afterimageTimer, 2.35);
  state.hazards.push({ kind: 'timeMile', enemy, life: 2.35, tick: 0, color: '#b8f3ff' });
}

function getEnemyMoveSpeed(enemy) {
  return enemy.speed * (enemy.slowTimer > 0 ? 0.48 : 1);
}

function shootAtPlayer(enemy) {
  const ex = enemy.x + enemy.w / 2;
  const ey = enemy.y + enemy.h * 0.36;
  const px = player.x + player.w / 2;
  const py = player.y + player.h * 0.45;
  const a = Math.atan2(py - ey, px - ex);
  const speed = 405;
  state.projectiles.push({ x: ex, y: ey, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, damage: enemy.damage, life: 2.4, fromEnemy: true, target: 'player', color: '#5dd8ff' });
}

function shootAtBase(enemy) {
  const ex = enemy.x + enemy.w / 2;
  const ey = enemy.y + enemy.h * 0.36;
  const targetBox = getRunnerHitbox();
  const tx = targetBox.x + targetBox.w * 0.5;
  const ty = targetBox.y + targetBox.h * 0.42;
  const a = Math.atan2(ty - ey, tx - ex);
  const speed = 355;
  state.projectiles.push({ x: ex, y: ey, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, damage: enemy.baseDamage, life: 3.2, fromEnemy: true, target: 'base', color: '#5dd8ff' });
}

function updateProjectiles(dt) {
  for (const p of state.projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.target === 'enemy') {
      if (!p.hitEnemies) p.hitEnemies = new Set();
      for (const enemy of state.enemies) {
        if (p.hitEnemies.has(enemy)) continue;
        if (!enemy.dead && circleRectOverlap(p, enemy)) {
          p.hitEnemies.add(enemy);
          p.pierce = Number.isFinite(p.pierce) ? p.pierce : 0;
          p.life = p.pierce > 0 ? p.life : 0;
          if (p.pierce > 0) p.pierce--;
          hitEnemy(enemy, p.damage, p.vx > 0 ? 1 : -1, false, 0.22);
          addEnergyImpact(p.x, p.y);
          state.slowMo = 0.025;
          if (p.life <= 0) break;
        }
      }
    }
    if (p.target === 'player' && circleRectOverlap(p, player) && player.invuln <= 0) {
      p.life = 0;
      damagePlayer(p.damage, p.vx > 0 ? 1 : -1);
    }
    if (p.target === 'base' && circleRectOverlap(p, getRunnerHitbox())) {
      p.life = 0;
      damageBase(p.damage, { x: p.x, y: p.y, w: 1, h: 1, color: p.color });
    }
  }
  state.projectiles = state.projectiles.filter(p => p.life > 0 && p.x > -200 && p.x < WORLD.width + 200 && p.y > -200 && p.y < VIEW_H + 200);
}

function updateBossHazards(dt) {
  for (const hazard of state.hazards) {
    hazard.life -= dt;
    if (hazard.telegraph > 0) hazard.telegraph -= dt;
    if (hazard.kind === 'sweepLine') updateSweepLineHazard(hazard, dt);
    else if (hazard.kind === 'gravityBloom') updateGravityBloomHazard(hazard, dt);
    else if (hazard.kind === 'riftClaw') updateRiftClawHazard(hazard);
    else if (hazard.kind === 'batteryDrain') updateBatteryDrainHazard(hazard, dt);
    else if (hazard.kind === 'totemShield') updateTotemShieldHazard(hazard, dt);
    else if (hazard.kind === 'phaseBreak') updatePhaseBreakHazard(hazard);
    else if (hazard.kind === 'leylineDash') updateLeylineDashHazard(hazard);
    else if (hazard.kind === 'timeMile') updateTimeMileHazard(hazard, dt);
    else updateDetonationHazard(hazard);
  }
  state.hazards = state.hazards.filter(hazard => hazard.life > 0);
}

function updateSweepLineHazard(hazard, dt) {
  hazard.x += hazard.vx * dt;
  const box = { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h };
  if (!hazard.hitPlayer && rectsOverlap(box, player)) {
    hazard.hitPlayer = true;
    damagePlayer(hazard.damage, -1);
  }
}

function updateGravityBloomHazard(hazard, dt) {
  if (hazard.telegraph > 0) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = hazard.x - px;
    const dy = hazard.y - py;
    const dist = Math.max(1, Math.hypot(dx, dy));
    if (dist < hazard.r * 1.35) {
      player.vx += (dx / dist) * 520 * dt;
      player.vy += (dy / dist) * 260 * dt;
    }
    return;
  }
  hitCircleHazard(hazard, hazard.r, true, true);
}

function updateRiftClawHazard(hazard) {
  const box = {
    x: hazard.dir === 1 ? hazard.x : hazard.x - hazard.w,
    y: hazard.y - hazard.h / 2,
    w: hazard.w,
    h: hazard.h
  };
  hitRectHazard(box, true, true, hazard);
}

function updateBatteryDrainHazard(hazard, dt) {
  if (!hazard.enemy || hazard.enemy.dead) {
    hazard.life = 0;
    return;
  }
  hazard.tick -= dt;
  if (hazard.tick > 0 || hazard.telegraph > 0) return;
  hazard.tick = 0.28;
  const bossCenter = { x: hazard.enemy.x + hazard.enemy.w / 2, y: hazard.enemy.y + hazard.enemy.h / 2 };
  const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  if (Math.hypot(playerCenter.x - bossCenter.x, playerCenter.y - bossCenter.y) < 560) {
    player.stamina = Math.max(0, player.stamina - 10);
    if (player.invuln <= 0) damagePlayer(hazard.damage, playerCenter.x < bossCenter.x ? -1 : 1);
    addFloatingText(playerCenter.x, player.y - 24, '-stamina', '#70e000', 0.42, -20);
  }
}

function updateTotemShieldHazard(hazard, dt) {
  if (!hazard.enemy || hazard.enemy.dead) {
    hazard.life = 0;
    return;
  }
  hazard.x = hazard.enemy.x - 54;
  hazard.y = WORLD.groundY - 96;
  hazard.enemy.damageReduction = Math.max(hazard.enemy.damageReduction, 0.4);
  hazard.tick -= dt;
  if (hazard.tick <= 0) {
    hazard.tick = 0.7;
    const targetBase = Math.random() < 0.5;
    const target = targetBase ? getRunnerHitbox() : player;
    shootBossOrb(hazard.x, hazard.y, target.x + target.w / 2, target.y + target.h / 2, hazard.damage, '#ffd166', targetBase ? 'base' : 'player');
  }
}

function updatePhaseBreakHazard(hazard) {
  if (!hazard.enemy || hazard.enemy.dead) {
    hazard.life = 0;
    return;
  }
  if (!hazard.moved && hazard.telegraph <= 0) {
    hazard.moved = true;
    hazard.enemy.x = hazard.toX;
    hazard.enemy.facing = player.x + player.w / 2 > hazard.enemy.x + hazard.enemy.w / 2 ? 1 : -1;
    addShockwaveBlast(hazard.enemy.x + hazard.enemy.w / 2, hazard.enemy.y + hazard.enemy.h * 0.55, 150);
    hitCircleHazard({ x: hazard.enemy.x + hazard.enemy.w / 2, y: hazard.enemy.y + hazard.enemy.h * 0.55, damage: hazard.damage, color: hazard.color }, 150, true, false);
  }
}

function updateLeylineDashHazard(hazard) {
  if (!hazard.enemy || hazard.enemy.dead) {
    hazard.life = 0;
    return;
  }
  if (!hazard.moved && hazard.telegraph <= 0) {
    hazard.moved = true;
    hazard.enemy.x = hazard.toX;
    hazard.enemy.afterimageTimer = Math.max(hazard.enemy.afterimageTimer, 0.9);
  }
  if (hazard.telegraph <= 0) {
    const x = Math.min(hazard.fromX, hazard.toX);
    const w = Math.abs(hazard.toX - hazard.fromX) + hazard.enemy.w;
    hitRectHazard({ x, y: WORLD.groundY - 68, w, h: 56, damage: hazard.damage, color: hazard.color }, true, true, hazard);
  }
}

function updateTimeMileHazard(hazard, dt) {
  if (!hazard.enemy || hazard.enemy.dead) {
    hazard.life = 0;
    return;
  }
  hazard.tick -= dt;
  if (hazard.tick <= 0) {
    hazard.tick = 0.42;
    const ex = hazard.enemy.x + hazard.enemy.w * 0.45;
    shootBossOrb(ex, hazard.enemy.y + hazard.enemy.h * 0.4, player.x + player.w / 2, player.y + player.h * 0.5, 8, '#b8f3ff', 'player', 360);
  }
}

function updateDetonationHazard(hazard) {
  if (hazard.telegraph > 0) return;
  if (hazard.kind === 'circleBlast' || hazard.kind === 'blueComet') hitCircleHazard(hazard, hazard.r, true, true);
  else if (hazard.kind === 'beam') hitRectHazard({ x: hazard.x1, y: hazard.y - hazard.h / 2, w: hazard.x2 - hazard.x1, h: hazard.h, damage: hazard.damage, color: hazard.color }, true, true, hazard);
  else if (hazard.kind === 'emberRing') updateEmberRingHazard(hazard);
  else if (hazard.kind === 'rootSnare') updateRootSnareHazard(hazard);
  else if (hazard.kind === 'recallCurse') updateRecallCurseHazard(hazard);
  else if (hazard.kind === 'roadSplit') hitRectHazard(hazard, true, true, hazard);
}

function updateEmberRingHazard(hazard) {
  const age = 1.7 - hazard.life;
  hazard.r = clamp(age / 1.35, 0, 1) * hazard.maxR;
  const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h };
  const dist = Math.hypot(playerCenter.x - hazard.x, playerCenter.y - hazard.y);
  if (!hazard.hitPlayer && Math.abs(dist - hazard.r) < 24) {
    hazard.hitPlayer = true;
    damagePlayer(hazard.damage, playerCenter.x < hazard.x ? -1 : 1);
  }
  const runnerBox = getRunnerHitbox();
  const rx = runnerBox.x + runnerBox.w / 2;
  const ry = runnerBox.y + runnerBox.h;
  if (!hazard.hitBase && Math.abs(Math.hypot(rx - hazard.x, ry - hazard.y) - hazard.r) < 24) {
    hazard.hitBase = true;
    damageBase(hazard.damage * 0.75, null);
  }
}

function updateRootSnareHazard(hazard) {
  if (hitCircleHazard(hazard, hazard.r, true, true)) player.rootTimer = Math.max(player.rootTimer, 1.0);
}

function updateRecallCurseHazard(hazard) {
  if (hazard.telegraph <= 0 && !hazard.recalled) {
    hazard.recalled = true;
    player.x = clamp(hazard.x - player.w / 2, DEFENSE.playerMinX, DEFENSE.playerMaxX - player.w);
    player.y = clamp(hazard.y - player.h / 2, 60, WORLD.groundY - player.h);
    player.vx = 0;
    player.vy = 0;
  }
  if (hazard.telegraph <= -0.18) hitCircleHazard(hazard, 80, true, false);
}

function hitCircleHazard(hazard, radius, affectPlayer, affectBase) {
  let hit = false;
  if (affectPlayer && !hazard.hitPlayer && circleRectOverlap({ x: hazard.x, y: hazard.y, r: radius }, player)) {
    hazard.hitPlayer = true;
    hit = true;
    damagePlayer(hazard.damage, player.x + player.w / 2 < hazard.x ? -1 : 1);
  }
  if (affectBase && !hazard.hitBase && circleRectOverlap({ x: hazard.x, y: hazard.y, r: radius }, getRunnerHitbox())) {
    hazard.hitBase = true;
    hit = true;
    damageBase(hazard.damage * 0.7, null);
  }
  return hit;
}

function hitRectHazard(box, affectPlayer, affectBase, hazard = box) {
  let hit = false;
  if (affectPlayer && !hazard.hitPlayer && rectsOverlap(box, player)) {
    hazard.hitPlayer = true;
    hit = true;
    damagePlayer(box.damage, player.x + player.w / 2 < box.x + box.w / 2 ? -1 : 1);
  }
  if (affectBase && !hazard.hitBase && rectsOverlap(box, getRunnerHitbox())) {
    hazard.hitBase = true;
    hit = true;
    damageBase(box.damage * 0.72, null);
  }
  return hit;
}

function shootBossOrb(x, y, tx, ty, damage, color, target = 'player', speed = 300) {
  const a = Math.atan2(ty - y, tx - x);
  state.projectiles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 10, damage, life: 3, fromEnemy: true, target, color, kind: 'bossOrb' });
}

function updatePickups(dt) {
  for (const pickup of state.pickups) {
    if (!isValidGamePickup(pickup)) {
      pickup.dead = true;
      continue;
    }
    pickup.t += dt;
    pickup.vy += WORLD.gravity * 0.45 * dt;
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;
    if (pickup.y > WORLD.groundY - pickup.r) {
      pickup.y = WORLD.groundY - pickup.r;
      pickup.vy *= -0.38;
      pickup.vx *= 0.86;
    }
    const dx = (player.x + player.w / 2) - pickup.x;
    const dy = (player.y + player.h / 2) - pickup.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const stats = getUpgradeStats();
    const magnetRadius = 135 + stats.pickupMagnet + Math.min(state.combo, 20) * 4;
    if (d < magnetRadius) {
      const pull = 380 + Math.min(state.combo, 20) * 11;
      pickup.x += (dx / d) * pull * dt;
      pickup.y += (dy / d) * pull * dt;
    }
    if (d < 44) {
      pickup.dead = true;
      if (pickup.type === 'coin') {
        state.coins += pickup.value;
        addFloatingText(player.x + player.w / 2, player.y - 10, `+${pickup.value} coin`, '#ffd166');
      } else if (pickup.type === 'heart') {
        const heal = Math.round(pickup.value * (1 + stats.pickupHealBonus));
        player.hp = clamp(player.hp + heal, 0, player.maxHp);
        addFloatingText(player.x + player.w / 2, player.y - 10, `+${heal} HP`, '#70e000');
      } else if (pickup.type === 'repair') {
        const repair = Math.round(pickup.value * (1 + stats.pickupHealBonus));
        state.baseHp = clamp(state.baseHp + repair, 0, state.baseMaxHp);
        addFloatingText(runner.x + runner.w / 2, runner.y - 12, `+${repair} Ashtar`, '#70e000');
      }
    }
  }
  state.pickups = state.pickups.filter(p => isValidGamePickup(p) && !p.dead);
  capGamePickups();
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.96, dt * 60);
    p.vy += 400 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
  capGameParticles();
}

function updateShockwaves(dt) {
  for (const wave of state.shockwaves) {
    wave.life -= dt;
  }
  state.shockwaves = state.shockwaves.filter(wave => wave.life > 0);
}

function updatePendingShockwaveHits() {
  if (!state.pendingShockwaveHits.length) return;
  const batch = state.pendingShockwaveHits[0];
  let processed = 0;
  while (processed < MAX_GAME_SHOCKWAVE_HITS_PER_FRAME && batch.targets.length) {
    const enemy = batch.targets.shift();
    if (!enemy || enemy.dead || enemy.remove) continue;
    processed++;
    batch.hitCount++;
    if (batch.slow > 0) enemy.slowTimer = Math.max(enemy.slowTimer || 0, batch.slow);
    const enemyCenterX = enemy.x + enemy.w / 2;
    const dir = enemyCenterX < batch.x ? -1 : 1;
    const showDeathEffects = batch.deathEffects < MAX_GAME_SHOCKWAVE_DEATH_EFFECTS;
    hitEnemy(enemy, batch.damage, dir, true, 0.65, {
      quiet: batch.hitCount > 5,
      deathEffects: showDeathEffects,
      dropPickups: showDeathEffects || enemy.boss
    });
    if ((enemy.dead || enemy.remove) && showDeathEffects) batch.deathEffects++;
  }
  if (!batch.targets.length) state.pendingShockwaveHits.shift();
}

function updateFloatingText(dt) {
  for (const t of state.floatingText) {
    t.y += t.vy * dt;
    t.life -= dt;
  }
  state.floatingText = state.floatingText.filter(t => t.life > 0);
  capGameFloatingText();
}

function updateWaveState(dt) {
  const allSpawned = state.spawnPlans.every(p => p.countLeft <= 0);
  const allDead = state.enemies.length === 0;
  if (state.waveRunning && allSpawned && allDead) {
    state.waveRunning = false;
    state.totalWavesCleared++;
    const finalWave = state.waveIndex >= currentLevel().waves.length - 1;
    addFloatingText(455, 255, finalWave ? 'LEVEL CLEAR' : 'WAVE CLEAR', finalWave ? '#ffd166' : '#70e000', 1.1, -30);
    if (finalWave) {
      const wave = currentWave();
      state.waveClearTimer = Math.max(wave?.rest ?? 1.0, 1.0);
    } else {
      showUpgradeScreen();
    }
  }
  if (!state.waveRunning && state.waveClearTimer > 0) {
    state.waveClearTimer -= dt;
    if (state.waveClearTimer <= 0) {
      state.waveIndex++;
      if (state.waveIndex >= currentLevel().waves.length) clearLevel();
      else beginWave();
    }
  }
}

function showUpgradeScreen() {
  if (!window.UPGRADE_SYSTEM) {
    continueAfterUpgrade();
    return;
  }
  state.mode = 'upgrade';
  state.upgradeChoices = window.UPGRADE_SYSTEM.getChoices(4);
  hideScreens();
  ui.upgradeScreen.classList.add('show');
  renderUpgradeChoices();
}

function renderUpgradeChoices() {
  ui.upgradeChoices.innerHTML = '';
  const nextWave = currentLevel().waves[state.waveIndex + 1];
  ui.upgradeIntro.textContent = nextWave
    ? `Choose one upgrade before ${nextWave.label} hits.`
    : 'Choose one upgrade before the next fight.';
  ui.upgradePointsText.textContent = `Upgrades chosen: ${window.UPGRADE_SYSTEM ? window.UPGRADE_SYSTEM.getTakenCount() : 0}`;

  if (!state.upgradeChoices.length) {
    const empty = document.createElement('p');
    empty.textContent = 'All upgrades are maxed out. Continue to the next wave.';
    ui.upgradeChoices.appendChild(empty);
    return;
  }

  for (const upgrade of state.upgradeChoices) {
    const card = document.createElement('button');
    card.className = `upgrade-card rarity-${upgrade.rarity || 'common'}`;
    card.innerHTML = `
      <span class="upgrade-rarity">${upgrade.rarity || 'common'}</span>
      <span class="upgrade-tag">${upgrade.tag}</span>
      <span class="upgrade-name">${upgrade.name}</span>
      <span class="upgrade-level">Level ${upgrade.currentLevel} -> ${upgrade.nextLevel} / ${upgrade.maxLevel}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
    `;
    card.addEventListener('click', () => chooseUpgrade(upgrade.id));
    ui.upgradeChoices.appendChild(card);
  }
}

function chooseUpgrade(id) {
  if (!window.UPGRADE_SYSTEM) return continueAfterUpgrade();
  const result = window.UPGRADE_SYSTEM.applyUpgrade(id);
  if (result) {
    addFloatingText(player.x + player.w / 2, player.y - 38, `${result.name} +1`, '#ffd166', 1.2, -38);
    applyUpgradeBonuses({ preserveRatios: true, healBetweenWaves: true, repairBetweenWaves: true, refillStamina: true });
  }
  continueAfterUpgrade();
}

function bankRepairAndContinue() {
  const repair = 18 + state.levelIndex * 6 + state.waveIndex * 4;
  state.baseHp = clamp(state.baseHp + repair, 0, state.baseMaxHp);
  player.hp = clamp(player.hp + Math.round(repair * 0.35), 0, player.maxHp);
  addFloatingText(runner.x + runner.w / 2, runner.y - 18, `+${repair} Ashtar`, '#70e000', 1.0, -34);
  continueAfterUpgrade();
}

function continueAfterUpgrade() {
  hideScreens();
  applyUpgradeBonuses({ preserveRatios: true, healBetweenWaves: false, repairBetweenWaves: false, refillStamina: true });
  state.mode = 'playing';
  state.waveIndex++;
  state.waveClearTimer = 0;
  if (state.waveIndex >= currentLevel().waves.length) clearLevel();
  else beginWave();
  updateHUD();
}

function hitEnemy(enemy, damage, dir, special, knockbackScale = 1, options = {}) {
  const effectiveDamage = damage * (1 - clamp(enemy.damageReduction || 0, 0, 0.75));
  enemy.hp -= effectiveDamage;
  enemy.hurt = 0.12;
  enemy.x += dir * (special ? 48 : 24) * knockbackScale;
  enemy.vx = dir * (special ? 270 : 165) * knockbackScale;
  enemy.attackingBase = false;
  if (!options.quiet) {
    addFloatingText(enemy.x + enemy.w / 2, enemy.y - 8, String(Math.round(effectiveDamage)), special ? '#5dd8ff' : '#ffffff');
    addHitBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color);
  }
  state.combo++;
  state.comboTimer = 2.2;
  if (enemy.hp <= 0) killEnemy(enemy, options);
}

function killEnemy(enemy, options = {}) {
  if (enemy.dead) return;
  enemy.dead = true;
  enemy.remove = true;
  state.slowMo = enemy.boss ? 0.13 : 0.04;
  const showDeathEffects = options.deathEffects !== false && !options.quiet;
  if (showDeathEffects) {
    addFloatingText(enemy.x + enemy.w / 2, enemy.y - 28, enemy.boss ? 'BOSS DOWN' : (enemy.elite ? 'ELITE KO' : 'KO'), '#ffd166');
  }
  const comboBonus = 1 + Math.min(state.combo, FEEL.comboCoinCap) * 0.01;
  const coinValue = Math.max(1, Math.round(enemy.coin * getUpgradeStats().coinMultiplier * comboBonus));
  const coinCount = enemy.boss ? 10 : Math.max(1, Math.ceil(coinValue / 2));
  if (state.combo > 0 && state.combo % FEEL.comboRewardEvery === 0) {
    player.stamina = clamp(player.stamina + 12, 0, player.maxStamina);
    addFloatingText(player.x + player.w / 2, player.y - 42, `${state.combo} chain`, '#5dd8ff', 0.85, -32);
  }
  if (options.dropPickups === false) {
    state.coins += coinValue;
    return;
  }
  for (let i = 0; i < coinCount; i++) {
    state.pickups.push({ type: 'coin', x: enemy.x + enemy.w / 2 + rand(-18, 18), y: enemy.y + enemy.h / 2, vx: rand(-180, 180), vy: rand(-520, -240), r: 8, value: Math.max(1, Math.round(coinValue / coinCount)), t: 0 });
  }
  if (Math.random() < (enemy.elite ? 0.24 : 0.13) || enemy.boss) {
    state.pickups.push({ type: 'heart', x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2, vx: rand(-90, 90), vy: rand(-460, -300), r: 11, value: enemy.boss ? 35 : (enemy.elite ? 22 : 16), t: 0 });
  }
  if (Math.random() < (enemy.elite ? 0.18 : 0.10) || enemy.boss) {
    state.pickups.push({ type: 'repair', x: enemy.x + enemy.w / 2 + rand(-10, 10), y: enemy.y + enemy.h / 2, vx: rand(-90, 90), vy: rand(-440, -280), r: 10, value: enemy.boss ? 28 : (enemy.elite ? 16 : 10), t: 0 });
  }
  capGamePickups();
}

function damagePlayer(amount, dir) {
  if (player.invuln > 0) return;
  player.hp -= amount;
  player.invuln = 0.48;
  player.hurtFlash = 0.18;
  player.vx = dir * 330;
  player.vy = -220;
  state.combo = 0;
  addFloatingText(player.x + player.w / 2, player.y - 16, `-${Math.round(amount)} HP`, '#ff4d6d');
  addHitBurst(player.x + player.w / 2, player.y + player.h / 2, '#ff4d6d');
  if (player.hp <= 0) {
    player.hp = 0;
    gameOver('Your fighter went down before the wave was stopped.');
  }
}

function damageBase(amount, enemy) {
  const stats = getUpgradeStats();
  const reducedAmount = amount * (1 - clamp(stats.ashtarDamageReduction, 0, 0.72));
  state.baseHp -= reducedAmount;
  state.baseHp = Math.max(0, state.baseHp);
  const thorns = stats.barricadeThorns;
  if (thorns > 0 && enemy && !enemy.dead) hitEnemy(enemy, thorns, 1, true);
  const runnerBox = getRunnerHitbox();
  runner.animTime = 0;
  state.dangerPulse = 0.35;
  addFloatingText(runnerBox.x + runnerBox.w / 2, runnerBox.y + 18, `-${Math.round(reducedAmount)} Ashtar`, '#ff4d6d');
  addHitBurst(runnerBox.x + runnerBox.w / 2, runnerBox.y + runnerBox.h / 2, '#ff4d6d');
  if (state.baseHp <= 0) gameOver('Ashtar was taken down. The route is lost.');
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawBackground();
  drawWorldDecor();
  drawBase();
  drawPickups();
  drawPlayer();
  drawEnemies();
  drawBossHazards();
  drawProjectiles();
  drawShockwaves();
  drawParticles();
  drawFloatingText();
  drawForeground();
  drawFloorDevGuide();
  drawScreenOverlay();
  ctx.restore();
}

function drawBackground() {
  const bgImg = images.get(currentLevel().background) || images.get(ASSETS.background);
  if (bgImg && bgImg.complete && bgImg.naturalWidth) {
    ctx.drawImage(bgImg, 0, 0, VIEW_W, VIEW_H);
    return;
  }
  const level = currentLevel();
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, level.sky[0]);
  gradient.addColorStop(0.68, level.sky[1]);
  gradient.addColorStop(1, '#050711');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#b8f3ff';
  ctx.beginPath();
  ctx.arc(1040, 105, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = -1; i < 10; i++) {
    const x = i * 170 + 30;
    const h = 120 + ((i * 47) % 160);
    ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.26)';
    ctx.fillRect(x, WORLD.groundY - h - 80, 120, h + 80);
  }
}

function drawWorldDecor() {
}

function drawBase() {
  drawLootFromCraftBox();
  drawProtectedRunner();
  drawRunnerPath();
}

function drawLootFromCraftBox() {
  const frames = ASSETS.foregrounds.lootFromCraft;
  if (!frames.length) return;
  const pathStart = runner.path.points[0] || getDefaultRunnerPath().points[0];
  const framePath = frames[clamp(state.lootBoxFrame, 0, frames.length - 1)];
  const img = images.get(framePath);
  const w = 86;
  const h = 70;
  const x = clamp(pathStart.x - w - 8, 12, VIEW_W - w - 12);
  const y = pathStart.y - h + 6;

  if (img && img.complete && img.naturalWidth) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  ctx.save();
  ctx.fillStyle = 'rgba(42, 27, 18, 0.9)';
  roundRect(ctx, x, y, w, h, 8, true);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.72)';
  roundRect(ctx, x + 12, y + 14, w - 24, 10 + state.lootBoxFrame * 4, 5, true);
  ctx.restore();
}

function drawRunnerPath() {
  if (!gameDevMode) return;
  const points = runner.path.points;
  if (!points.length) return;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.88)';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  if (points.length > 2) ctx.lineTo(points[0].x, points[0].y);
  ctx.stroke();
  ctx.setLineDash([]);
  points.forEach((point, index) => {
    ctx.fillStyle = index === runner.targetIndex ? 'rgba(255, 209, 102, 0.42)' : 'rgba(112, 224, 0, 0.26)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050812';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), point.x, point.y);
  });
  ctx.restore();
}

function drawProtectedRunner() {
  const spriteDrawn = drawAshtarSprite();
  if (spriteDrawn) {
    drawAshtarHealthBar();
    return;
  }

  const hurt = state.dangerPulse > 0 && Math.floor(state.time * 22) % 2 === 0;
  const stride = Math.sin(runner.animTime * 12) * 5;
  const scale = runner.scale || 1;
  const footX = runner.x + runner.w / 2;
  const footY = runner.y + runner.h;
  ctx.save();
  ctx.globalAlpha = hurt ? 0.72 : 1;
  ctx.translate(footX, footY);
  ctx.scale(scale, scale);
  if (runner.facing < 0) ctx.scale(-1, 1);
  ctx.fillStyle = '#70e000';
  roundRect(ctx, -runner.w / 2 + 6, -runner.h + 22, runner.w - 12, runner.h - 22, 10, true);
  ctx.fillStyle = '#d7f7ff';
  roundRect(ctx, -runner.w / 2 + 7, -runner.h, runner.w - 14, 28, 10, true);
  ctx.fillStyle = '#07101f';
  ctx.fillRect(7, -runner.h + 10, 6, 5);
  ctx.fillStyle = '#1f7a3a';
  ctx.fillRect(-runner.w / 2 + 8, -10, 10, 22 + stride * 0.25);
  ctx.fillRect(runner.w / 2 - 18, -10, 10, 22 - stride * 0.25);
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, -runner.w / 2 - 4, -runner.h + 32, 9, 26, 5, true);
  roundRect(ctx, runner.w / 2 - 5, -runner.h + 32, 9, 26, 5, true);
  ctx.restore();

  drawAshtarHealthBar();
}

function drawAshtarSprite() {
  const spriteSet = getAshtarSpriteSet();
  if (!spriteSet.length) return false;
  const box = getRunnerHitbox();
  return drawAnimatedSprite(spriteSet, box.x, box.y, box.w, box.h, runner.facing, runner.animTime, getAshtarAnimationFps(), { loop: true });
}

function getAshtarSpriteSet() {
  if (runner.pauseTimer > 0) return getReadySpriteSet(ASSETS.ashtar.gathering, ASSETS.ashtar.idle);
  if (isAshtarCarrying()) return getReadySpriteSet(ASSETS.ashtar.carrying, ASSETS.ashtar.idle);
  if (runner.path.points.length >= 2) return getReadySpriteSet(ASSETS.ashtar.walking, ASSETS.ashtar.idle);
  return ASSETS.ashtar.idle;
}

function getAshtarAnimationFps() {
  if (runner.pauseTimer > 0) return 6;
  if (isAshtarCarrying()) return 7;
  return 8;
}

function isAshtarCarrying() {
  return runner.path.points.length > 8 && runner.segmentStartIndex >= 7;
}

function drawAshtarHealthBar() {
  ctx.save();
  const runnerBox = getRunnerHitbox();
  const pct = clamp(state.baseHp / state.baseMaxHp, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  roundRect(ctx, runnerBox.x - 8, runnerBox.y - 18, runnerBox.w + 16, 8, 999, true);
  ctx.fillStyle = pct < 0.35 ? '#ff4d6d' : '#70e000';
  roundRect(ctx, runnerBox.x - 8, runnerBox.y - 18, (runnerBox.w + 16) * pct, 8, 999, true);
  ctx.restore();
}

function getRunnerHitbox() {
  const scale = runner.scale || 1;
  const w = runner.w * scale;
  const h = runner.h * scale;
  const footX = runner.x + runner.w / 2;
  const footY = runner.y + runner.h;
  return {
    x: footX - w / 2,
    y: footY - h,
    w,
    h
  };
}

function drawForeground() {
  const fgImg = images.get(ASSETS.foreground);
  if (fgImg && fgImg.complete && fgImg.naturalWidth) ctx.drawImage(fgImg, 0, 0, VIEW_W, VIEW_H);
}

function drawFloorDevGuide() {
  if (!gameDevMode) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 10]);
  ctx.beginPath();
  ctx.moveTo(0, WORLD.groundY);
  ctx.lineTo(VIEW_W, WORLD.groundY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(5, 8, 18, 0.8)';
  roundRect(ctx, VIEW_W - 146, WORLD.groundY - 34, 132, 25, 8, true);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`FLOOR Y ${Math.round(WORLD.groundY)}`, VIEW_W - 80, WORLD.groundY - 17);
  ctx.restore();
}

function drawPlayer() {
  const spriteSet = getPlayerSpriteSet();
  const spriteW = player.w * FEEL.playerSpriteWidthScale;
  const spriteX = player.x - (spriteW - player.w) / 2;
  if (drawAnimatedSprite(spriteSet, spriteX, player.y, spriteW, player.h, player.facing, player.animTime, getPlayerAnimationFps(), getPlayerAnimationOptions())) return;
  ctx.save();
  const flash = player.hurtFlash > 0 || (player.invuln > 0 && Math.floor(state.time * 24) % 2 === 0);
  ctx.globalAlpha = player.invuln > 0 ? 0.72 : 1;
  ctx.fillStyle = flash ? '#ffffff' : '#5dd8ff';
  roundRect(ctx, player.x, player.y + 16, player.w, player.h - 16, 12, true);
  ctx.fillStyle = '#d7f7ff';
  roundRect(ctx, player.x + 10, player.y, player.w - 20, 34, 12, true);
  ctx.fillStyle = '#07101f';
  const eyeX = player.facing === 1 ? player.x + player.w - 18 : player.x + 10;
  ctx.fillRect(eyeX, player.y + 12, 8, 7);
  ctx.fillStyle = '#2274a5';
  const stride = Math.sin(player.animTime * 16) * (Math.abs(player.vx) > 20 && player.onGround ? 8 : 0);
  ctx.fillRect(player.x + 8, player.y + player.h - 10, 13, 28 + stride * 0.2);
  ctx.fillRect(player.x + player.w - 21, player.y + player.h - 10, 13, 28 - stride * 0.2);
  if (player.attacking > 0) {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = player.attackKind === 'kick' ? '#ffd166' : (player.attackKind === 'shoot' ? '#5dd8ff' : '#ffffff');
    ctx.lineWidth = player.attackKind === 'shoot' ? 3 : (player.attackKind === 'kick' ? 10 : 8);
    ctx.beginPath();
    const cx = player.facing === 1 ? player.x + player.w + 18 : player.x - 18;
    const radius = player.attackKind === 'shoot' ? 20 : (player.attackKind === 'kick' ? 58 : 42);
    ctx.arc(cx, player.y + 58, radius, player.facing === 1 ? -0.85 : Math.PI - 0.85, player.facing === 1 ? 0.85 : Math.PI + 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

function getPlayerSpriteSet() {
  const movementSet = getPlayerMovementSpriteSet();
  if (player.attacking > 0) {
    if (player.attackKind === 'kick') return getReadySpriteSet(ASSETS.player.kick, movementSet);
    if (player.attackKind === 'punch') return getReadySpriteSet(ASSETS.player.punch, movementSet);
    if (player.attackKind === 'shoot') return getReadySpriteSet(ASSETS.player.shoot, movementSet);
    if (player.attackKind === 'shockwave') return getReadySpriteSet(ASSETS.player.shockwave, movementSet);
    return getReadySpriteSet(ASSETS.player.attack, movementSet);
  }
  return movementSet;
}

function getPlayerMovementSpriteSet() {
  if (!player.onGround) return ASSETS.player.jump;
  if (Math.abs(player.vx) > 30) return ASSETS.player.run;
  return ASSETS.player.idle;
}

function getReadySpriteSet(paths, fallback = []) {
  if (hasUsableSpriteFrame(paths)) return paths;
  return fallback;
}

function hasUsableSpriteFrame(paths) {
  return Array.isArray(paths) && paths.some(src => {
    const img = images.get(src);
    return img && img.complete && img.naturalWidth;
  });
}

function getPlayerAnimationFps() {
  if (player.attacking > 0) return 16;
  if (!player.onGround) return 7;
  if (Math.abs(player.vx) > 30) return 8 + clamp(Math.abs(player.vx) / player.speed, 0, 1) * 6;
  return 6;
}

function getPlayerAnimationOptions() {
  return {
    loop: player.onGround
  };
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    if (enemy.boss && enemy.afterimageTimer > 0) {
      ctx.save();
      drawBossAfterimages(enemy, '#b8f3ff', false);
      ctx.restore();
    }
    const assetSet = getEnemySpriteSet(enemy);
    if (!drawAnimatedSprite(assetSet, enemy.x, enemy.y, enemy.w, enemy.h, getEnemySpriteFacing(enemy), enemy.animTime)) {
      ctx.save();
      ctx.globalAlpha = enemy.hurt > 0 ? 0.78 : 1;
      ctx.fillStyle = enemy.hurt > 0 ? '#ffffff' : enemy.color;
      roundRect(ctx, enemy.x, enemy.y + 12, enemy.w, enemy.h - 12, 12, true);
      ctx.fillStyle = enemy.boss ? '#ffd166' : '#f7cad0';
      roundRect(ctx, enemy.x + enemy.w * 0.2, enemy.y, enemy.w * 0.6, enemy.h * 0.28, 10, true);
      ctx.fillStyle = '#080b14';
      const eyeX = enemy.facing === 1 ? enemy.x + enemy.w * 0.62 : enemy.x + enemy.w * 0.28;
      ctx.fillRect(eyeX, enemy.y + enemy.h * 0.15, enemy.w * 0.12, 6);
      if (enemy.boss) {
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
        ctx.lineWidth = 4;
        roundRect(ctx, enemy.x - 6, enemy.y + 7, enemy.w + 12, enemy.h - 2, 16, false, true);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
        ctx.fillRect(enemy.x + enemy.w * 0.3, enemy.y + enemy.h * 0.42, enemy.w * 0.4, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillRect(enemy.x + enemy.w * 0.2, enemy.y + enemy.h * 0.56, enemy.w * 0.6, 6);
      }
      if (enemy.type === 'shooter') {
        ctx.fillStyle = '#b8f3ff';
        const gunX = enemy.facing === 1 ? enemy.x + enemy.w - 4 : enemy.x - enemy.w * 0.35;
        ctx.fillRect(gunX, enemy.y + enemy.h * 0.42, enemy.w * 0.45, 9);
      }
      if (enemy.attackingBase) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.45, enemy.w * 0.65, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (enemy.elite) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        roundRect(ctx, enemy.x - 4, enemy.y + 8, enemy.w + 8, enemy.h - 4, 14, false, true);
      }
      ctx.restore();
    }
    drawEnemyHealth(enemy);
  }
}

function getEnemySpriteFacing(enemy) {
  if (enemy.boss && Math.abs(enemy.vx) > 8 && enemy.bossCastTimer <= 0 && enemy.attackAnim <= 0) return -enemy.facing;
  if (enemy.type === 'runner' || enemy.type === 'grunt' || enemy.type === 'brute') return -enemy.facing;
  return enemy.facing;
}

function getEnemySpriteSet(enemy) {
  if (enemy.boss) {
    const bossSet = ASSETS.bosses[`level${enemy.bossLevel}`];
    if (Array.isArray(bossSet) && bossSet.length) return bossSet;
    if (bossSet && typeof bossSet === 'object') {
      const abilitySet = getBossAbilitySpriteSet(enemy, bossSet);
      const fallback = bossSet.idle?.length ? bossSet.idle : bossSet.walk?.length ? bossSet.walk : bossSet.cast || [];
      if (abilitySet.length) return getReadySpriteSet(abilitySet, fallback);
      if (enemy.attackAnim > 0 && bossSet.basic?.length) return getReadySpriteSet(bossSet.basic, fallback);
      if (Math.abs(enemy.vx) > 8 && bossSet.walk?.length) return getReadySpriteSet(bossSet.walk, fallback);
      return fallback;
    }
  }
  const assetSet = ASSETS.enemies[enemy.type];
  if (!assetSet) return [];
  if (Array.isArray(assetSet)) return assetSet;
  const movementSet = assetSet.walk || assetSet.run || assetSet.idle || [];
  if (enemy.attackAnim > 0 && assetSet.attack?.length) return getReadySpriteSet(assetSet.attack, movementSet);
  return movementSet;
}

function getBossAbilitySpriteSet(enemy, bossSet) {
  if (!enemy.bossCastTimer || enemy.bossCastTimer <= 0) return [];
  if (enemy.bossCasting && bossSet[enemy.bossCasting]?.length) return bossSet[enemy.bossCasting];
  if (bossSet.cast?.length) return bossSet.cast;
  return [];
}

function drawEnemyHealth(enemy) {
  const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const w = enemy.w;
  const x = enemy.x;
  const y = enemy.y - 15;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x, y, w, 7, 999, true);
  ctx.fillStyle = enemy.boss ? '#ff006e' : (enemy.elite ? '#ffd166' : '#ff4d6d');
  roundRect(ctx, x, y, w * pct, 7, 999, true);
}

function drawProjectiles() {
  for (const p of state.projectiles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life, 0.3, 1);
    if (p.kind === 'playerEnergy') {
      const dir = Math.sign(p.vx || player.facing || 1) || 1;
      const tail = Math.max(18, p.r * 3.3);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(93,216,255,0.28)';
      ctx.lineWidth = Math.max(3, p.r * 0.78);
      ctx.beginPath();
      ctx.moveTo(p.x - dir * tail, p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(245,253,255,0.78)';
      ctx.lineWidth = Math.max(1.4, p.r * 0.24);
      ctx.beginPath();
      ctx.moveTo(p.x - dir * tail * 0.58, p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r * 1.9);
      glow.addColorStop(0, 'rgba(255,255,255,0.98)');
      glow.addColorStop(0.28, 'rgba(184,243,255,0.82)');
      glow.addColorStop(1, 'rgba(93,216,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5fdff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2.2, p.r * 0.42), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBossHazards() {
  for (const hazard of state.hazards) {
    ctx.save();
    const armed = !Number.isFinite(hazard.telegraph) || hazard.telegraph <= 0;
    const pulse = 0.55 + Math.sin(state.time * 12) * 0.18;
    ctx.globalAlpha = armed ? 0.72 : pulse;
    ctx.strokeStyle = hazard.color || '#b8f3ff';
    ctx.fillStyle = hazard.color || '#b8f3ff';

    if (hazard.school === 'rift' && hazard.kind === 'beam') {
      drawRiftLanceHazard(hazard, armed);
    } else if (hazard.school === 'rift' && hazard.kind === 'gravityBloom') {
      drawRiftGravityBloomHazard(hazard, armed);
    } else if (hazard.school === 'rift' && hazard.kind === 'circleBlast') {
      drawRiftStarfallShardHazard(hazard, armed);
    } else if (hazard.school === 'rift' && hazard.kind === 'phaseBreak') {
      drawRiftPhaseBreakHazard(hazard, armed);
    } else if (hazard.school === 'rift' && hazard.kind === 'riftClaw') {
      drawRiftClawHazard(hazard);
    } else if (hazard.kind === 'beam') {
      ctx.lineWidth = armed ? hazard.h : 4;
      ctx.globalAlpha = armed ? 0.55 : 0.8;
      ctx.beginPath();
      ctx.moveTo(hazard.x1, hazard.y);
      ctx.lineTo(hazard.x2, hazard.y);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillRect(hazard.x1, hazard.y - hazard.h / 2, hazard.x2 - hazard.x1, hazard.h);
    } else if (hazard.kind === 'gravityBloom') {
      drawMagicCircle(hazard.x, hazard.y, hazard.r, hazard.color, armed ? 0.22 : 0.08);
      if (!armed) drawSpiral(hazard.x, hazard.y, hazard.r * 0.75, hazard.color);
    } else if (hazard.kind === 'circleBlast' || hazard.kind === 'blueComet') {
      drawMagicCircle(hazard.x, hazard.y, hazard.r, hazard.color, armed ? 0.28 : 0.08);
      if (hazard.falling || hazard.kind === 'blueComet') {
        ctx.globalAlpha = armed ? 0.78 : 0.35;
        ctx.beginPath();
        ctx.moveTo(hazard.x - 18, 40);
        ctx.lineTo(hazard.x + 18, 40);
        ctx.lineTo(hazard.x, hazard.y - 22);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (hazard.kind === 'phaseBreak' || hazard.kind === 'leylineDash') {
      ctx.lineWidth = 8;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(hazard.fromX + 40, hazard.y + 24);
      ctx.lineTo(hazard.toX + 40, hazard.y + 24);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (hazard.kind === 'sweepLine') {
      roundRect(ctx, hazard.x, hazard.y, hazard.w, hazard.h, 12, true);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(hazard.x - 36, hazard.y + hazard.h * 0.35, hazard.w + 72, hazard.h * 0.3);
    } else if (hazard.kind === 'batteryDrain') {
      if (hazard.enemy && !hazard.enemy.dead) {
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 8]);
        ctx.beginPath();
        ctx.moveTo(hazard.enemy.x + hazard.enemy.w / 2, hazard.enemy.y + hazard.enemy.h * 0.36);
        ctx.lineTo(player.x + player.w / 2, player.y + player.h * 0.45);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (hazard.kind === 'totemShield') {
      drawMagicCircle(hazard.x, hazard.y, hazard.r, hazard.color, 0.18);
      ctx.globalAlpha = 0.85;
      ctx.fillRect(hazard.x - 12, hazard.y - 42, 24, 84);
      ctx.fillRect(hazard.x - 34, hazard.y - 8, 68, 16);
      if (hazard.enemy && !hazard.enemy.dead) drawMagicCircle(hazard.enemy.x + hazard.enemy.w / 2, hazard.enemy.y + hazard.enemy.h / 2, hazard.enemy.w * 0.75, hazard.color, 0.08);
    } else if (hazard.kind === 'mirrorHalo' && hazard.enemy && !hazard.enemy.dead) {
      drawBossAfterimages(hazard.enemy, hazard.color, true);
    } else if (hazard.kind === 'emberRing') {
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (hazard.kind === 'rootSnare') {
      drawMagicCircle(hazard.x, hazard.y, hazard.r, hazard.color, armed ? 0.16 : 0.06);
      if (armed) {
        ctx.lineWidth = 4;
        for (let i = 0; i < 7; i++) {
          const a = (Math.PI * 2 * i) / 7 + state.time;
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x + Math.cos(a) * hazard.r, hazard.y - Math.abs(Math.sin(a)) * 44);
          ctx.stroke();
        }
      }
    } else if (hazard.kind === 'recallCurse') {
      drawMagicCircle(hazard.x, hazard.y, 80, hazard.color, armed ? 0.16 : 0.07);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, 26 + Math.sin(state.time * 10) * 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (hazard.kind === 'roadSplit') {
      ctx.globalAlpha = armed ? 0.48 : 0.25;
      roundRect(ctx, hazard.x, hazard.y, hazard.w, hazard.h, 8, true);
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hazard.x, hazard.y + hazard.h / 2);
      ctx.lineTo(hazard.x + hazard.w, hazard.y + hazard.h / 2);
      ctx.stroke();
    } else if (hazard.kind === 'timeMile' && hazard.enemy && !hazard.enemy.dead) {
      drawBossAfterimages(hazard.enemy, hazard.color, false);
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = hazard.color;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    ctx.restore();
  }
}

function drawMagicCircle(x, y, r, color, fillAlpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha *= fillAlpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawRiftLanceHazard(hazard, armed) {
  const length = hazard.x2 - hazard.x1;
  const charge = getHazardCharge(hazard);
  const fire = getHazardFire(hazard);
  const wave = Math.sin(state.time * 18 + hazard.runeSpin);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  if (!armed) {
    const grow = 0.28 + charge * 0.72;
    ctx.globalAlpha = 0.25 + charge * 0.45;
    drawRiftRunes(hazard.x1 + length * 0.18, hazard.y, 28 + 16 * charge, hazard, 5, true);
    drawRiftRunes(hazard.x2 - length * 0.18, hazard.y, 28 + 16 * charge, hazard, 5, false);
    ctx.lineWidth = 2 + charge * 5;
    ctx.strokeStyle = hazard.accent;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.moveTo(hazard.x1, hazard.y - hazard.h * 0.32 * grow);
    ctx.lineTo(hazard.x2, hazard.y - hazard.h * 0.32 * grow);
    ctx.moveTo(hazard.x1, hazard.y + hazard.h * 0.32 * grow);
    ctx.lineTo(hazard.x2, hazard.y + hazard.h * 0.32 * grow);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  const coreH = hazard.h * (0.34 + fire * 0.22);
  const glowH = hazard.h * (1.4 + Math.abs(wave) * 0.26);
  const beam = ctx.createLinearGradient(hazard.x1, hazard.y, hazard.x2, hazard.y);
  beam.addColorStop(0, 'rgba(125,249,255,0)');
  beam.addColorStop(0.08, hazard.accent);
  beam.addColorStop(0.46, hazard.core);
  beam.addColorStop(0.72, hazard.color);
  beam.addColorStop(1, 'rgba(125,249,255,0)');
  ctx.globalAlpha = 0.28 * fire;
  ctx.fillStyle = hazard.accent;
  ctx.fillRect(hazard.x1, hazard.y - glowH / 2, length, glowH);
  ctx.globalAlpha = 0.78 * fire;
  ctx.fillStyle = beam;
  ctx.fillRect(hazard.x1, hazard.y - coreH / 2, length, coreH);
  ctx.lineWidth = 2;
  ctx.strokeStyle = hazard.core;
  for (let i = 0; i < 3; i++) {
    const offset = Math.sin(state.time * 22 + i * 2.1) * hazard.h * 0.25;
    ctx.globalAlpha = (0.45 - i * 0.09) * fire;
    ctx.beginPath();
    ctx.moveTo(hazard.x1 + 20, hazard.y + offset);
    for (let x = hazard.x1 + 20; x < hazard.x2 - 20; x += 38) {
      ctx.lineTo(x, hazard.y + offset + Math.sin(x * 0.04 + state.time * 12 + i) * 8);
    }
    ctx.stroke();
  }
  drawRiftRunes(hazard.x1 + 52, hazard.y, 30, hazard, 6, true);
  drawRiftRunes(hazard.x2 - 52, hazard.y, 30, hazard, 6, false);
  ctx.restore();
}

function drawRiftGravityBloomHazard(hazard, armed) {
  const charge = getHazardCharge(hazard);
  const fire = getHazardFire(hazard);
  const inhale = armed ? 1 : charge;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = hazard.r * (0.62 + inhale * 0.38);
  const gradient = ctx.createRadialGradient(hazard.x, hazard.y, 4, hazard.x, hazard.y, r * 1.25);
  gradient.addColorStop(0, armed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)');
  gradient.addColorStop(0.18, 'rgba(125,249,255,0.42)');
  gradient.addColorStop(0.55, 'rgba(155,93,229,0.24)');
  gradient.addColorStop(1, 'rgba(155,93,229,0)');
  ctx.globalAlpha = armed ? 0.74 * fire : 0.52;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(hazard.x, hazard.y, r * 1.25, 0, Math.PI * 2);
  ctx.fill();

  drawRiftRunes(hazard.x, hazard.y, r, hazard, 9, true);
  drawRiftRunes(hazard.x, hazard.y, r * 0.58, hazard, 7, false);
  drawRiftPetals(hazard.x, hazard.y, r * 0.78, hazard, armed ? 12 : 8);
  drawSpiral(hazard.x, hazard.y, r * 0.72, armed ? hazard.core : hazard.color);
  if (armed) {
    ctx.globalAlpha = 0.72 * fire;
    ctx.lineWidth = 10;
    ctx.strokeStyle = hazard.core;
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, r * (1.03 + Math.sin(state.time * 18) * 0.03), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRiftStarfallShardHazard(hazard, armed) {
  const charge = getHazardCharge(hazard);
  const fire = getHazardFire(hazard);
  const cometY = armed ? hazard.y - 70 + fire * 76 : 80 + charge * (hazard.y - 120);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawRiftRunes(hazard.x, hazard.y, hazard.r * (0.75 + charge * 0.25), hazard, 6, true);
  ctx.globalAlpha = armed ? 0.34 : 0.16 + charge * 0.18;
  ctx.fillStyle = hazard.accent;
  ctx.beginPath();
  ctx.ellipse(hazard.x, hazard.y, hazard.r * 0.95, hazard.r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(hazard.x, cometY);
  ctx.rotate((hazard.shardTilt || 0) + Math.sin(state.time * 5) * 0.08);
  const shardGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
  shardGlow.addColorStop(0, hazard.core);
  shardGlow.addColorStop(0.35, hazard.color);
  shardGlow.addColorStop(1, 'rgba(125,249,255,0)');
  ctx.globalAlpha = armed ? 0.95 : 0.72;
  ctx.fillStyle = shardGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hazard.core;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(18, 2);
  ctx.lineTo(0, 46);
  ctx.lineTo(-18, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hazard.accent;
  ctx.globalAlpha = armed ? 0.55 : 0.32;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(8, 2);
  ctx.lineTo(0, 32);
  ctx.lineTo(-8, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (armed) {
    ctx.globalAlpha = 0.45 * fire;
    ctx.strokeStyle = hazard.core;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(hazard.x, cometY - 88);
    ctx.lineTo(hazard.x, hazard.y - 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRiftPhaseBreakHazard(hazard, armed) {
  const charge = getHazardCharge(hazard);
  const fire = getHazardFire(hazard);
  const y = hazard.y + 44;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 5 + charge * 5;
  ctx.strokeStyle = hazard.color;
  ctx.globalAlpha = armed ? 0.62 * fire : 0.38 + charge * 0.25;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(hazard.fromX + 48, y);
  const midX = (hazard.fromX + hazard.toX) / 2;
  ctx.quadraticCurveTo(midX, y - 72 - Math.sin(state.time * 8) * 12, hazard.toX + 48, y);
  ctx.stroke();
  ctx.setLineDash([]);
  drawRiftRunes(hazard.fromX + 48, y, 34 + charge * 18, hazard, 6, true);
  drawRiftRunes(hazard.toX + 48, y, 42 + charge * 22, hazard, 7, false);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = hazard.fromX + 48 + (hazard.toX - hazard.fromX) * t;
    const tearY = y - Math.sin(t * Math.PI) * 64;
    ctx.globalAlpha = (armed ? 0.32 * fire : 0.18 + charge * 0.18);
    ctx.fillStyle = i % 2 ? hazard.accent : hazard.color;
    ctx.beginPath();
    ctx.moveTo(x - 8, tearY - 22);
    ctx.lineTo(x + 11, tearY);
    ctx.lineTo(x - 5, tearY + 24);
    ctx.lineTo(x + 2, tearY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawRiftClawHazard(hazard) {
  const t = 1 - clamp(hazard.life / hazard.maxLife, 0, 1);
  const reach = hazard.w * (0.55 + t * 0.55);
  const height = hazard.h * (0.75 + Math.sin(t * Math.PI) * 0.35);
  const baseX = hazard.x;
  const dir = hazard.dir || 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(baseX, hazard.y);
  ctx.scale(dir, 1);
  ctx.globalAlpha = 0.72 * (1 - t);

  const slash = ctx.createLinearGradient(0, 0, reach, 0);
  slash.addColorStop(0, 'rgba(255,255,255,0.05)');
  slash.addColorStop(0.22, hazard.core);
  slash.addColorStop(0.62, hazard.color);
  slash.addColorStop(1, 'rgba(155,93,229,0)');
  ctx.strokeStyle = slash;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.42);
  ctx.quadraticCurveTo(reach * 0.42, -height * 0.86, reach, -height * 0.12);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(reach * 0.52, -height * 0.14, reach * 0.9, height * 0.46);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = hazard.accent;
  ctx.beginPath();
  ctx.moveTo(reach * 0.1, height * 0.34);
  ctx.quadraticCurveTo(reach * 0.58, height * 0.15, reach * 0.76, -height * 0.58);
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    ctx.globalAlpha = (0.48 - p * 0.22) * (1 - t);
    ctx.fillStyle = i % 2 ? hazard.accent : hazard.color;
    ctx.beginPath();
    ctx.arc(reach * (0.18 + p * 0.7), Math.sin(p * Math.PI * 2 + state.time * 8) * height * 0.28, 4 + p * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRiftRunes(x, y, r, hazard, count = 6, clockwise = true) {
  ctx.save();
  ctx.strokeStyle = hazard.color || '#7df9ff';
  ctx.fillStyle = hazard.core || '#ffffff';
  ctx.lineWidth = 2;
  const spin = (hazard.runeSpin || 0) + state.time * (clockwise ? 1.4 : -1.1);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < count; i++) {
    const a = spin + (Math.PI * 2 * i) / count;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha *= 0.82;
    ctx.fillRect(-5, -1, 10, 2);
    ctx.fillRect(-1, -6, 2, 12);
    ctx.restore();
  }
  ctx.restore();
}

function drawRiftPetals(x, y, r, hazard, count) {
  ctx.save();
  ctx.strokeStyle = hazard.accent || '#9b5de5';
  ctx.lineWidth = 3;
  for (let i = 0; i < count; i++) {
    const a = hazard.runeSpin + state.time * 0.7 + (Math.PI * 2 * i) / count;
    const px = x + Math.cos(a) * r * 0.38;
    const py = y + Math.sin(a) * r * 0.38;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.16, r * 0.42, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function getHazardCharge(hazard) {
  if (!Number.isFinite(hazard.maxTelegraph) || hazard.maxTelegraph <= 0) return 1;
  return clamp(1 - Math.max(0, hazard.telegraph || 0) / hazard.maxTelegraph, 0, 1);
}

function getHazardFire(hazard) {
  if (!Number.isFinite(hazard.maxLife) || hazard.maxLife <= 0) return 1;
  return clamp(hazard.life / hazard.maxLife, 0, 1);
}

function drawSpiral(x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 42; i++) {
    const t = i / 41;
    const a = t * Math.PI * 4 + state.time * 2.5;
    const px = x + Math.cos(a) * r * t;
    const py = y + Math.sin(a) * r * t;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBossAfterimages(enemy, color, ring) {
  for (let i = 0; i < 4; i++) {
    const a = state.time * 1.7 + i * Math.PI * 0.5;
    const ox = Math.cos(a) * 72;
    const oy = Math.sin(a) * 18;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    roundRect(ctx, enemy.x + ox, enemy.y + oy + 12, enemy.w, enemy.h - 12, 14, true);
    if (ring) drawMagicCircle(enemy.x + enemy.w / 2 + ox, enemy.y + enemy.h * 0.5 + oy, enemy.w * 0.35, color, 0.05);
  }
}

function drawShockwaves() {
  for (const wave of state.shockwaves) {
    const t = 1 - clamp(wave.life / wave.maxLife, 0, 1);
    const radius = wave.radius * t;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    const glow = ctx.createRadialGradient(wave.x, wave.y, Math.max(2, radius * 0.15), wave.x, wave.y, Math.max(6, radius));
    glow.addColorStop(0, 'rgba(255,255,255,0)');
    glow.addColorStop(0.45, 'rgba(93,216,255,0.08)');
    glow.addColorStop(0.78, 'rgba(93,216,255,0.35)');
    glow.addColorStop(1, 'rgba(93,216,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(184,243,255,0.92)';
    ctx.lineWidth = 9 * (1 - t) + 2;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPickups() {
  ctx.save();
  for (const p of state.pickups) {
    if (!isValidGamePickup(p)) continue;
    ctx.save();
    try {
    if (p.type === 'coin') {
      const img = images.get(ASSETS.pickups.coin);
      if (img && img.complete && img.naturalWidth) ctx.drawImage(img, p.x - 14, p.y - 14, 28, 28);
      else {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.t * 8) * 0.2);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9 + Math.sin(p.t * 10) * 3, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(-2, -7, 4, 14);
      }
    } else if (p.type === 'heart') {
      const img = images.get(ASSETS.pickups.heart);
      if (img && img.complete && img.naturalWidth) ctx.drawImage(img, p.x - 16, p.y - 16, 32, 32);
      else {
        ctx.fillStyle = '#70e000';
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y - 2, 7, 0, Math.PI * 2);
        ctx.arc(p.x + 5, p.y - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(p.x - 12, p.y + 2);
        ctx.lineTo(p.x + 12, p.y + 2);
        ctx.lineTo(p.x, p.y + 16);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.type === 'repair') {
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.t * 7) * 0.25);
      ctx.fillStyle = '#70e000';
      roundRect(ctx, -11, -8, 22, 16, 4, true);
      ctx.fillStyle = '#07101f';
      ctx.fillRect(-3, -13, 6, 26);
      ctx.fillRect(-13, -3, 26, 6);
    }
    } catch (error) {
      p.dead = true;
      window.__holdLineLastPickupDrawError = {
        message: error?.message || String(error),
        stack: error?.stack || ''
      };
    } finally {
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingText() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px Arial';
  for (const t of state.floatingText) {
    ctx.globalAlpha = clamp(t.life / t.maxLife, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(t.text, t.x + 2, t.y + 2);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.restore();
}

function drawScreenOverlay() {
  const gradient = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.72);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (state.dangerPulse > 0) {
    ctx.save();
    ctx.globalAlpha = state.dangerPulse * 0.55;
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }
}

function drawAnimatedSprite(paths, x, y, w, h, facing, animTime, fps = 10, options = {}) {
  if (!paths || !paths.length) return false;
  const rawFrame = Math.floor(animTime * fps);
  const frameIndex = options.loop === false ? Math.min(rawFrame, paths.length - 1) : rawFrame % paths.length;
  const img = getRenderableImage(paths, frameIndex);
  if (!img || !img.complete || !img.naturalWidth) return false;
  ctx.save();
  if (facing === -1) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  ctx.restore();
  return true;
}

function getRenderableImage(paths, frameIndex) {
  const cacheKey = paths.join('|');
  const preferred = images.get(paths[frameIndex]);
  if (preferred && preferred.complete && preferred.naturalWidth) {
    renderedImageCache.set(cacheKey, preferred);
    return preferred;
  }
  for (const src of paths) {
    const img = images.get(src);
    if (img && img.complete && img.naturalWidth) {
      renderedImageCache.set(cacheKey, img);
      return img;
    }
  }
  return renderedImageCache.get(cacheKey) || preferred;
}

function addSlashEffect(x, y, dir, hit) {
  const color = hit ? '#ffffff' : 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 10; i++) {
    state.particles.push({ x: x + rand(-15, 15), y: y + rand(-25, 25), vx: dir * rand(120, 420), vy: rand(-160, 160), r: rand(2, 5), life: rand(0.12, 0.24), maxLife: 0.24, color });
  }
  capGameParticles();
}

function addEnemyAttackEffect(enemy, baseHit) {
  const x = baseHit ? DEFENSE.lineX : (enemy.facing === 1 ? enemy.x + enemy.w : enemy.x);
  const y = baseHit ? enemy.y + enemy.h * 0.45 : enemy.y + enemy.h * 0.45;
  for (let i = 0; i < 8; i++) {
    state.particles.push({ x, y, vx: (baseHit ? -1 : enemy.facing) * rand(80, 260), vy: rand(-120, 120), r: rand(2, 5), life: rand(0.16, 0.28), maxLife: 0.28, color: '#ff4d6d' });
  }
  capGameParticles();
}

function addBossRiftClawParticles(slash) {
  const dir = slash.dir || 1;
  const startX = slash.x;
  for (let i = 0; i < 18; i++) {
    const p = Math.random();
    state.particles.push({
      x: startX + dir * slash.w * p + rand(-8, 8),
      y: slash.y + rand(-slash.h * 0.38, slash.h * 0.38),
      vx: dir * rand(90, 360),
      vy: rand(-170, 130),
      r: rand(2, 5),
      life: rand(0.16, 0.34),
      maxLife: 0.34,
      color: Math.random() < 0.45 ? slash.accent : slash.color
    });
  }
  capGameParticles();
}

function addMeleeEffect(hitbox, isKick, hitAny) {
  const x = player.facing === 1 ? hitbox.x + hitbox.w : hitbox.x;
  const y = hitbox.y + hitbox.h * 0.48;
  const color = isKick ? '#ffd166' : '#ffffff';
  addFloatingText(x, y - 22, isKick ? 'KICK' : 'PUNCH', hitAny ? color : 'rgba(255,255,255,0.7)', 0.45, -22);
  for (let i = 0; i < (isKick ? 16 : 9); i++) {
    state.particles.push({
      x: x + rand(-10, 10),
      y: y + rand(-18, 18),
      vx: player.facing * rand(90, isKick ? 360 : 240),
      vy: rand(-140, 100),
      r: rand(2, isKick ? 6 : 4),
      life: rand(0.12, 0.26),
      maxLife: 0.26,
      color
    });
  }
  capGameParticles();
}

function addShockwaveBlast(x, y, radius) {
  state.shockwaves.push({ x, y, radius, life: 0.46, maxLife: 0.46 });
  if (state.shockwaves.length > 12) state.shockwaves.splice(0, state.shockwaves.length - 12);
}

function addHitBurst(x, y, color) {
  const count = state.particles.length > MAX_GAME_PARTICLES - 24 ? 5 : 12;
  for (let i = 0; i < count; i++) {
    state.particles.push({ x, y, vx: rand(-260, 260), vy: rand(-260, 160), r: rand(2, 5), life: rand(0.18, 0.38), maxLife: 0.38, color });
  }
  capGameParticles();
}

function addEnergyImpact(x, y) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(80, 260);
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      r: rand(1.4, 4),
      life: rand(0.14, 0.28),
      maxLife: 0.28,
      color: i % 3 === 0 ? '#ffffff' : '#5dd8ff'
    });
  }
  capGameParticles();
}

function spawnDust(x, y, count) {
  for (let i = 0; i < count; i++) {
    state.particles.push({ x: x + rand(-20, 20), y: y + rand(-4, 5), vx: rand(-130, 130), vy: rand(-180, -30), r: rand(2, 7), life: rand(0.22, 0.48), maxLife: 0.48, color: 'rgba(210,220,240,0.55)' });
  }
  capGameParticles();
}

function addFloatingText(x, y, text, color = '#ffffff', life = 0.95, vy = -48) {
  state.floatingText.push({ x, y, text, color, vy, life, maxLife: life });
  capGameFloatingText();
}

function updateHUD() {
  ui.hpFill.style.width = `${clamp(player.hp / player.maxHp, 0, 1) * 100}%`;
  ui.staminaFill.style.width = `${clamp(player.stamina / player.maxStamina, 0, 1) * 100}%`;
  ui.baseFill.style.width = `${clamp(state.baseHp / state.baseMaxHp, 0, 1) * 100}%`;
  ui.hpNumber.textContent = `${Math.round(player.hp)} / ${player.maxHp}`;
  ui.staminaNumber.textContent = `${Math.round(player.stamina)} / ${player.maxStamina}`;
  ui.baseNumber.textContent = `${Math.round(state.baseHp)} / ${state.baseMaxHp}`;
  const wave = currentWave();
  ui.waveText.textContent = wave ? wave.label : 'Complete';
  ui.levelText.textContent = `Level ${state.levelIndex + 1}: ${currentLevel().name}`;
  ui.enemyText.textContent = `Enemies: ${state.enemies.length}`;
  ui.coinsText.textContent = `Coins: ${state.coins}`;
  if (ui.upgradeText) ui.upgradeText.textContent = `Upgrades: ${window.UPGRADE_SYSTEM ? window.UPGRADE_SYSTEM.getTakenCount() : 0}`;
  if (ui.threatText) ui.threatText.textContent = `Threat: ${getThreatLabel()}`;
  ui.comboText.textContent = `x${state.combo}`;
  const stats = getUpgradeStats();
  updateAbilityChip(ui.attackChip, player.attackCooldown, stats.attackCooldown, player.stamina >= Math.max(1, stats.attackCost - 1));
  updateAbilityChip(ui.specialChip, player.specialCooldown, stats.specialCooldown, player.stamina >= stats.specialCost);
  updateAbilityChip(ui.shootChip, player.shootCooldown, getEnergyShotCooldown(stats), player.stamina >= getEnergyShotCost(stats));
  updateAbilityChip(ui.dashChip, player.dashCooldown, stats.dashCooldown, player.stamina >= stats.dashCost);
}

function updateAbilityChip(chip, cooldown, maxCooldown, hasResource) {
  if (!chip) return;
  const label = chip.querySelector('strong');
  const ready = cooldown <= 0 && hasResource;
  chip.classList.toggle('ready', ready);
  chip.classList.toggle('blocked', !hasResource);
  if (!hasResource) label.textContent = 'Tired';
  else label.textContent = ready ? 'Ready' : `${cooldown.toFixed(1)}s`;
  chip.style.setProperty('--cooldown', `${clamp(cooldown / Math.max(maxCooldown, 0.01), 0, 1) * 100}%`);
}

function getThreatLabel() {
  const baseDanger = 1 - clamp(state.baseHp / state.baseMaxHp, 0, 1);
  const enemyDanger = clamp(state.enemies.length / 18, 0, 1);
  const eliteDanger = state.enemies.some(enemy => enemy.boss) ? 0.35 : state.enemies.some(enemy => enemy.elite) ? 0.16 : 0;
  const score = baseDanger * 0.48 + enemyDanger * 0.38 + eliteDanger;
  if (score > 0.72) return 'Critical';
  if (score > 0.48) return 'High';
  if (score > 0.24) return 'Rising';
  return 'Calm';
}

function capList(list, max) {
  const overflow = list.length - max;
  if (overflow > 0) list.splice(0, overflow);
}

function capGamePickups() {
  capList(state.pickups, MAX_GAME_PICKUPS);
}

function capGameParticles() {
  capList(state.particles, MAX_GAME_PARTICLES);
}

function capGameFloatingText() {
  capList(state.floatingText, MAX_GAME_FLOATING_TEXT);
}

function isValidGamePickup(pickup) {
  return Boolean(
    pickup &&
    Number.isFinite(pickup.x) &&
    Number.isFinite(pickup.y) &&
    Number.isFinite(pickup.vx) &&
    Number.isFinite(pickup.vy) &&
    Number.isFinite(pickup.r) &&
    Number.isFinite(pickup.value) &&
    Number.isFinite(pickup.t) &&
    typeof pickup.type === 'string'
  );
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleRectOverlap(circle, rect) {
  const cx = clamp(circle.x, rect.x, rect.x + rect.w);
  const cy = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy <= circle.r * circle.r;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function roundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
