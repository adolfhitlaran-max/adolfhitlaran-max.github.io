const canvas = document.getElementById('prelevelCanvas');
const ctx = canvas.getContext('2d');
const hpText = document.getElementById('preHp');
const killText = document.getElementById('preKills');
const threatText = document.getElementById('preThreat');
const overlay = document.getElementById('prelevelOverlay');
const startBtn = document.getElementById('preStartBtn');
const interactBtn = document.getElementById('prelevelInteractBtn');
const devPanel = document.getElementById('prelevelDevPanel');
const devModeSelect = document.getElementById('prelevelDevMode');
const devGruntCount = document.getElementById('prelevelGruntCount');
const devRunnerCount = document.getElementById('prelevelRunnerCount');
const devStatus = document.getElementById('prelevelDevStatus');
const devSaveBtn = document.getElementById('prelevelSaveBtn');
const devExportBtn = document.getElementById('prelevelExportBtn');
const devResetBtn = document.getElementById('prelevelResetBtn');
const devUndoBtn = document.getElementById('prelevelUndoBtn');
const devAddSectionBtn = document.getElementById('prelevelAddSectionBtn');
const devConfigExport = document.getElementById('prelevelConfigExport');

const W = canvas.width;
const H = canvas.height;
const params = new URLSearchParams(window.location.search);
const gameDevMode = params.get('dev') === '1';
const PRELEVEL_STORAGE_KEY = 'holdTheLine.prelevelConfig.v1';
const PRELEVEL_PANEL_STORAGE_KEY = 'holdTheLine.prelevelDevPanelPosition.v1';
const keys = new Set();
const mouse = { screenX: W / 2, screenY: H / 2, worldX: W / 2, worldY: H / 2, down: false };

const PRELEVEL_ASSETS = {
  background: 'assets/backgrounds/pregameclip.png',
  player: {
    idle: ['assets/player/genz/idle/1.png'],
    run: [
      'assets/player/genz/run/1.png',
      'assets/player/genz/run/2.png',
      'assets/player/genz/run/3.png'
    ],
    shoot: [
      'assets/player/genz/gunfire/1.png',
      'assets/player/genz/gunfire/2.png',
      'assets/player/genz/gunfire/3.png',
      'assets/player/genz/gunfire/4.png'
    ]
  },
  meet: {
    idle: ['assets/ashtar/idle/1.png']
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
    }
  }
};

const images = new Map();
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
queueGroup(PRELEVEL_ASSETS);

const WORLD = {
  width: 1672,
  height: 941,
  zoom: Math.sqrt(10)
};

const DEFAULT_CONFIG = Object.freeze({
  start: { x: 897, y: 915 },
  goal: { x: 498, y: 638 },
  meet: { x: 464, y: 671 },
  walls: [
    {
      points: [
        { x: 751, y: 777 },
        { x: 882, y: 852 },
        { x: 1049, y: 789 },
        { x: 1090, y: 716 },
        { x: 1011, y: 608 },
        { x: 724, y: 762 },
        { x: 753, y: 777 }
      ]
    },
    {
      points: [
        { x: 1040, y: 931 },
        { x: 1040, y: 931 },
        { x: 1108, y: 829 },
        { x: 1266, y: 762 },
        { x: 1451, y: 627 },
        { x: 1668, y: 667 }
      ]
    },
    {
      points: [
        { x: 1668, y: 541 },
        { x: 1575, y: 548 },
        { x: 1471, y: 475 },
        { x: 1268, y: 548 },
        { x: 1020, y: 403 },
        { x: 1037, y: 342 },
        { x: 1123, y: 250 },
        { x: 1074, y: 219 },
        { x: 994, y: 288 },
        { x: 913, y: 250 },
        { x: 947, y: 189 },
        { x: 915, y: 144 },
        { x: 1668, y: 133 },
        { x: 1665, y: 539 }
      ]
    },
    {
      points: [
        { x: 911, y: 138 },
        { x: 920, y: 142 },
        { x: 800, y: 162 },
        { x: 925, y: 405 },
        { x: 888, y: 529 },
        { x: 722, y: 529 },
        { x: 652, y: 663 },
        { x: 525, y: 586 },
        { x: 380, y: 651 },
        { x: 457, y: 804 },
        { x: 53, y: 802 },
        { x: 39, y: 196 },
        { x: 713, y: 149 },
        { x: 915, y: 140 }
      ]
    }
  ],
  sections: [
    {
      grunt: 10,
      runner: 4,
      points: [
        { x: 416, y: 667 },
        { x: 600, y: 861 },
        { x: 766, y: 861 },
        { x: 679, y: 755 },
        { x: 798, y: 690 },
        { x: 694, y: 624 },
        { x: 651, y: 699 },
        { x: 532, y: 642 },
        { x: 416, y: 671 }
      ],
      dots: [
        { x: 584.2284206578395, y: 800.7142373806428, type: 'runner' },
        { x: 439.16846079586077, y: 690.1852510633221, type: 'grunt' },
        { x: 514.5893191700928, y: 675.690615958676, type: 'grunt' },
        { x: 694.3310518597248, y: 630.026618080599, type: 'runner' },
        { x: 534.9183366383347, y: 648.9560736945962, type: 'grunt' },
        { x: 614.8735533287114, y: 830.2583762782446, type: 'grunt' },
        { x: 629.39617520572, y: 803.798014305889, type: 'grunt' },
        { x: 556.5521678791808, y: 783.1841536036096, type: 'grunt' },
        { x: 681.0798875717173, y: 737.2199411865845, type: 'runner' },
        { x: 713.0781826078212, y: 727.8132263468133, type: 'grunt' },
        { x: 516.4615006838596, y: 672.386216111226, type: 'grunt' },
        { x: 626.9793844534449, y: 764.2634887690167, type: 'grunt' },
        { x: 737.8243581501921, y: 655.2341639574361, type: 'runner' },
        { x: 498.3578136092682, y: 687.7983514206268, type: 'grunt' }
      ]
    },
    {
      grunt: 10,
      runner: 4,
      points: [
        { x: 722, y: 615 },
        { x: 722, y: 615 },
        { x: 810, y: 674 },
        { x: 1006, y: 568 },
        { x: 1085, y: 653 },
        { x: 1223, y: 568 },
        { x: 1002, y: 439 },
        { x: 940, y: 442 },
        { x: 913, y: 547 },
        { x: 737, y: 556 },
        { x: 719, y: 611 }
      ],
      dots: [
        { x: 1090.193503440043, y: 566.6819317936754, type: 'grunt' },
        { x: 1059.2950706122913, y: 477.3249934072725, type: 'grunt' },
        { x: 1063.174794052879, y: 521.8320957231117, type: 'grunt' },
        { x: 1008.3770855840603, y: 465.00271425121525, type: 'runner' },
        { x: 1094.9022110765732, y: 495.8349086847567, type: 'grunt' },
        { x: 1024.5028205590622, y: 580.3067451263777, type: 'grunt' },
        { x: 980.7842008926472, y: 539.9361590484295, type: 'grunt' },
        { x: 1174.3682383753096, y: 596.2839762383026, type: 'grunt' },
        { x: 1212.2062857596065, y: 574.5473585639422, type: 'grunt' },
        { x: 945.5035176237745, y: 494.7411430166989, type: 'runner' },
        { x: 1160.9573384385412, y: 553.6090292393882, type: 'runner' },
        { x: 925.0281901370993, y: 532.9039512376271, type: 'grunt' },
        { x: 983.2692151780828, y: 483.0615181908032, type: 'grunt' },
        { x: 911.4510364011669, y: 609.586468593578, type: 'runner' }
      ]
    },
    {
      grunt: 10,
      runner: 4,
      points: [
        { x: 832, y: 185 },
        { x: 909, y: 162 },
        { x: 927, y: 196 },
        { x: 886, y: 246 },
        { x: 886, y: 246 },
        { x: 985, y: 304 },
        { x: 1074, y: 245 },
        { x: 1090, y: 263 },
        { x: 1022, y: 322 },
        { x: 1006, y: 408 },
        { x: 950, y: 405 },
        { x: 834, y: 192 }
      ],
      dots: [
        { x: 1056.9256148847437, y: 269.34265199242793, type: 'grunt' },
        { x: 963.1327306258218, y: 370.91499599069846, type: 'runner' },
        { x: 850.451066317269, y: 208.03402120907828, type: 'grunt' },
        { x: 1014.6990524534153, y: 342.96252160840163, type: 'grunt' },
        { x: 1069.685986778928, y: 260.2106135525937, type: 'grunt' },
        { x: 941.4501150108923, y: 316.73502686606264, type: 'runner' },
        { x: 905.8495831129693, y: 176.28656536509948, type: 'grunt' },
        { x: 920.6903054078892, y: 306.72411476129287, type: 'grunt' },
        { x: 946.0662929321863, y: 286.04752189376893, type: 'runner' },
        { x: 918.1308279683108, y: 326.2898837055807, type: 'grunt' },
        { x: 902.8693224685665, y: 221.4145436209939, type: 'grunt' },
        { x: 1016.7513975238016, y: 295.5632269589984, type: 'grunt' },
        { x: 937.1904723427072, y: 292.5599362747688, type: 'runner' },
        { x: 995.108601978073, y: 326.77046324395405, type: 'grunt' }
      ]
    },
    {
      grunt: 10,
      runner: 4,
      points: [
        { x: 1085, y: 669 },
        { x: 1451, y: 511 },
        { x: 1557, y: 566 },
        { x: 1557, y: 566 },
        { x: 1659, y: 570 },
        { x: 1658, y: 640 },
        { x: 1658, y: 640 },
        { x: 1442, y: 602 },
        { x: 1211, y: 752 },
        { x: 1085, y: 822 },
        { x: 1033, y: 899 },
        { x: 940, y: 865 },
        { x: 1067, y: 796 },
        { x: 1105, y: 717 },
        { x: 1089, y: 672 }
      ],
      dots: [
        { x: 1208.2602644534877, y: 681.95109603103, type: 'runner' },
        { x: 1334.7728616725494, y: 644.5302356872933, type: 'grunt' },
        { x: 1447.4627135954488, y: 571.1722183823495, type: 'grunt' },
        { x: 1120.199450445738, y: 752.7019829723105, type: 'runner' },
        { x: 1212.8548643178428, y: 684.2774452361966, type: 'grunt' },
        { x: 1019.2059079975426, y: 850.6267213788715, type: 'grunt' },
        { x: 1608.2646041624876, y: 584.9245145645076, type: 'grunt' },
        { x: 984.0597779080457, y: 863.1897504577335, type: 'grunt' },
        { x: 1629.0535559080986, y: 614.8806292164388, type: 'runner' },
        { x: 1196.3635082393198, y: 747.6173859270718, type: 'grunt' },
        { x: 1360.5998676257193, y: 648.6395895673729, type: 'grunt' },
        { x: 1292.581472289664, y: 586.6428530263927, type: 'runner' },
        { x: 1108.8708467597432, y: 717.8888666194325, type: 'grunt' },
        { x: 1623.0177982152024, y: 629.8114422154871, type: 'grunt' }
      ]
    }
  ]
});

let config = loadConfig();
const camera = { x: 0, y: 0, w: W / WORLD.zoom, h: H / WORLD.zoom };
const player = {
  x: config.start.x,
  y: config.start.y,
  r: 18,
  w: 58,
  h: 76,
  hp: 100,
  invuln: 0,
  cooldown: 0,
  facing: 1,
  moving: false,
  animTime: 0,
  shootAnim: 0
};
const state = {
  mode: gameDevMode ? 'dev' : 'menu',
  time: 0,
  spawnTimer: 0,
  activeSectionIndex: -1,
  triggeredSections: [],
  completedSections: [],
  spawned: 0,
  kills: 0,
  enemies: [],
  shots: [],
  particles: []
};
const devState = {
  wallPoints: [],
  sectionPoints: [],
  dragPlayer: false,
  panelDragging: false,
  panelOffsetX: 0,
  panelOffsetY: 0
};

if (gameDevMode) {
  overlay.classList.remove('show');
  if (devPanel) {
    devPanel.hidden = false;
    restoreDevPanelPosition();
  }
  syncDevStatus();
}

window.addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.code === 'Space') e.preventDefault();
  if (e.code === 'KeyE') tryInteractWithMeetCharacter();
});
window.addEventListener('keyup', e => keys.delete(e.code));
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.screenX = (e.clientX - rect.left) * (W / rect.width);
  mouse.screenY = (e.clientY - rect.top) * (H / rect.height);
  updateMouseWorld();
});
canvas.addEventListener('mousedown', () => {
  mouse.down = true;
  if (gameDevMode) handleDevClick();
});
window.addEventListener('mouseup', () => { mouse.down = false; });
startBtn.addEventListener('click', startPrelevel);
interactBtn?.addEventListener('click', tryInteractWithMeetCharacter);
devPanel?.querySelector('.prelevel-dev-head')?.addEventListener('mousedown', startDevPanelDrag);
window.addEventListener('mousemove', dragDevPanel);
window.addEventListener('mouseup', stopDevPanelDrag);
devSaveBtn?.addEventListener('click', saveConfig);
devExportBtn?.addEventListener('click', exportConfig);
devResetBtn?.addEventListener('click', resetConfig);
devUndoBtn?.addEventListener('click', undoConfigItem);
devAddSectionBtn?.addEventListener('click', addDevSection);

function startPrelevel() {
  resetRun();
  state.mode = 'playing';
  overlay.classList.remove('show');
}

let last = performance.now();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  syncWorldSizeToBackground();
  if (state.mode === 'playing') update(dt);
  updateCamera();
  updateMouseWorld();
  draw();
  requestAnimationFrame(loop);
}

function syncWorldSizeToBackground() {
  const bg = images.get(PRELEVEL_ASSETS.background);
  if (!bg || !bg.complete || !bg.naturalWidth) return;
  if (WORLD.width === bg.naturalWidth && WORLD.height === bg.naturalHeight) return;
  WORLD.width = bg.naturalWidth;
  WORLD.height = bg.naturalHeight;
  clampConfigToWorld();
  player.x = clamp(player.x, 32, WORLD.width - 32);
  player.y = clamp(player.y, 32, WORLD.height - 32);
}

function update(dt) {
  state.time += dt;
  updatePlayer(dt);
  updateSpawns(dt);
  updateEnemies(dt);
  updateShots(dt);
  updateParticles(dt);
  updateHud();
  if (player.hp <= 0) resetPrelevel();
}

function updatePlayer(dt) {
  let mx = 0;
  let my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx--;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx++;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my--;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my++;
  const len = Math.hypot(mx, my) || 1;
  const speed = 210;
  movePlayerAxis((mx / len) * speed * dt, 0);
  movePlayerAxis(0, (my / len) * speed * dt);
  player.moving = mx !== 0 || my !== 0;
  if (mx !== 0) player.facing = mx > 0 ? 1 : -1;
  player.animTime += dt;
  player.shootAnim = Math.max(0, player.shootAnim - dt);
  player.cooldown = Math.max(0, player.cooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  if ((mouse.down || keys.has('Space')) && player.cooldown <= 0) shoot();
}

function movePlayerAxis(dx, dy) {
  if (dx === 0 && dy === 0) return;
  const next = {
    x: clamp(player.x + dx, player.r, WORLD.width - player.r),
    y: clamp(player.y + dy, player.r, WORLD.height - player.r)
  };
  if (config.walls.some(wall => circlePolyOverlap(next, player.r, wall.points))) return;
  player.x = next.x;
  player.y = next.y;
}

function shoot() {
  const a = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  state.shots.push({
    x: player.x + Math.cos(a) * 30,
    y: player.y + Math.sin(a) * 22,
    vx: Math.cos(a) * 720,
    vy: Math.sin(a) * 720,
    r: 6,
    life: 0.72
  });
  player.facing = Math.cos(a) >= 0 ? 1 : -1;
  player.cooldown = 0.16;
  player.shootAnim = 0.22;
}

function updateSpawns(dt) {
  triggerEnteredSections();
  updateSectionCompletions();
}

function spawnEnemy(type, spawnDot = null, sectionIndex = -1) {
  const pos = spawnDot ? { x: spawnDot.x, y: spawnDot.y } : randomEdgeSpawn();
  const stats = type === 'runner'
    ? { r: 17, hp: 28, speed: rand(98, 136), bite: 8, w: 60, h: 84 }
    : { r: 19, hp: 38, speed: rand(70, 98), bite: 11, w: 56, h: 82 };
  state.enemies.push({
    type,
    x: pos.x,
    y: pos.y,
    ...stats,
    hit: 0,
    attackAnim: 0,
    animTime: rand(0, 0.3),
    facing: -1,
    sectionIndex
  });
}

function randomEdgeSpawn() {
  const edge = Math.floor(Math.random() * 4);
  const margin = 34;
  const minX = clamp(camera.x - margin, -margin, WORLD.width + margin);
  const maxX = clamp(camera.x + camera.w + margin, -margin, WORLD.width + margin);
  const minY = clamp(camera.y - margin, -margin, WORLD.height + margin);
  const maxY = clamp(camera.y + camera.h + margin, -margin, WORLD.height + margin);
  return [
    { x: rand(minX, maxX), y: minY },
    { x: maxX, y: rand(minY, maxY) },
    { x: rand(minX, maxX), y: maxY },
    { x: minX, y: rand(minY, maxY) }
  ][edge];
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;
    moveEnemyAxis(enemy, (dx / d) * enemy.speed * dt, 0);
    moveEnemyAxis(enemy, 0, (dy / d) * enemy.speed * dt);
    enemy.facing = dx >= 0 ? 1 : -1;
    enemy.animTime += dt;
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.attackAnim = Math.max(0, enemy.attackAnim - dt);
    if (d < enemy.r + player.r && player.invuln <= 0) {
      player.hp -= enemy.bite;
      player.invuln = 0.55;
      enemy.attackAnim = 0.28;
      burst(player.x, player.y, '#ff4d6d', 10);
    }
  }
}

function moveEnemyAxis(enemy, dx, dy) {
  if (dx === 0 && dy === 0) return;
  const next = {
    x: clamp(enemy.x + dx, enemy.r, WORLD.width - enemy.r),
    y: clamp(enemy.y + dy, enemy.r, WORLD.height - enemy.r)
  };
  if (config.walls.some(wall => circlePolyOverlap(next, enemy.r, wall.points))) return;
  enemy.x = next.x;
  enemy.y = next.y;
}

function updateShots(dt) {
  for (const shot of state.shots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (config.walls.some(wall => circlePolyOverlap(shot, shot.r, wall.points))) shot.life = 0;
    for (const enemy of state.enemies) {
      if (shot.life <= 0) break;
      if (Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < shot.r + enemy.r) {
        enemy.hp -= 24;
        enemy.hit = 0.08;
        shot.life = 0;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          state.kills++;
          burst(enemy.x, enemy.y, enemy.type === 'runner' ? '#ffd166' : '#70e000', 10);
        }
      }
    }
  }
  state.shots = state.shots.filter(s => s.life > 0 && s.x > -80 && s.x < WORLD.width + 80 && s.y > -80 && s.y < WORLD.height + 80);
  state.enemies = state.enemies.filter(enemy => !enemy.dead);
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.92, dt * 60);
    p.vy *= Math.pow(0.92, dt * 60);
    p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

function finishPrelevel() {
  state.mode = 'done';
  window.location.href = `video.html?src=assets/videos/2.mp4&next=${encodeURIComponent('index.html?start=campaign')}`;
}

function resetPrelevel() {
  player.x = config.start.x;
  player.y = config.start.y;
  player.hp = 100;
  player.invuln = 0;
  player.cooldown = 0;
  player.shootAnim = 0;
  Object.assign(state, { mode: 'menu', time: 0, spawnTimer: 0, activeSectionIndex: -1, triggeredSections: [], completedSections: [], spawned: 0, kills: 0, enemies: [], shots: [], particles: [] });
  overlay.classList.add('show');
  overlay.querySelector('h1').textContent = 'Try Again';
  overlay.querySelector('p').textContent = 'The horde broke through. Reset, breathe, and clear the crash zone with the pistol.';
  startBtn.textContent = 'Retry';
}

function resetRun() {
  player.x = config.start.x;
  player.y = config.start.y;
  player.hp = 100;
  player.invuln = 0;
  player.cooldown = 0;
  player.shootAnim = 0;
  Object.assign(state, { time: 0, spawnTimer: 0, activeSectionIndex: -1, triggeredSections: [], completedSections: [], spawned: 0, kills: 0, enemies: [], shots: [], particles: [] });
}

function updateHud() {
  hpText.textContent = Math.max(0, Math.round(player.hp));
  killText.textContent = `${state.kills} / ${getTotalEnemies()}`;
  const remaining = getTotalEnemies() - state.kills;
  const meetNear = dist(player.x, player.y, config.meet.x, config.meet.y) <= 38;
  const canInteract = canInteractWithMeetCharacter();
  threatText.textContent = getTotalEnemies() <= 0
    ? (meetNear ? 'Talk' : 'Find Ally')
    : state.enemies.length === 0
    ? (meetNear ? 'Talk' : 'Find Ally')
    : state.enemies.length > 18 ? 'Critical' : state.enemies.length > 10 ? 'High' : state.activeSectionIndex >= 0 ? `Section ${state.activeSectionIndex + 1}` : 'Find Zone';
  if (remaining <= 0 && !meetNear) threatText.textContent = 'Find Ally';
  if (interactBtn) {
    interactBtn.hidden = !canInteract;
    interactBtn.textContent = 'Talk (E)';
  }
}

function updateCamera() {
  if (gameDevMode) {
    const scale = Math.min(W / WORLD.width, H / WORLD.height);
    WORLD.zoom = scale;
    camera.w = W / scale;
    camera.h = H / scale;
    camera.x = 0;
    camera.y = 0;
    return;
  }
  WORLD.zoom = Math.sqrt(10);
  camera.w = W / WORLD.zoom;
  camera.h = H / WORLD.zoom;
  camera.x = clamp(player.x - camera.w / 2, 0, Math.max(0, WORLD.width - camera.w));
  camera.y = clamp(player.y - camera.h / 2, 0, Math.max(0, WORLD.height - camera.h));
}

function updateMouseWorld() {
  mouse.worldX = camera.x + mouse.screenX / WORLD.zoom;
  mouse.worldY = camera.y + mouse.screenY / WORLD.zoom;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawArena();
  if (gameDevMode) drawGoal();
  drawMeetCharacter();
  drawShots();
  drawEnemies();
  drawPlayer();
  drawParticles();
  if (gameDevMode) drawDevOverlays();
}

function drawArena() {
  const bg = images.get(PRELEVEL_ASSETS.background);
  if (bg && bg.complete && bg.naturalWidth) {
    ctx.drawImage(bg, camera.x, camera.y, camera.w, camera.h, 0, 0, W, H);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#07101f');
    gradient.addColorStop(0.55, '#131a2a');
    gradient.addColorStop(1, '#050812');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawGoal() {
  const screen = worldToScreen(config.goal.x, config.goal.y);
  ctx.save();
  ctx.strokeStyle = '#70e000';
  ctx.fillStyle = 'rgba(112,224,0,0.18)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(screen.x - 13, screen.y);
  ctx.lineTo(screen.x + 13, screen.y);
  ctx.moveTo(screen.x, screen.y - 13);
  ctx.lineTo(screen.x, screen.y + 13);
  ctx.stroke();
  ctx.restore();
}

function drawMeetCharacter() {
  const screen = worldToScreen(config.meet.x, config.meet.y);
  const w = 50;
  const h = 76;
  const drew = drawAnimatedSprite(PRELEVEL_ASSETS.meet.idle, screen.x - w / 2, screen.y - h + 22, w, h, 1, state.time, 1);
  if (!drew) {
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#050812';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  const screen = worldToScreen(player.x, player.y);
  const frameSet = player.shootAnim > 0 ? PRELEVEL_ASSETS.player.shoot : (player.moving ? PRELEVEL_ASSETS.player.run : PRELEVEL_ASSETS.player.idle);
  const drew = drawAnimatedSprite(frameSet, screen.x - player.w / 2, screen.y - player.h + 24, player.w, player.h, player.facing, player.animTime, player.shootAnim > 0 ? 18 : 9);
  if (!drew) {
    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.globalAlpha = player.invuln > 0 && Math.floor(state.time * 22) % 2 === 0 ? 0.55 : 1;
    ctx.fillStyle = '#101828';
    ctx.beginPath();
    ctx.arc(0, 0, player.r * WORLD.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    const screen = worldToScreen(enemy.x, enemy.y);
    const set = PRELEVEL_ASSETS.enemies[enemy.type][enemy.attackAnim > 0 ? 'attack' : 'run'];
    const drew = drawAnimatedSprite(set, screen.x - enemy.w / 2, screen.y - enemy.h + 20, enemy.w, enemy.h, enemy.facing, enemy.animTime, 9);
    if (!drew) {
      ctx.save();
      ctx.fillStyle = enemy.hit > 0 ? '#ffffff' : (enemy.type === 'runner' ? '#ffd166' : '#70e000');
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, enemy.r * WORLD.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawShots() {
  for (const s of state.shots) {
    const screen = worldToScreen(s.x, s.y);
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const screen = worldToScreen(p.x, p.y);
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, p.r * WORLD.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDevOverlays() {
  ctx.save();
  for (const wall of config.walls) {
    drawPoly(wall.points, 'rgba(255,77,109,0.24)', 'rgba(255,77,109,0.92)', 2);
  }
  if (devState.wallPoints.length) {
    drawDraftPoly(devState.wallPoints, '#ff4d6d');
  }
  config.sections.forEach((section, index) => {
    const completed = state.completedSections[index];
    const active = index === state.activeSectionIndex;
    drawPoly(section.points, completed ? 'rgba(112,224,0,0.1)' : 'rgba(255,209,102,0.14)', active ? '#ffffff' : completed ? 'rgba(112,224,0,0.8)' : 'rgba(255,209,102,0.9)', 2);
    for (const dot of getSectionDots(section)) {
      const screen = worldToScreen(dot.x, dot.y);
      ctx.fillStyle = dot.type === 'runner' ? '#ffd166' : '#70e000';
      ctx.strokeStyle = '#050812';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
  if (devState.sectionPoints.length) {
    drawDraftPoly(devState.sectionPoints, '#ffd166');
  }
  const start = worldToScreen(config.start.x, config.start.y);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(start.x, start.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPoly(points, fill, stroke, lineWidth) {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.closePath();
  if (points.length >= 3) ctx.fill();
  ctx.stroke();
  for (const point of points) {
    const screen = worldToScreen(point.x, point.y);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();
  }
  ctx.restore();
}

function drawDraftPoly(points, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  const mouseScreen = worldToScreen(mouse.worldX, mouse.worldY);
  ctx.lineTo(mouseScreen.x, mouseScreen.y);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const point of points) {
    const screen = worldToScreen(point.x, point.y);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAnimatedSprite(paths, x, y, w, h, facing, animTime, fps = 10) {
  if (!paths || !paths.length) return false;
  const img = images.get(paths[Math.floor(animTime * fps) % paths.length]);
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

function handleDevClick() {
  const mode = devModeSelect?.value || 'goal';
  const x = clamp(Math.round(mouse.worldX), 0, WORLD.width);
  const y = clamp(Math.round(mouse.worldY), 0, WORLD.height);
  if (mode === 'start') {
    config.start = { x, y };
    player.x = x;
    player.y = y;
  } else if (mode === 'goal') {
    config.goal = { x, y };
  } else if (mode === 'meet') {
    config.meet = { x, y };
  } else if (mode === 'wall') {
    devState.wallPoints.push({ x, y });
  } else if (mode === 'section') {
    devState.sectionPoints.push({ x, y });
  }
  autoSaveConfig();
  syncDevStatus();
}

function startDevPanelDrag(event) {
  if (!gameDevMode || !devPanel) return;
  const rect = devPanel.getBoundingClientRect();
  devState.panelDragging = true;
  devState.panelOffsetX = event.clientX - rect.left;
  devState.panelOffsetY = event.clientY - rect.top;
  devPanel.classList.add('dragging');
  event.preventDefault();
}

function dragDevPanel(event) {
  if (!devState.panelDragging || !devPanel) return;
  const shell = devPanel.closest('.prelevel-shell');
  const bounds = shell ? shell.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const panelRect = devPanel.getBoundingClientRect();
  const x = clamp(event.clientX - bounds.left - devState.panelOffsetX, 8, bounds.width - panelRect.width - 8);
  const y = clamp(event.clientY - bounds.top - devState.panelOffsetY, 8, bounds.height - panelRect.height - 8);
  setDevPanelPosition(x, y);
}

function stopDevPanelDrag() {
  if (!devState.panelDragging || !devPanel) return;
  devState.panelDragging = false;
  devPanel.classList.remove('dragging');
  try {
    localStorage.setItem(PRELEVEL_PANEL_STORAGE_KEY, JSON.stringify({
      x: Number.parseFloat(devPanel.style.left) || 14,
      y: Number.parseFloat(devPanel.style.top) || 14
    }));
  } catch (error) {
    // Panel position is optional.
  }
}

function restoreDevPanelPosition() {
  if (!devPanel) return;
  try {
    const saved = JSON.parse(localStorage.getItem(PRELEVEL_PANEL_STORAGE_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      setDevPanelPosition(saved.x, saved.y);
    }
  } catch (error) {
    // Ignore invalid saved panel positions.
  }
}

function setDevPanelPosition(x, y) {
  if (!devPanel) return;
  devPanel.style.left = `${x}px`;
  devPanel.style.top = `${y}px`;
  devPanel.style.right = 'auto';
}

function addDevSection() {
  const grunt = clamp(Number.parseInt(devGruntCount?.value, 10) || 0, 0, 999);
  const runner = clamp(Number.parseInt(devRunnerCount?.value, 10) || 0, 0, 999);
  const mode = devModeSelect?.value || 'goal';
  if (mode === 'wall') {
    if (devState.wallPoints.length < 3) return;
    config.walls.push({ points: normalizePoly(devState.wallPoints) });
    devState.wallPoints = [];
  } else {
    if (grunt + runner <= 0 || devState.sectionPoints.length < 3) return;
    const points = normalizePoly(devState.sectionPoints);
    config.sections.push({ grunt, runner, points, dots: makeSectionDots(points, grunt, runner) });
    devState.sectionPoints = [];
  }
  autoSaveConfig();
  syncDevStatus();
}

function undoConfigItem() {
  const mode = devModeSelect?.value || 'goal';
  if (mode === 'wall' && devState.wallPoints.length) devState.wallPoints.pop();
  else if (mode === 'wall') config.walls.pop();
  else if (mode === 'section' && devState.sectionPoints.length) devState.sectionPoints.pop();
  else if (mode === 'section') config.sections.pop();
  autoSaveConfig();
  syncDevStatus();
}

function saveConfig() {
  clampConfigToWorld();
  localStorage.setItem(PRELEVEL_STORAGE_KEY, JSON.stringify(config));
  syncDevStatus('Saved');
}

function exportConfig() {
  clampConfigToWorld();
  const text = JSON.stringify(config, null, 2);
  if (devConfigExport) {
    devConfigExport.hidden = false;
    devConfigExport.value = text;
    devConfigExport.focus();
    devConfigExport.select();
  }
  navigator.clipboard?.writeText(text).catch(() => {});
  syncDevStatus('Exported');
}

function autoSaveConfig() {
  try {
    clampConfigToWorld();
    localStorage.setItem(PRELEVEL_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    // Autosave is best-effort.
  }
}

function resetConfig() {
  localStorage.removeItem(PRELEVEL_STORAGE_KEY);
  config = cloneConfig(DEFAULT_CONFIG);
  config = sanitizeConfig(config);
  player.x = config.start.x;
  player.y = config.start.y;
  devState.wallPoints = [];
  devState.sectionPoints = [];
  syncDevStatus('Reset');
}

function syncDevStatus(prefix = '') {
  if (!devStatus) return;
  const sectionText = config.sections.map((section, index) => `${index + 1}: ${section.points.length}pts G${section.grunt}/R${section.runner}`).join(' | ') || 'none';
  const draft = devState.sectionPoints.length ? ` - Section draft ${devState.sectionPoints.length}pts` : devState.wallPoints.length ? ` - Wall draft ${devState.wallPoints.length}pts` : '';
  devStatus.textContent = `${prefix ? `${prefix}. ` : ''}Spawn ${Math.round(config.start.x)},${Math.round(config.start.y)} - Meet ${Math.round(config.meet.x)},${Math.round(config.meet.y)} - Goal ${Math.round(config.goal.x)},${Math.round(config.goal.y)} - Walls ${config.walls.length} - Sections ${sectionText}${draft}`;
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRELEVEL_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return cloneConfig(DEFAULT_CONFIG);
    return sanitizeConfig(saved);
  } catch (error) {
    return cloneConfig(DEFAULT_CONFIG);
  }
}

function sanitizeConfig(raw) {
  const base = cloneConfig(DEFAULT_CONFIG);
  const next = {
    start: sanitizePoint(raw.start, base.start),
    goal: sanitizePoint(raw.goal, base.goal),
    meet: sanitizePoint(raw.meet, raw.goal || base.meet),
    walls: Array.isArray(raw.walls) ? raw.walls.map(sanitizeWall).filter(Boolean) : base.walls,
    sections: Array.isArray(raw.sections) ? raw.sections.map(sanitizeSection).filter(Boolean) : base.sections
  };
  return next;
}

function sanitizePoint(point, fallback) {
  if (!fallback && (!Number.isFinite(point?.x) || !Number.isFinite(point?.y))) return null;
  return {
    x: Number.isFinite(point?.x) ? point.x : fallback.x,
    y: Number.isFinite(point?.y) ? point.y : fallback.y
  };
}

function sanitizeWall(wall) {
  if (Array.isArray(wall?.points)) {
    const points = wall.points.map(point => sanitizePoint(point, null)).filter(Boolean);
    return points.length >= 3 ? { points: normalizePoly(points) } : null;
  }
  if (!Number.isFinite(wall?.x) || !Number.isFinite(wall?.y) || !Number.isFinite(wall?.w) || !Number.isFinite(wall?.h)) return null;
  const x1 = wall.x;
  const y1 = wall.y;
  const x2 = wall.x + Math.max(1, wall.w);
  const y2 = wall.y + Math.max(1, wall.h);
  return { points: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }] };
}

function sanitizeSection(section) {
  const grunt = clamp(Number.parseInt(section?.grunt, 10) || 0, 0, 999);
  const runner = clamp(Number.parseInt(section?.runner, 10) || 0, 0, 999);
  const points = Array.isArray(section?.points)
    ? section.points.map(point => sanitizePoint(point, null)).filter(Boolean)
    : null;
  if (grunt + runner <= 0 || !points || points.length < 3) return null;
  const normalized = normalizePoly(points);
  const dots = Array.isArray(section.dots)
    ? section.dots.map(sanitizeDot).filter(Boolean).filter(dot => pointInPoly(dot, normalized))
    : [];
  return { grunt, runner, points: normalized, dots: dots.length === grunt + runner ? dots : makeSectionDots(normalized, grunt, runner) };
}

function sanitizeDot(dot) {
  if (!Number.isFinite(dot?.x) || !Number.isFinite(dot?.y)) return null;
  return { x: dot.x, y: dot.y, type: dot.type === 'runner' ? 'runner' : 'grunt' };
}

function clampConfigToWorld() {
  config.start.x = clamp(config.start.x, 0, WORLD.width);
  config.start.y = clamp(config.start.y, 0, WORLD.height);
  config.goal.x = clamp(config.goal.x, 0, WORLD.width);
  config.goal.y = clamp(config.goal.y, 0, WORLD.height);
  config.meet.x = clamp(config.meet.x, 0, WORLD.width);
  config.meet.y = clamp(config.meet.y, 0, WORLD.height);
  config.walls.forEach(wall => { wall.points = normalizePoly(wall.points); });
  config.sections.forEach(section => {
    section.points = normalizePoly(section.points);
    section.dots = getSectionDots(section);
  });
}

function currentSection() {
  return state.activeSectionIndex >= 0 ? config.sections[state.activeSectionIndex] || null : null;
}

function allSectionsComplete() {
  return config.sections.length > 0 && config.sections.every((section, index) => state.completedSections[index]);
}

function triggerEnteredSections() {
  for (let index = 0; index < config.sections.length; index++) {
    const section = config.sections[index];
    if (state.triggeredSections[index] || state.completedSections[index] || !pointInPoly(player, section.points)) continue;
    state.triggeredSections[index] = true;
    state.activeSectionIndex = index;
    const dots = getSectionDots(section);
    for (const dot of dots) {
      spawnEnemy(dot.type, dot, index);
      state.spawned++;
    }
  }
}

function updateSectionCompletions() {
  for (let index = 0; index < config.sections.length; index++) {
    if (!state.triggeredSections[index] || state.completedSections[index]) continue;
    if (!state.enemies.some(enemy => enemy.sectionIndex === index)) {
      state.completedSections[index] = true;
    }
  }
  if (state.activeSectionIndex >= 0 && state.completedSections[state.activeSectionIndex]) {
    state.activeSectionIndex = -1;
  }
}

function canInteractWithMeetCharacter() {
  return state.mode === 'playing' &&
    state.enemies.length === 0 &&
    dist(player.x, player.y, config.meet.x, config.meet.y) <= 46;
}

function tryInteractWithMeetCharacter() {
  if (canInteractWithMeetCharacter()) finishPrelevel();
}

function getTotalEnemies() {
  return config.sections.reduce((total, section) => total + section.grunt + section.runner, 0);
}

function getSectionDots(section) {
  const expected = section.grunt + section.runner;
  if (!Array.isArray(section.dots) || section.dots.length !== expected) {
    section.dots = makeSectionDots(section.points, section.grunt, section.runner);
  }
  return section.dots;
}

function makeSectionDots(points, grunt, runner) {
  const dots = [];
  for (let i = 0; i < grunt; i++) dots.push({ ...randomPointInPoly(points), type: 'grunt' });
  for (let i = 0; i < runner; i++) dots.push({ ...randomPointInPoly(points), type: 'runner' });
  return shuffle(dots);
}

function randomPointInPoly(points) {
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  for (let i = 0; i < 600; i++) {
    const point = { x: rand(minX, maxX), y: rand(minY, maxY) };
    if (pointInPoly(point, points)) return point;
  }
  return centroid(points);
}

function normalizePoly(points) {
  return points.map(point => ({
    x: clamp(Math.round(point.x), 0, WORLD.width),
    y: clamp(Math.round(point.y), 0, WORLD.height)
  }));
}

function pointInPoly(point, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y)) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 0.0001) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function circlePolyOverlap(circle, radius, points) {
  if (!points || points.length < 3) return false;
  if (pointInPoly(circle, points)) return true;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (distanceToSegment(circle, a, b) <= radius) return true;
  }
  return false;
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq, 0, 1);
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  return Math.hypot(point.x - x, point.y - y);
}

function centroid(points) {
  return points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(60, 260);
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1.4, 3.2), life: rand(0.18, 0.36), maxLife: 0.36, color });
  }
}

function worldToScreen(x, y) {
  return {
    x: (x - camera.x) * WORLD.zoom,
    y: (y - camera.y) * WORLD.zoom
  };
}
function cloneConfig(value) { return JSON.parse(JSON.stringify(value)); }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
