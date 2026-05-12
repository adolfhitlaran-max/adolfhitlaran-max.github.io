const canvas = document.getElementById('level2Canvas');
const ctx = canvas.getContext('2d');
const hpText = document.getElementById('level2Hp');
const staminaText = document.getElementById('level2Stamina');
const ashtarText = document.getElementById('level2Ashtar');
const objectiveText = document.getElementById('level2Objective');
const enemyText = document.getElementById('level2Enemies');
const upgradeText = document.getElementById('level2Upgrades');
const overlay = document.getElementById('level2Overlay');
const pauseOverlay = document.getElementById('level2PauseOverlay');
const startBtn = document.getElementById('level2StartBtn');
const resumeBtn = document.getElementById('level2ResumeBtn');
const interactBtn = document.getElementById('level2InteractBtn');
const devPanel = document.getElementById('level2DevPanel');
const devModeSelect = document.getElementById('level2DevMode');
const devEnemyType = document.getElementById('level2EnemyType');
const devEnemyTotal = document.getElementById('level2EnemyTotal');
const devStatus = document.getElementById('level2DevStatus');
const devSaveBtn = document.getElementById('level2SaveBtn');
const devExportBtn = document.getElementById('level2ExportBtn');
const devResetBtn = document.getElementById('level2ResetBtn');
const devFinishPathBtn = document.getElementById('level2FinishPathBtn');
const devUndoPathBtn = document.getElementById('level2UndoPathBtn');
const devClearPathsBtn = document.getElementById('level2ClearPathsBtn');
const devSpawnEnemiesBtn = document.getElementById('level2SpawnEnemiesBtn');
const devClearEnemiesBtn = document.getElementById('level2ClearEnemiesBtn');
const devImportBtn = document.getElementById('level2ImportBtn');
const devConfigExport = document.getElementById('level2ConfigExport');

const W = canvas.width;
const H = canvas.height;
const params = new URLSearchParams(window.location.search);
const devMode = params.get('dev') === '1';
const requestedPhase = params.get('phase') === '2' ? 2 : 1;
const STORAGE_KEY = 'holdTheLine.level2Config.v5';
const PHASE_STORAGE_KEY = 'holdTheLine.level2Phase.v1';
const PHASE_RETURN_STORAGE_KEY = 'holdTheLine.level2PhaseReturn.v1';
const BUS_COMPLETE_VIDEO_SRC = 'assets/videos/2.mp4';
const PROGRESS_STORAGE_KEY = window.HOLD_LINE_SAVE
  ? window.HOLD_LINE_SAVE.scopedKey('holdTheLine.highestUnlockedLevel.v1')
  : 'holdTheLine.highestUnlockedLevel.v1';
const keys = new Set();
const mouse = { screenX: W / 2, screenY: H / 2, worldX: W / 2, worldY: H / 2 };

const ASSETS = {
  background: 'assets/backgrounds/level2map.png',
  bus: [
    'assets/level2/bus/1.png',
    'assets/level2/bus/2.png',
    'assets/level2/bus/3.png',
    'assets/level2/bus/4.png'
  ],
  player: {
    idle: ['assets/player/genz/idle/1.png'],
    run: [
      'assets/player/genz/run/1.png',
      'assets/player/genz/run/2.png',
      'assets/player/genz/run/3.png'
    ],
    gunfire: [
      'assets/player/genz/gunfire/1.png',
      'assets/player/genz/gunfire/2.png',
      'assets/player/genz/gunfire/3.png',
      'assets/player/genz/gunfire/4.png'
    ],
    shoot: [
      'assets/player/genz/shoot/1.png',
      'assets/player/genz/shoot/2.png',
      'assets/player/genz/shoot/3.png'
    ],
    punch: [
      'assets/player/genz/punch/1.png',
      'assets/player/genz/punch/2.png',
      'assets/player/genz/punch/3.png'
    ],
    kick: [
      'assets/player/genz/kick/1.png',
      'assets/player/genz/kick/2.png',
      'assets/player/genz/kick/3.png'
    ],
    shockwave: [
      'assets/player/genz/shockwave/1.png',
      'assets/player/genz/shockwave/2.png'
    ]
  },
  ashtar: {
    idle: ['assets/ashtar/carrying/1.png'],
    walk: [
      'assets/ashtar/carrying/1.png',
      'assets/ashtar/carrying/2.png',
      'assets/ashtar/carrying/3.png'
    ],
    gathering: [
      'assets/ashtar/gathering/1.png',
      'assets/ashtar/gathering/2.png',
      'assets/ashtar/gathering/3.png'
    ]
  },
  bella: {
    idle: ['assets/player/bella/idle/1.png'],
    walk: [
      'assets/player/bella/walk/1.png',
      'assets/player/bella/walk/2.png',
      'assets/player/bella/walk/3.png'
    ],
    shoot: [
      'assets/player/bella/shoot/1.png',
      'assets/player/bella/shoot/2.png',
      'assets/player/bella/shoot/3.png'
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
    }
  }
};

const ENEMY_TYPES = {
  grunt: { w: 42, h: 62, r: 12, hp: 34, speed: 54, chaseSpeed: 69, damage: 9, attackRange: 20, sightRange: 380 },
  runner: { w: 38, h: 57, r: 11, hp: 24, speed: 75, chaseSpeed: 103, damage: 7, attackRange: 19, sightRange: 430 }
};

const COMBAT = Object.freeze({
  staminaMax: 100,
  staminaRegen: 30,
  punchDamage: 19,
  kickDamage: 33,
  punchCost: 3,
  kickCost: 9,
  punchCooldown: 0.26,
  kickCooldown: 0.42,
  shootCost: 12,
  shootCooldown: 0.34,
  bulletSpeed: 680,
  bulletDamage: 24,
  shockwaveCost: 30,
  shockwaveCooldown: 4.2,
  shockwaveRadius: 132,
  shockwaveDamage: 34,
  dashCost: 18,
  dashCooldown: 1.0,
  dashSpeed: 470,
  dashTime: 0.16,
  dashInvuln: 0.22
});

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
queueGroup(ASSETS);

const WORLD = {
  width: 1672,
  height: 941,
  zoom: Math.sqrt(10)
};
const CHARACTER_PNG_SCALE = 1.25;
const ZOMBIE_WALL_PHASE_INTERVAL = 20;
const ZOMBIE_WALL_PHASE_DURATION = 3;
const ASHTAR_BUS_REPAIR_STAGE_TIME = 30;
const PHASE_TWO_MAX_UPGRADES_ON_FIELD = 4;
const PHASE_TWO_UPGRADE_DROP_CHANCE = 0.38;
const PHASE_TWO_UPGRADE_PITY_KILLS = 3;
const PHASE_TWO_UPGRADE_LIFETIME = 26;
const PHASE_TWO_UPGRADE_MAGNET_RADIUS = 116;
const PHASE_TWO_UPGRADE_MAGNET_SPEED = 240;
const PHASE_TWO_UPGRADE_COLLECT_RADIUS = 22;
const PHASE_TWO_UPGRADE_MIN_SPACING = 44;
const MAX_PARTICLES = 260;
const MAX_FLOATING_TEXT = 80;
const MAX_SHOCKWAVE_TARGETS_PER_USE = 28;
const MAX_SHOCKWAVE_HITS_PER_FRAME = 4;
const MAX_SHOCKWAVE_DEATH_EFFECTS = 4;
const WALL_COLLISION_RADIUS = 8;
const WALL_JOINT_RADIUS = 10;
const PHASE_TWO_UPGRADE_TIERS = Object.freeze({
  common: { label: 'COMMON', shortLabel: 'I', color: '#5dd8ff', weight: 70, power: 1, particles: 18 },
  rare: { label: 'RARE', shortLabel: 'II', color: '#ffd166', weight: 24, power: 2, particles: 26 },
  epic: { label: 'EPIC', shortLabel: 'III', color: '#c77dff', weight: 6, power: 3, particles: 34 }
});
const PHASE_TWO_UPGRADES = [
  {
    id: 'arc-core',
    label: 'Arc Core',
    shortLabel: 'DMG',
    color: '#5dd8ff',
    stat: 'playerDamage',
    maxStacks: 9,
    weight: 1.18
  },
  {
    id: 'quick-trigger',
    label: 'Quick Trigger',
    shortLabel: 'RATE',
    color: '#ffd166',
    stat: 'playerRate',
    maxStacks: 8,
    weight: 1.05
  },
  {
    id: 'phase-round',
    label: 'Phase Rounds',
    shortLabel: 'PIERCE',
    color: '#b8f3ff',
    stat: 'playerPierce',
    maxStacks: 4,
    weight: 0.84,
    tierPower: { common: 1, rare: 1, epic: 2 }
  },
  {
    id: 'wide-core',
    label: 'Wide Core',
    shortLabel: 'SIZE',
    color: '#70e000',
    stat: 'playerSize',
    maxStacks: 5,
    weight: 0.86
  },
  {
    id: 'impact-bloom',
    label: 'Impact Bloom',
    shortLabel: 'AOE',
    color: '#39f5a8',
    stat: 'playerSplash',
    maxStacks: 5,
    weight: 0.72
  },
  {
    id: 'chain-arc',
    label: 'Chain Arc',
    shortLabel: 'CHAIN',
    color: '#8fe9ff',
    stat: 'playerChain',
    maxStacks: 3,
    weight: 0.58,
    tierPower: { common: 1, rare: 1, epic: 2 }
  },
  {
    id: 'surge-battery',
    label: 'Surge Battery',
    shortLabel: 'ENERGY',
    color: '#f6f7a7',
    stat: 'playerBattery',
    maxStacks: 6,
    weight: 0.92
  },
  {
    id: 'kinetic-coil',
    label: 'Kinetic Coil',
    shortLabel: 'MOVE',
    color: '#ff9f1c',
    stat: 'playerMobility',
    maxStacks: 5,
    weight: 0.76
  },
  {
    id: 'bella-focus',
    label: 'Bella Damage',
    shortLabel: 'BELLA+',
    color: '#ff70a6',
    stat: 'bellaDamage',
    maxStacks: 7,
    weight: 0.95
  },
  {
    id: 'cover-rhythm',
    label: 'Bella Rate',
    shortLabel: 'B.RATE',
    color: '#c77dff',
    stat: 'bellaRate',
    maxStacks: 6,
    weight: 0.82
  },
  {
    id: 'field-mender',
    label: 'Field Mender',
    shortLabel: 'HEAL',
    color: '#ffffff',
    instant: true,
    weight: 0.54,
    apply(pickup) {
      const power = getUpgradeTierPower(pickup.tier, pickup.upgrade);
      player.hp = clamp(player.hp + 16 + power * 14, 0, player.maxHp);
      player.stamina = clamp(player.stamina + 20 + power * 18, 0, player.maxStamina);
    }
  }
];

const DEFAULT_CONFIG = Object.freeze({
    "start":  {
                  "x":  156,
                  "y":  458
              },
    "ashtarSpawn":  {
                        "x":  183,
                        "y":  488
                    },
    "midpoint":  {
                     "x":  1239,
                     "y":  474
                 },
    "phase2Trigger":  {
                          "x":  1231,
                          "y":  476
                      },
    "bellaSpawn":  {
                       "x":  1204,
                       "y":  400
                   },
    "defensePoint":  {
                         "x":  920,
                         "y":  500
                     },
    "goal":  {
                 "x":  1510,
                 "y":  285
             },
    "spawnTotal":  20,
              "buses":  [
                   {
                       "x":  1079,
                       "y":  420,
                       "w":  170,
                       "h":  170,
                       "stage":  1
                   }
              ],
    "ashtarWorkPoints":  [
                             {
                                 "x":  1028,
                                 "y":  455
                             },
                             {
                                 "x":  1120,
                                 "y":  428
                             },
                             {
                                 "x":  1102,
                                 "y":  370
                             },
                             {
                                 "x":  1033,
                                 "y":  417
                             }
                         ],
    "enemyPaths":  [
                       {
                           "type":  "grunt",
                           "points":  [
                                          {
                                              "x":  893,
                                              "y":  901
                                          },
                                          {
                                              "x":  830,
                                              "y":  780
                                          },
                                          {
                                              "x":  716,
                                              "y":  711
                                          },
                                          {
                                              "x":  634,
                                              "y":  669
                                          },
                                          {
                                              "x":  526,
                                              "y":  606
                                          },
                                          {
                                              "x":  454,
                                              "y":  577
                                          },
                                          {
                                              "x":  357,
                                              "y":  514
                                          },
                                          {
                                              "x":  310,
                                              "y":  395
                                          },
                                          {
                                              "x":  288,
                                              "y":  320
                                          },
                                          {
                                              "x":  360,
                                              "y":  227
                                          },
                                          {
                                              "x":  439,
                                              "y":  161
                                          },
                                          {
                                              "x":  517,
                                              "y":  106
                                          },
                                          {
                                              "x":  565,
                                              "y":  100
                                          },
                                          {
                                              "x":  636,
                                              "y":  103
                                          },
                                          {
                                              "x":  673,
                                              "y":  113
                                          },
                                          {
                                              "x":  673,
                                              "y":  113
                                          },
                                          {
                                              "x":  700,
                                              "y":  138
                                          },
                                          {
                                              "x":  704,
                                              "y":  158
                                          },
                                          {
                                              "x":  630,
                                              "y":  184
                                          },
                                          {
                                              "x":  594,
                                              "y":  231
                                          },
                                          {
                                              "x":  562,
                                              "y":  281
                                          },
                                          {
                                              "x":  538,
                                              "y":  335
                                          },
                                          {
                                              "x":  588,
                                              "y":  370
                                          },
                                          {
                                              "x":  654,
                                              "y":  387
                                          },
                                          {
                                              "x":  681,
                                              "y":  404
                                          },
                                          {
                                              "x":  709,
                                              "y":  444
                                          },
                                          {
                                              "x":  766,
                                              "y":  520
                                          },
                                          {
                                              "x":  781,
                                              "y":  569
                                          },
                                          {
                                              "x":  839,
                                              "y":  590
                                          },
                                          {
                                              "x":  885,
                                              "y":  631
                                          },
                                          {
                                              "x":  916,
                                              "y":  677
                                          },
                                          {
                                              "x":  971,
                                              "y":  710
                                          },
                                          {
                                              "x":  1051,
                                              "y":  737
                                          },
                                          {
                                              "x":  1073,
                                              "y":  763
                                          },
                                          {
                                              "x":  1052,
                                              "y":  807
                                          },
                                          {
                                              "x":  999,
                                              "y":  837
                                          },
                                          {
                                              "x":  915,
                                              "y":  843
                                          },
                                          {
                                              "x":  893,
                                              "y":  902
                                          }
                                      ]
                       },
                       {
                           "type":  "grunt",
                           "points":  [
                                          {
                                              "x":  696,
                                              "y":  348
                                          },
                                          {
                                              "x":  696,
                                              "y":  348
                                          },
                                          {
                                              "x":  800,
                                              "y":  280
                                          },
                                          {
                                              "x":  861,
                                              "y":  216
                                          },
                                          {
                                              "x":  928,
                                              "y":  223
                                          },
                                          {
                                              "x":  973,
                                              "y":  247
                                          },
                                          {
                                              "x":  991,
                                              "y":  296
                                          },
                                          {
                                              "x":  931,
                                              "y":  357
                                          },
                                          {
                                              "x":  887,
                                              "y":  408
                                          },
                                          {
                                              "x":  812,
                                              "y":  461
                                          },
                                          {
                                              "x":  770,
                                              "y":  484
                                          },
                                          {
                                              "x":  800,
                                              "y":  500
                                          },
                                          {
                                              "x":  834,
                                              "y":  478
                                          },
                                          {
                                              "x":  889,
                                              "y":  482
                                          },
                                          {
                                              "x":  937,
                                              "y":  504
                                          },
                                          {
                                              "x":  991,
                                              "y":  534
                                          },
                                          {
                                              "x":  1041,
                                              "y":  548
                                          },
                                          {
                                              "x":  1093,
                                              "y":  562
                                          },
                                          {
                                              "x":  1178,
                                              "y":  577
                                          },
                                          {
                                              "x":  1241,
                                              "y":  556
                                          },
                                          {
                                              "x":  1299,
                                              "y":  475
                                          },
                                          {
                                              "x":  1319,
                                              "y":  417
                                          },
                                          {
                                              "x":  1335,
                                              "y":  347
                                          },
                                          {
                                              "x":  1279,
                                              "y":  332
                                          },
                                          {
                                              "x":  1182,
                                              "y":  303
                                          },
                                          {
                                              "x":  1100,
                                              "y":  286
                                          },
                                          {
                                              "x":  1035,
                                              "y":  267
                                          },
                                          {
                                              "x":  1012,
                                              "y":  221
                                          },
                                          {
                                              "x":  1028,
                                              "y":  178
                                          },
                                          {
                                              "x":  1075,
                                              "y":  163
                                          },
                                          {
                                              "x":  1064,
                                              "y":  206
                                          },
                                          {
                                              "x":  1089,
                                              "y":  242
                                          },
                                          {
                                              "x":  1132,
                                              "y":  255
                                          },
                                          {
                                              "x":  1177,
                                              "y":  255
                                          },
                                          {
                                              "x":  1224,
                                              "y":  230
                                          },
                                          {
                                              "x":  1261,
                                              "y":  185
                                          },
                                          {
                                              "x":  1299,
                                              "y":  149
                                          },
                                          {
                                              "x":  1381,
                                              "y":  155
                                          },
                                          {
                                              "x":  1445,
                                              "y":  178
                                          },
                                          {
                                              "x":  1490,
                                              "y":  193
                                          },
                                          {
                                              "x":  1491,
                                              "y":  247
                                          },
                                          {
                                              "x":  1457,
                                              "y":  303
                                          },
                                          {
                                              "x":  1405,
                                              "y":  326
                                          },
                                          {
                                              "x":  1378,
                                              "y":  364
                                          },
                                          {
                                              "x":  1356,
                                              "y":  412
                                          },
                                          {
                                              "x":  1321,
                                              "y":  482
                                          },
                                          {
                                              "x":  1284,
                                              "y":  546
                                          },
                                          {
                                              "x":  1246,
                                              "y":  610
                                          },
                                          {
                                              "x":  1240,
                                              "y":  677
                                          },
                                          {
                                              "x":  1257,
                                              "y":  742
                                          },
                                          {
                                              "x":  1319,
                                              "y":  777
                                          },
                                          {
                                              "x":  1412,
                                              "y":  799
                                          },
                                          {
                                              "x":  1495,
                                              "y":  821
                                          },
                                          {
                                              "x":  1292,
                                              "y":  803
                                          },
                                          {
                                              "x":  1249,
                                              "y":  756
                                          },
                                          {
                                              "x":  1207,
                                              "y":  706
                                          },
                                          {
                                              "x":  1110,
                                              "y":  735
                                          },
                                          {
                                              "x":  1050,
                                              "y":  761
                                          },
                                          {
                                              "x":  1050,
                                              "y":  761
                                          },
                                          {
                                              "x":  994,
                                              "y":  727
                                          },
                                          {
                                              "x":  935,
                                              "y":  689
                                          },
                                          {
                                              "x":  874,
                                              "y":  687
                                          },
                                          {
                                              "x":  831,
                                              "y":  735
                                          },
                                          {
                                              "x":  795,
                                              "y":  756
                                          },
                                          {
                                              "x":  723,
                                              "y":  723
                                          },
                                          {
                                              "x":  643,
                                              "y":  674
                                          },
                                          {
                                              "x":  580,
                                              "y":  635
                                          },
                                          {
                                              "x":  607,
                                              "y":  602
                                          },
                                          {
                                              "x":  690,
                                              "y":  566
                                          },
                                          {
                                              "x":  740,
                                              "y":  534
                                          },
                                          {
                                              "x":  713,
                                              "y":  432
                                          },
                                          {
                                              "x":  645,
                                              "y":  379
                                          },
                                          {
                                              "x":  558,
                                              "y":  357
                                          },
                                          {
                                              "x":  428,
                                              "y":  419
                                          },
                                          {
                                              "x":  326,
                                              "y":  486
                                          },
                                          {
                                              "x":  242,
                                              "y":  486
                                          },
                                          {
                                              "x":  325,
                                              "y":  431
                                          },
                                          {
                                              "x":  250,
                                              "y":  326
                                          },
                                          {
                                              "x":  317,
                                              "y":  251
                                          },
                                          {
                                              "x":  411,
                                              "y":  158
                                          },
                                          {
                                              "x":  507,
                                              "y":  109
                                          },
                                          {
                                              "x":  673,
                                              "y":  99
                                          },
                                          {
                                              "x":  717,
                                              "y":  145
                                          },
                                          {
                                              "x":  717,
                                              "y":  161
                                          },
                                          {
                                              "x":  624,
                                              "y":  197
                                          },
                                          {
                                              "x":  560,
                                              "y":  261
                                          },
                                          {
                                              "x":  513,
                                              "y":  296
                                          },
                                          {
                                              "x":  528,
                                              "y":  349
                                          },
                                          {
                                              "x":  596,
                                              "y":  377
                                          }
                                      ]
                       }
              ],
    "phase2EnemyPaths":  [
                             {
                                 "type":  "grunt",
                                 "points":  [
                                                { "x": 829, "y": 467 },
                                                { "x": 933, "y": 505 },
                                                { "x": 1007, "y": 530 },
                                                { "x": 1064, "y": 550 },
                                                { "x": 1095, "y": 571 },
                                                { "x": 1169, "y": 575 },
                                                { "x": 1237, "y": 553 },
                                                { "x": 1258, "y": 512 },
                                                { "x": 1253, "y": 487 },
                                                { "x": 1145, "y": 476 }
                                            ]
                             },
                             {
                                 "type":  "grunt",
                                 "points":  [
                                                { "x": 984, "y": 325 },
                                                { "x": 1039, "y": 267 },
                                                { "x": 1124, "y": 269 },
                                                { "x": 1170, "y": 293 },
                                                { "x": 1235, "y": 310 },
                                                { "x": 1300, "y": 345 },
                                                { "x": 1326, "y": 399 },
                                                { "x": 1314, "y": 433 },
                                                { "x": 1282, "y": 479 },
                                                { "x": 1249, "y": 481 },
                                                { "x": 1158, "y": 465 }
                                            ]
                             },
                             {
                                 "type":  "grunt",
                                 "points":  [
                                                { "x": 953, "y": 307 },
                                                { "x": 1021, "y": 269 },
                                                { "x": 1111, "y": 258 },
                                                { "x": 1199, "y": 275 },
                                                { "x": 1253, "y": 316 },
                                                { "x": 1305, "y": 355 },
                                                { "x": 1326, "y": 377 },
                                                { "x": 1332, "y": 445 },
                                                { "x": 1298, "y": 485 },
                                                { "x": 1203, "y": 476 },
                                                { "x": 1177, "y": 440 }
                                            ]
                             }
                         ],
    "walls":  [
                  {
                      "points":  [
                                     {
                                         "x":  321,
                                         "y":  341
                                     },
                                     {
                                         "x":  387,
                                         "y":  398
                                     },
                                     {
                                         "x":  479,
                                         "y":  339
                                     },
                                     {
                                         "x":  480,
                                         "y":  314
                                     },
                                     {
                                         "x":  423,
                                         "y":  265
                                     },
                                     {
                                         "x":  421,
                                         "y":  230
                                     },
                                     {
                                         "x":  404,
                                         "y":  225
                                     },
                                     {
                                         "x":  391,
                                         "y":  247
                                     },
                                     {
                                         "x":  381,
                                         "y":  273
                                     },
                                     {
                                         "x":  368,
                                         "y":  294
                                     },
                                     {
                                         "x":  318,
                                         "y":  334
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  450,
                                         "y":  233
                                     },
                                     {
                                         "x":  511,
                                         "y":  273
                                     },
                                     {
                                         "x":  563,
                                         "y":  220
                                     },
                                     {
                                         "x":  589,
                                         "y":  178
                                     },
                                     {
                                         "x":  645,
                                         "y":  149
                                     },
                                     {
                                         "x":  660,
                                         "y":  125
                                     },
                                     {
                                         "x":  576,
                                         "y":  109
                                     },
                                     {
                                         "x":  537,
                                         "y":  117
                                     },
                                     {
                                         "x":  530,
                                         "y":  140
                                     },
                                     {
                                         "x":  513,
                                         "y":  170
                                     },
                                     {
                                         "x":  499,
                                         "y":  192
                                     },
                                     {
                                         "x":  471,
                                         "y":  216
                                     },
                                     {
                                         "x":  462,
                                         "y":  225
                                     },
                                     {
                                         "x":  457,
                                         "y":  229
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  577,
                                         "y":  313
                                     },
                                     {
                                         "x":  632,
                                         "y":  357
                                     },
                                     {
                                         "x":  813,
                                         "y":  243
                                     },
                                     {
                                         "x":  686,
                                         "y":  183
                                     },
                                     {
                                         "x":  577,
                                         "y":  307
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  703,
                                         "y":  373
                                     },
                                     {
                                         "x":  766,
                                         "y":  441
                                     },
                                     {
                                         "x":  835,
                                         "y":  419
                                     },
                                     {
                                         "x":  954,
                                         "y":  276
                                     },
                                     {
                                         "x":  893,
                                         "y":  231
                                     },
                                     {
                                         "x":  795,
                                         "y":  319
                                     },
                                     {
                                         "x":  703,
                                         "y":  370
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  747,
                                         "y":  151
                                     },
                                     {
                                         "x":  941,
                                         "y":  214
                                     },
                                     {
                                         "x":  1012,
                                         "y":  146
                                     },
                                     {
                                         "x":  1028,
                                         "y":  133
                                     },
                                     {
                                         "x":  1037,
                                         "y":  125
                                     },
                                     {
                                         "x":  1161,
                                         "y":  163
                                     },
                                     {
                                         "x":  1088,
                                         "y":  200
                                     },
                                     {
                                         "x":  1140,
                                         "y":  234
                                     },
                                     {
                                         "x":  1195,
                                         "y":  231
                                     },
                                     {
                                         "x":  1275,
                                         "y":  136
                                     },
                                     {
                                         "x":  1271,
                                         "y":  132
                                     },
                                     {
                                         "x":  1106,
                                         "y":  102
                                     },
                                     {
                                         "x":  962,
                                         "y":  108
                                     },
                                     {
                                         "x":  910,
                                         "y":  113
                                     },
                                     {
                                         "x":  747,
                                         "y":  151
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  1215,
                                         "y":  503
                                     },
                                     {
                                         "x":  1210,
                                         "y":  499
                                     },
                                     {
                                         "x":  1160,
                                         "y":  554
                                     },
                                     {
                                         "x":  897,
                                         "y":  476
                                     },
                                     {
                                         "x":  1064,
                                         "y":  306
                                     },
                                     {
                                         "x":  1296,
                                         "y":  381
                                     },
                                     {
                                         "x":  1259,
                                         "y":  448
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  816,
                                         "y":  542
                                     },
                                     {
                                         "x":  908,
                                         "y":  605
                                     },
                                     {
                                         "x":  970,
                                         "y":  550
                                     },
                                     {
                                         "x":  860,
                                         "y":  492
                                     },
                                     {
                                         "x":  809,
                                         "y":  539
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  953,
                                         "y":  652
                                     },
                                     {
                                         "x":  1062,
                                         "y":  723
                                     },
                                     {
                                         "x":  1200,
                                         "y":  643
                                     },
                                     {
                                         "x":  1189,
                                         "y":  607
                                     },
                                     {
                                         "x":  1033,
                                         "y":  575
                                     },
                                     {
                                         "x":  945,
                                         "y":  647
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  952,
                                         "y":  874
                                     },
                                     {
                                         "x":  949,
                                         "y":  868
                                     },
                                     {
                                         "x":  1075,
                                         "y":  835
                                     },
                                     {
                                         "x":  1160,
                                         "y":  749
                                     },
                                     {
                                         "x":  1216,
                                         "y":  758
                                     },
                                     {
                                         "x":  1257,
                                         "y":  811
                                     },
                                     {
                                         "x":  1318,
                                         "y":  829
                                     },
                                     {
                                         "x":  1415,
                                         "y":  837
                                     },
                                     {
                                         "x":  1497,
                                         "y":  849
                                     },
                                     {
                                         "x":  1560,
                                         "y":  855
                                     },
                                     {
                                         "x":  1581,
                                         "y":  860
                                     },
                                     {
                                         "x":  1562,
                                         "y":  815
                                     },
                                     {
                                         "x":  1524,
                                         "y":  805
                                     },
                                     {
                                         "x":  1444,
                                         "y":  788
                                     },
                                     {
                                         "x":  1380,
                                         "y":  775
                                     },
                                     {
                                         "x":  1317,
                                         "y":  756
                                     },
                                     {
                                         "x":  1292,
                                         "y":  720
                                     },
                                     {
                                         "x":  1292,
                                         "y":  720
                                     },
                                     {
                                         "x":  1275,
                                         "y":  685
                                     },
                                     {
                                         "x":  1271,
                                         "y":  645
                                     },
                                     {
                                         "x":  1285,
                                         "y":  611
                                     },
                                     {
                                         "x":  1301,
                                         "y":  575
                                     },
                                     {
                                         "x":  1318,
                                         "y":  525
                                     },
                                     {
                                         "x":  1343,
                                         "y":  490
                                     },
                                     {
                                         "x":  1369,
                                         "y":  451
                                     },
                                     {
                                         "x":  1389,
                                         "y":  417
                                     },
                                     {
                                         "x":  1407,
                                         "y":  381
                                     },
                                     {
                                         "x":  1422,
                                         "y":  345
                                     },
                                     {
                                         "x":  1452,
                                         "y":  331
                                     },
                                     {
                                         "x":  1484,
                                         "y":  327
                                     },
                                     {
                                         "x":  1507,
                                         "y":  327
                                     },
                                     {
                                         "x":  1518,
                                         "y":  302
                                     },
                                     {
                                         "x":  1528,
                                         "y":  246
                                     },
                                     {
                                         "x":  1546,
                                         "y":  197
                                     },
                                     {
                                         "x":  1550,
                                         "y":  182
                                     },
                                     {
                                         "x":  1497,
                                         "y":  159
                                     },
                                     {
                                         "x":  1439,
                                         "y":  146
                                     },
                                     {
                                         "x":  1390,
                                         "y":  136
                                     },
                                     {
                                         "x":  1335,
                                         "y":  124
                                     },
                                     {
                                         "x":  1296,
                                         "y":  120
                                     },
                                     {
                                         "x":  1271,
                                         "y":  128
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  1245,
                                         "y":  276
                                     },
                                     {
                                         "x":  1391,
                                         "y":  314
                                     },
                                     {
                                         "x":  1467,
                                         "y":  212
                                     },
                                     {
                                         "x":  1319,
                                         "y":  167
                                     },
                                     {
                                         "x":  1244,
                                         "y":  277
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  795,
                                         "y":  927
                                     },
                                     {
                                         "x":  812,
                                         "y":  841
                                     },
                                     {
                                         "x":  747,
                                         "y":  770
                                     },
                                     {
                                         "x":  644,
                                         "y":  736
                                     },
                                     {
                                         "x":  496,
                                         "y":  660
                                     },
                                     {
                                         "x":  402,
                                         "y":  585
                                     },
                                     {
                                         "x":  281,
                                         "y":  520
                                     },
                                     {
                                         "x":  196,
                                         "y":  514
                                     },
                                     {
                                         "x":  134,
                                         "y":  509
                                     },
                                     {
                                         "x":  101,
                                         "y":  484
                                     },
                                     {
                                         "x":  101,
                                         "y":  446
                                     },
                                     {
                                         "x":  65,
                                         "y":  387
                                     },
                                     {
                                         "x":  37,
                                         "y":  353
                                     },
                                     {
                                         "x":  5,
                                         "y":  328
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  406,
                                         "y":  126
                                     },
                                     {
                                         "x":  406,
                                         "y":  125
                                     },
                                     {
                                         "x":  305,
                                         "y":  188
                                     },
                                     {
                                         "x":  289,
                                         "y":  238
                                     },
                                     {
                                         "x":  254,
                                         "y":  272
                                     },
                                     {
                                         "x":  253,
                                         "y":  275
                                     },
                                     {
                                         "x":  194,
                                         "y":  280
                                     },
                                     {
                                         "x":  144,
                                         "y":  267
                                     },
                                     {
                                         "x":  103,
                                         "y":  250
                                     },
                                     {
                                         "x":  80,
                                         "y":  240
                                     },
                                     {
                                         "x":  106,
                                         "y":  344
                                     },
                                     {
                                         "x":  147,
                                         "y":  394
                                     },
                                     {
                                         "x":  178,
                                         "y":  424
                                     },
                                     {
                                         "x":  215,
                                         "y":  451
                                     },
                                     {
                                         "x":  247,
                                         "y":  453
                                     },
                                     {
                                         "x":  263,
                                         "y":  433
                                     },
                                     {
                                         "x":  274,
                                         "y":  427
                                     },
                                     {
                                         "x":  267,
                                         "y":  403
                                     },
                                     {
                                         "x":  236,
                                         "y":  374
                                     },
                                     {
                                         "x":  215,
                                         "y":  360
                                     },
                                     {
                                         "x":  196,
                                         "y":  339
                                     },
                                     {
                                         "x":  171,
                                         "y":  319
                                     },
                                     {
                                         "x":  161,
                                         "y":  301
                                     },
                                     {
                                         "x":  140,
                                         "y":  273
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  412,
                                         "y":  469
                                     },
                                     {
                                         "x":  560,
                                         "y":  399
                                     },
                                     {
                                         "x":  645,
                                         "y":  445
                                     },
                                     {
                                         "x":  683,
                                         "y":  490
                                     },
                                     {
                                         "x":  698,
                                         "y":  521
                                     },
                                     {
                                         "x":  668,
                                         "y":  547
                                     },
                                     {
                                         "x":  637,
                                         "y":  562
                                     },
                                     {
                                         "x":  596,
                                         "y":  572
                                     },
                                     {
                                         "x":  550,
                                         "y":  571
                                     },
                                     {
                                         "x":  513,
                                         "y":  550
                                     },
                                     {
                                         "x":  480,
                                         "y":  531
                                     },
                                     {
                                         "x":  458,
                                         "y":  516
                                     },
                                     {
                                         "x":  435,
                                         "y":  492
                                     },
                                     {
                                         "x":  410,
                                         "y":  472
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  855,
                                         "y":  749
                                     },
                                     {
                                         "x":  920,
                                         "y":  812
                                     },
                                     {
                                         "x":  990,
                                         "y":  808
                                     },
                                     {
                                         "x":  1003,
                                         "y":  795
                                     },
                                     {
                                         "x":  991,
                                         "y":  767
                                     },
                                     {
                                         "x":  952,
                                         "y":  741
                                     },
                                     {
                                         "x":  922,
                                         "y":  715
                                     },
                                     {
                                         "x":  882,
                                         "y":  729
                                     },
                                     {
                                         "x":  857,
                                         "y":  746
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  658,
                                         "y":  627
                                     },
                                     {
                                         "x":  787,
                                         "y":  701
                                     },
                                     {
                                         "x":  850,
                                         "y":  648
                                     },
                                     {
                                         "x":  734,
                                         "y":  581
                                     },
                                     {
                                         "x":  654,
                                         "y":  624
                                     }
                                 ]
                  },
                  {
                      "points":  [
                                     {
                                         "x":  749,
                                         "y":  142
                                     },
                                     {
                                         "x":  730,
                                         "y":  104
                                     }
                                 ]
                  }
              ]
});

let config = loadConfig();
const camera = { x: 0, y: 0, w: W / WORLD.zoom, h: H / WORLD.zoom };
const player = {
  x: config.start.x,
  y: config.start.y,
  r: 12,
  w: 57,
  h: 77,
  speed: 190,
  hp: 100,
  maxHp: 100,
  stamina: COMBAT.staminaMax,
  maxStamina: COMBAT.staminaMax,
  facing: 1,
  aimX: 1,
  aimY: 0,
  moving: false,
  attackKind: '',
  attackTimer: 0,
  attackCooldown: 0,
  shootCooldown: 0,
  specialCooldown: 0,
  dashCooldown: 0,
  dashTimer: 0,
  dashVx: 0,
  dashVy: 0,
  invuln: 0,
  meleeCombo: 0,
  meleeComboTimer: 0,
  hurtTimer: 0,
  animTime: 0
};
const ashtar = {
  x: config.ashtarSpawn.x,
  y: config.ashtarSpawn.y,
  r: 11,
  w: 48,
  h: 66,
  speed: 176,
  facing: 1,
  moving: false,
  gathering: false,
  workPointIndex: 0,
  workTimer: 0,
  currentBusIndex: 0,
  animTime: 0,
  follow: true
};
const bella = {
  x: config.bellaSpawn.x,
  y: config.bellaSpawn.y,
  r: 11,
  w: 48,
  h: 66,
  speed: 168,
  facing: 1,
  moving: false,
  active: false,
  shootCooldown: 0,
  shootTimer: 0,
  animTime: 0
};
const state = {
  mode: 'menu',
  previousMode: 'menu',
  last: 0,
  time: 0,
  complete: false,
  phase: requestedPhase,
  phaseTransitioning: false,
  enemies: [],
  projectiles: [],
  upgradePickups: [],
  shockwaves: [],
  pendingShockwaveHits: [],
  particles: [],
  floatingText: [],
  spawnSequence: 0,
  spawnTopOffTimer: 0,
  killsSinceUpgradeDrop: 0,
  upgradeDropsSeen: 0,
  zombieWallPhaseClock: 0,
  shootingUpgrades: createEmptyShootingUpgrades(),
  secondPortionReached: false,
  busDrag: null,
  draftPath: [],
  draftWall: []
};

guardLockedLevel();

const bg = images.get(ASSETS.background);
bg.onload = syncWorldToBackground;
if (bg.complete) syncWorldToBackground();

startBtn.addEventListener('click', startLevel);
resumeBtn?.addEventListener('click', togglePause);
interactBtn.addEventListener('click', tryFinishLevel);
window.addEventListener('keydown', event => {
  if (event.code === 'Escape') {
    togglePause();
    return;
  }
  keys.add(event.code);
  if (event.code === 'KeyE') tryFinishLevel();
});
window.addEventListener('keyup', event => keys.delete(event.code));
canvas.addEventListener('mousemove', event => {
  const rect = canvas.getBoundingClientRect();
  mouse.screenX = ((event.clientX - rect.left) / rect.width) * W;
  mouse.screenY = ((event.clientY - rect.top) / rect.height) * H;
  updateMouseWorld();
  dragBus();
});
canvas.addEventListener('mousedown', handleDevClick);
canvas.addEventListener('click', event => {
  if (devMode) return;
  doEnergyShot();
});
devPanel?.querySelector('.prelevel-dev-head')?.addEventListener('mousedown', startDevPanelDrag);
window.addEventListener('mousemove', dragDevPanel);
window.addEventListener('mouseup', () => {
  stopDevPanelDrag();
  stopBusDrag();
});
devSaveBtn?.addEventListener('click', saveConfig);
devExportBtn?.addEventListener('click', exportConfig);
devResetBtn?.addEventListener('click', resetConfig);
devFinishPathBtn?.addEventListener('click', finishDraftEnemyPath);
devUndoPathBtn?.addEventListener('click', undoDraftEnemyPathPoint);
devClearPathsBtn?.addEventListener('click', clearEnemyPaths);
devSpawnEnemiesBtn?.addEventListener('click', () => {
  if ((devModeSelect?.value || '') === 'phase2EnemyPath') state.phase = 2;
  spawnEnemiesFromPaths();
  updateDevStatus('Spawned enemies');
});
devClearEnemiesBtn?.addEventListener('click', () => {
  state.enemies = [];
  updateDevStatus('Cleared enemies');
});
devEnemyTotal?.addEventListener('change', () => {
  config.spawnTotal = clamp(Number.parseInt(devEnemyTotal.value, 10) || 0, 0, 80);
  devEnemyTotal.value = String(config.spawnTotal);
  updateDevStatus('Updated zombie total');
});
devImportBtn?.addEventListener('click', importConfig);

if (devMode && devPanel) {
  devPanel.hidden = false;
  syncDevControls();
  updateDevStatus();
}

if (!devMode && requestedPhase === 2) startLevel();

requestAnimationFrame(loop);

function guardLockedLevel() {
  if (devMode) return;
  if (getHighestUnlockedLevel() >= 2) return;
  window.location.href = 'map.html';
}

function getHighestUnlockedLevel() {
  try {
    const saved = Number.parseInt(localStorage.getItem(PROGRESS_STORAGE_KEY), 10);
    return Number.isInteger(saved) ? clamp(saved, 1, 4) : 1;
  } catch (error) {
    return 1;
  }
}

function startLevel() {
  state.mode = 'playing';
  state.previousMode = 'playing';
  overlay.classList.remove('show');
  pauseOverlay?.classList.remove('show');
  state.phase = getStartingPhase();
  if (state.phase < 2) clearPhaseResume();
  state.phaseTransitioning = false;
  syncWorldToBackground();
  resetActors();
  if (state.phase >= 2) startPhase2({ fromLoad: true });
}

function getStartingPhase() {
  if (devMode) return requestedPhase;
  if (requestedPhase === 2) return 2;
  return 1;
}

function togglePause() {
  if (state.mode === 'menu') return;
  if (state.mode === 'paused') {
    state.mode = state.previousMode || 'playing';
    pauseOverlay?.classList.remove('show');
    return;
  }
  state.previousMode = state.mode;
  state.mode = 'paused';
  keys.clear();
  pauseOverlay?.classList.add('show');
}

function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - state.last) / 1000 || 0);
  state.last = timestamp;
  try {
    state.time += dt;
    if (state.mode === 'playing') update(dt);
    updateCamera();
    updateMouseWorld();
    draw();
  } catch (error) {
    recoverFromLoopError(error);
  }
  requestAnimationFrame(loop);
}

function recoverFromLoopError(error) {
  console.error('Level 2 loop recovered after error:', error);
  window.__level2LastLoopError = {
    message: error?.message || String(error),
    stack: error?.stack || ''
  };
  state.projectiles = [];
  state.shockwaves = [];
  state.pendingShockwaveHits = [];
  state.upgradePickups = state.upgradePickups.filter(isValidUpgradePickup);
  state.particles = [];
  state.floatingText = [];
  player.attackKind = '';
  player.attackTimer = 0;
}

function update(dt) {
  syncWorldToBackground();
  state.zombieWallPhaseClock += dt;
  updatePlayer(dt);
  updateAshtar(dt);
  updateBella(dt);
  updatePhaseTrigger();
  updateEnemies(dt);
  updateEnemySpawns(dt);
  updateProjectiles(dt);
  updateUpgradePickups(dt);
  updateShockwaves(dt);
  updatePendingShockwaveHits();
  updateParticles(dt);
  updateFloatingText(dt);
  updateHud();
}

function syncWorldToBackground() {
  if (!bg?.naturalWidth || !bg?.naturalHeight) return;
  if (WORLD.width === bg.naturalWidth && WORLD.height === bg.naturalHeight) return;
  WORLD.width = bg.naturalWidth;
  WORLD.height = bg.naturalHeight;
  clampConfigToWorld();
}

function updatePlayer(dt) {
  let mx = 0;
  let my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
  const len = Math.hypot(mx, my) || 1;
  const dash = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const upgradeStats = getPhaseTwoShootingStats();
  const moveSpeed = player.speed + upgradeStats.playerMoveSpeedBonus;
  if (dash) doDash(mx / len, my / len);
  if (player.dashTimer > 0) {
    moveCircleWithWalls(player, player.dashVx * dt, player.dashVy * dt);
    player.dashTimer = Math.max(0, player.dashTimer - dt);
  } else {
    moveCircleWithWalls(player, (mx / len) * moveSpeed * dt, (my / len) * moveSpeed * dt);
  }
  player.moving = mx !== 0 || my !== 0;
  updateAim(mx, my);
  if (keys.has('KeyQ')) doEnergyShot();
  if (keys.has('KeyJ')) doMeleeAttack();
  if (keys.has('Space')) doSpecial();
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  player.specialCooldown = Math.max(0, player.specialCooldown - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.stamina = clamp(player.stamina + (COMBAT.staminaRegen + upgradeStats.staminaRegenBonus) * dt, 0, player.maxStamina);
  player.meleeComboTimer = Math.max(0, player.meleeComboTimer - dt);
  if (player.meleeComboTimer <= 0) player.meleeCombo = 0;
  if (player.attackTimer <= 0) player.attackKind = '';
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.animTime += dt;
}

function updateAim(mx, my) {
  const dx = mouse.worldX - player.x;
  const dy = mouse.worldY - player.y;
  const len = Math.hypot(dx, dy) || 1;
  player.aimX = dx / len;
  player.aimY = dy / len;
  player.facing = dx >= 0 ? 1 : -1;
  if (Math.abs(dx) <= 6 && (mx !== 0 || my !== 0)) {
    player.aimX = mx;
    player.aimY = my;
    player.facing = mx >= 0 ? 1 : -1;
  }
}

function doEnergyShot() {
  if (state.mode !== 'playing' || player.shootCooldown > 0 || player.attackTimer > 0) return;
  const upgradeStats = getPhaseTwoShootingStats();
  const shootCost = upgradeStats.playerShootCost;
  if (player.stamina < shootCost) return;
  player.stamina = Math.max(0, player.stamina - shootCost);
  player.attackKind = 'shoot';
  player.attackTimer = 0.34;
  player.animTime = 0;
  player.shootCooldown = upgradeStats.playerCooldown;
  const dx = player.aimX || player.facing;
  const dy = player.aimY || 0;
  state.projectiles.push({
    x: player.x + dx * 22,
    y: player.y - 18 + dy * 16,
    vx: dx * upgradeStats.playerSpeed,
    vy: dy * upgradeStats.playerSpeed,
    r: upgradeStats.playerRadius,
    damage: upgradeStats.playerDamage,
    life: 0.85,
    pierce: upgradeStats.playerPierce,
    chain: upgradeStats.playerChain,
    splashRadius: upgradeStats.playerSplashRadius,
    splashDamage: upgradeStats.playerSplashDamage,
    kind: 'magic'
  });
  addMagicMuzzleBurst(player.x + dx * 22, player.y - 18 + dy * 16, dx, dy);
}

function doMeleeAttack() {
  if (state.mode !== 'playing' || player.attackCooldown > 0 || player.attackTimer > 0) return;
  const isKick = player.meleeCombo >= 2;
  const staminaCost = isKick ? COMBAT.kickCost : COMBAT.punchCost;
  if (player.stamina < staminaCost) return;
  player.stamina = Math.max(0, player.stamina - staminaCost);
  player.attackKind = isKick ? 'kick' : 'punch';
  player.attackTimer = isKick ? 0.46 : 0.32;
  player.animTime = 0;
  player.attackCooldown = isKick ? COMBAT.kickCooldown : COMBAT.punchCooldown;
  player.meleeCombo = isKick ? 0 : player.meleeCombo + 1;
  player.meleeComboTimer = 1.15;
  hitMeleeEnemies(isKick);
}

function hitMeleeEnemies(isKick) {
  const reach = isKick ? 66 : 50;
  const damage = isKick ? COMBAT.kickDamage : COMBAT.punchDamage;
  const cx = player.x + player.facing * reach;
  const cy = player.y - 18;
  let hitAny = false;
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    if (dist(cx, cy, enemy.x, enemy.y) <= reach + enemy.r) {
      hitAny = true;
      damageEnemy(enemy, damage, isKick ? '#ffd166' : '#ffffff');
    }
  }
  addMeleeEffect(cx, cy, isKick, hitAny);
}

function doSpecial() {
  if (state.mode !== 'playing' || player.specialCooldown > 0 || player.stamina < COMBAT.shockwaveCost) return;
  player.stamina = Math.max(0, player.stamina - COMBAT.shockwaveCost);
  player.specialCooldown = COMBAT.shockwaveCooldown;
  player.attackKind = 'shockwave';
  player.attackTimer = 0.45;
  player.animTime = 0;
  state.shockwaves = state.shockwaves.filter(wave => wave.life > 0).slice(-2);
  state.shockwaves.push({ x: player.x, y: player.y - 18, radius: COMBAT.shockwaveRadius, life: 0.46, maxLife: 0.46 });
  addShockwaveParticles(player.x, player.y - 18);
  addFloatingText(player.x, player.y - 62, 'SHOCKWAVE', '#b8f3ff', 0.58, -20);
  state.spawnTopOffTimer = Math.max(state.spawnTopOffTimer, 1.2);
  const radiusSq = COMBAT.shockwaveRadius * COMBAT.shockwaveRadius;
  const enemiesHit = [];
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.remove) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    if (dx * dx + dy * dy <= radiusSq) enemiesHit.push(enemy);
    if (enemiesHit.length >= MAX_SHOCKWAVE_TARGETS_PER_USE) break;
  }
  state.pendingShockwaveHits.push({
    x: player.x,
    y: player.y,
    damage: COMBAT.shockwaveDamage,
    targets: enemiesHit,
    hitCount: 0,
    deathEffects: 0
  });
  if (enemiesHit.length >= MAX_SHOCKWAVE_TARGETS_PER_USE) {
    addFloatingText(player.x, player.y - 84, `${enemiesHit.length}+ hit`, '#b8f3ff', 0.55, -18);
  }
}

function doDash(mx, my) {
  if (state.mode !== 'playing' || player.dashCooldown > 0 || player.dashTimer > 0) return;
  if (player.stamina < COMBAT.dashCost) return;
  let dx = mx;
  let dy = my;
  if (Math.hypot(dx, dy) < 0.2) {
    dx = player.aimX || player.facing;
    dy = player.aimY || 0;
  }
  const len = Math.hypot(dx, dy) || 1;
  player.stamina = Math.max(0, player.stamina - COMBAT.dashCost);
  player.dashCooldown = COMBAT.dashCooldown;
  player.dashTimer = COMBAT.dashTime;
  player.invuln = COMBAT.dashInvuln;
  player.dashVx = (dx / len) * COMBAT.dashSpeed;
  player.dashVy = (dy / len) * COMBAT.dashSpeed;
  addDashBurst(player.x, player.y, -dx / len, -dy / len);
}

function updateAshtar(dt) {
  if (state.phase >= 2 && config.buses.length) {
    updateAshtarBusWork(dt);
    ashtar.animTime += dt;
    return;
  }
  ashtar.gathering = false;
  ashtar.follow = true;
  const target = getFollowTarget();
  moveActorToward(ashtar, target.x, target.y, ashtar.speed, dt);
  ashtar.animTime += dt;
}

function updateAshtarBusWork(dt) {
  const bus = getActiveRepairBus();
  if (!bus) return;
  const workPoints = getBusWorkPoints(bus);
  const target = workPoints[ashtar.workPointIndex % workPoints.length];
  ashtar.follow = false;
  const arrived = moveActorToward(ashtar, target.x, target.y, ashtar.speed, dt, { ignoreWalls: true });
  ashtar.gathering = arrived;
  if (!arrived) return;
  ashtar.workTimer += dt;
  ashtar.facing = bus.x >= ashtar.x ? 1 : -1;
  if (ashtar.workTimer < ASHTAR_BUS_REPAIR_STAGE_TIME) return;
  ashtar.workTimer = 0;
  ashtar.workPointIndex++;
  bus.stage = clamp((Number.parseInt(bus.stage, 10) || 1) + 1, 1, ASSETS.bus.length);
  if (bus.stage >= ASSETS.bus.length && config.buses.length > 1) ashtar.currentBusIndex = (ashtar.currentBusIndex + 1) % config.buses.length;
  addFloatingText(bus.x, bus.y - bus.h * 0.62, `Bus ${bus.stage}/4`, '#ffd166', 1.2, -24);
  if (areAllBusesFixed()) completeLevel2();
}

function getActiveRepairBus() {
  if (!config.buses.length) return null;
  return config.buses[ashtar.currentBusIndex % config.buses.length] || config.buses[0];
}

function getBusWorkPoints(bus) {
  if (config.ashtarWorkPoints.length) {
    return config.ashtarWorkPoints.map(point => ({
      x: clamp(point.x, ashtar.r, WORLD.width - ashtar.r),
      y: clamp(point.y, ashtar.r, WORLD.height - ashtar.r)
    }));
  }
  const insetX = bus.w * 0.58;
  const insetY = bus.h * 0.48;
  return [
    { x: bus.x - insetX, y: bus.y },
    { x: bus.x + insetX, y: bus.y },
    { x: bus.x, y: bus.y - insetY },
    { x: bus.x, y: bus.y + insetY }
  ].map(point => ({
    x: clamp(point.x, ashtar.r, WORLD.width - ashtar.r),
    y: clamp(point.y, ashtar.r, WORLD.height - ashtar.r)
  }));
}

function updateBella(dt) {
  bella.active = state.phase >= 2;
  if (!bella.active) return;
  const followTarget = getBellaFollowTarget();
  const distanceFromPlayer = dist(bella.x, bella.y, followTarget.x, followTarget.y);
  if (distanceFromPlayer > 18) moveActorToward(bella, followTarget.x, followTarget.y, bella.speed, dt);
  else bella.moving = false;
  bella.shootCooldown = Math.max(0, bella.shootCooldown - dt);
  bella.shootTimer = Math.max(0, bella.shootTimer - dt);
  if (bella.shootCooldown <= 0) shootBellaTarget();
  bella.animTime += dt;
}

function getBellaFollowTarget() {
  const offsetX = player.facing >= 0 ? -22 : 22;
  return {
    x: clamp(player.x + offsetX, bella.r, WORLD.width - bella.r),
    y: clamp(player.y + 6, bella.r, WORLD.height - bella.r)
  };
}

function shootBellaTarget() {
  const target = state.enemies
    .filter(enemy => !enemy.dead && !isLineBlocked(bella.x, bella.y, enemy.x, enemy.y))
    .sort((a, b) => dist(bella.x, bella.y, a.x, a.y) - dist(bella.x, bella.y, b.x, b.y))[0];
  if (!target || dist(bella.x, bella.y, target.x, target.y) > 420) return;
  const dx = target.x - bella.x;
  const dy = target.y - bella.y;
  const len = Math.hypot(dx, dy) || 1;
  const upgradeStats = getPhaseTwoShootingStats();
  bella.facing = dx >= 0 ? 1 : -1;
  bella.shootCooldown = upgradeStats.bellaCooldown;
  bella.shootTimer = 0.32;
  bella.animTime = 0;
  state.projectiles.push({
    x: bella.x + (dx / len) * 20,
    y: bella.y - 18 + (dy / len) * 12,
    vx: (dx / len) * 560,
    vy: (dy / len) * 560,
    r: 5,
    damage: upgradeStats.bellaDamage,
    life: 0.9,
    pierce: 0,
    kind: 'bella'
  });
}

function updatePhaseTrigger() {
  if (devMode || state.phase >= 2 || state.phaseTransitioning) return;
  if (dist(player.x, player.y, config.phase2Trigger.x, config.phase2Trigger.y) > 54) return;
  state.phaseTransitioning = true;
  try {
    sessionStorage.setItem(PHASE_STORAGE_KEY, '2');
    sessionStorage.setItem(PHASE_RETURN_STORAGE_KEY, JSON.stringify({ x: player.x, y: player.y }));
  } catch (error) {
    // Phase resume is best-effort when session storage is unavailable.
  }
  const next = encodeURIComponent('level2.html?phase=2');
  window.location.href = `video.html?src=${encodeURIComponent('assets/videos/2.mp4')}&next=${next}`;
}

function startPhase2(options = {}) {
  state.phase = 2;
  state.phaseTransitioning = false;
  state.secondPortionReached = false;
  config.buses.forEach(bus => {
    bus.stage = 1;
  });
  const bus = getActiveRepairBus();
  if (bus) {
    ashtar.x = bus.x;
    ashtar.y = bus.y;
    ashtar.workPointIndex = 0;
    ashtar.workTimer = 0;
    ashtar.currentBusIndex = config.buses.indexOf(bus);
    ashtar.gathering = false;
    ashtar.moving = false;
  }
  bella.active = true;
  bella.x = config.bellaSpawn.x;
  bella.y = config.bellaSpawn.y;
  if (options.fromLoad) {
    const returnPoint = getPhase2ReturnPoint();
    player.x = returnPoint.x;
    player.y = returnPoint.y;
  }
  state.enemies = [];
  state.projectiles = [];
  state.spawnSequence = 0;
  state.spawnTopOffTimer = 0;
  if (!devMode && !options.skipSpawn) spawnEnemiesFromPaths();
  if (!options.fromLoad) addFloatingText(config.defensePoint.x, config.defensePoint.y - 36, 'DEFEND', '#ff70a6', 1.0, -26);
}

function getPhase2ReturnPoint() {
  try {
    const point = JSON.parse(sessionStorage.getItem(PHASE_RETURN_STORAGE_KEY) || 'null');
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) return sanitizePoint(point, config.phase2Trigger);
  } catch (error) {
    // Fall through to trigger point.
  }
  return { ...config.phase2Trigger };
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.phasing = areZombiesPhasingThroughWalls();
    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    enemy.target = getEnemyCombatTarget(enemy);
    enemy.mode = enemy.target ? 'chase' : 'path';
    if (enemy.mode === 'chase') updateChasingEnemy(enemy, dt);
    else updatePathingEnemy(enemy, dt);
    enemy.animTime += dt;
  }
  state.enemies = state.enemies.filter(enemy => !enemy.remove);
}

function updateEnemySpawns(dt) {
  if (devMode) return;
  if (state.pendingShockwaveHits.length) return;
  if (state.phase < 2 && state.secondPortionReached) return;
  if (state.phase < 2 && hasReachedSecondPortion()) {
    state.secondPortionReached = true;
    return;
  }
  state.spawnTopOffTimer -= dt;
  if (state.spawnTopOffTimer > 0) return;
  state.spawnTopOffTimer = 0.35;
  const aliveCount = state.enemies.filter(enemy => !enemy.dead && !enemy.remove).length;
  if (aliveCount < config.spawnTotal) spawnMissingEnemies(config.spawnTotal - aliveCount);
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    const lastX = projectile.x;
    const lastY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.kind === 'magic') addMagicTrail(projectile.x, projectile.y, lastX, lastY);
    if (projectile.x < 0 || projectile.x > WORLD.width || projectile.y < 0 || projectile.y > WORLD.height) {
      addMagicImpact(clamp(projectile.x, 0, WORLD.width), clamp(projectile.y, 0, WORLD.height));
      projectile.life = 0;
    }
    if (projectile.kind !== 'magic' && projectile.kind !== 'bella' && circleHitsWalls(projectile.x, projectile.y, projectile.r)) {
      addMagicImpact(projectile.x, projectile.y);
      projectile.life = 0;
    }
    if (projectile.life <= 0) continue;
    if (!projectile.hitEnemies) projectile.hitEnemies = new Set();
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (projectile.hitEnemies.has(enemy)) continue;
      if (dist(projectile.x, projectile.y, enemy.x, enemy.y) <= projectile.r + enemy.r) {
        projectile.hitEnemies.add(enemy);
        damageEnemy(enemy, projectile.damage, '#5dd8ff');
        addMagicImpact(projectile.x, projectile.y);
        if (projectile.kind === 'magic') {
          damageSplashEnemies(projectile, enemy);
          spawnChainProjectile(projectile, enemy);
        }
        projectile.life = projectile.pierce > 0 ? projectile.life : 0;
        if (projectile.pierce > 0) projectile.pierce--;
        break;
      }
    }
  }
  state.projectiles = state.projectiles.filter(projectile => projectile.life > 0);
}

function damageSplashEnemies(projectile, directHit) {
  const radius = projectile.splashRadius || 0;
  const damage = projectile.splashDamage || 0;
  if (radius <= 0 || damage <= 0) return;
  let hits = 0;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.remove || enemy === directHit) continue;
    if (projectile.hitEnemies?.has(enemy)) continue;
    if (dist(projectile.x, projectile.y, enemy.x, enemy.y) > radius + enemy.r) continue;
    damageEnemy(enemy, damage, '#39f5a8', { quiet: hits > 1 });
    addHitBurst(enemy.x, enemy.y - enemy.h * 0.35, '#39f5a8');
    hits++;
    if (hits >= 5) break;
  }
  if (hits > 0) addImpactBloom(projectile.x, projectile.y, radius, '#39f5a8');
}

function spawnChainProjectile(projectile, directHit) {
  if ((projectile.chain || 0) <= 0) return;
  const target = getNearestChainTarget(projectile.x, projectile.y, projectile.hitEnemies, directHit);
  if (!target) return;
  const dx = target.x - projectile.x;
  const dy = target.y - projectile.y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = Math.max(360, Math.hypot(projectile.vx, projectile.vy) * 0.82);
  const hitEnemies = new Set(projectile.hitEnemies || []);
  state.projectiles.push({
    x: projectile.x,
    y: projectile.y,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    r: Math.max(3.2, projectile.r * 0.66),
    damage: Math.max(8, projectile.damage * 0.62),
    life: 0.38,
    pierce: 0,
    chain: projectile.chain - 1,
    splashRadius: Math.max(0, (projectile.splashRadius || 0) * 0.55),
    splashDamage: Math.max(0, (projectile.splashDamage || 0) * 0.55),
    kind: 'magic',
    hitEnemies
  });
  addChainArc(projectile.x, projectile.y, target.x, target.y);
}

function getNearestChainTarget(x, y, hitEnemies, directHit) {
  let best = null;
  let bestDistance = 165;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.remove || enemy === directHit) continue;
    if (hitEnemies?.has(enemy)) continue;
    const distance = dist(x, y, enemy.x, enemy.y);
    if (distance < bestDistance) {
      best = enemy;
      bestDistance = distance;
    }
  }
  return best;
}

function updateUpgradePickups(dt) {
  if (devMode || state.phase < 2 || state.complete) return;
  for (const pickup of state.upgradePickups) {
    if (!isValidUpgradePickup(pickup)) {
      pickup.dead = true;
      continue;
    }
    pickup.life -= dt;
    pickup.pulse += dt;
    pickup.spin = (pickup.spin || 0) + dt * (1.4 + getUpgradeTierDef(pickup.tier).power * 0.22);
    pickup.sparkTimer = Math.max(0, (pickup.sparkTimer || 0) - dt);
    if (pickup.life <= 0) {
      pickup.dead = true;
      addUpgradeFizzle(pickup.x, pickup.y, getUpgradePickupColor(pickup));
      continue;
    }
    const distanceToPlayer = dist(player.x, player.y, pickup.x, pickup.y);
    if (distanceToPlayer <= pickup.r + player.r + PHASE_TWO_UPGRADE_COLLECT_RADIUS) {
      collectUpgradePickup(pickup);
      continue;
    }
    if (distanceToPlayer <= PHASE_TWO_UPGRADE_MAGNET_RADIUS) {
      const pull = clamp(1 - distanceToPlayer / PHASE_TWO_UPGRADE_MAGNET_RADIUS, 0.12, 1);
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = (PHASE_TWO_UPGRADE_MAGNET_SPEED + pull * 170) * pull;
      pickup.x += (dx / len) * speed * dt;
      pickup.y += (dy / len) * speed * dt;
      pickup.magnet = clamp((pickup.magnet || 0) + dt * 3.5, 0, 1);
      if (pickup.sparkTimer <= 0) {
        pickup.sparkTimer = 0.08;
        addParticle({
          x: pickup.x + rand(-5, 5),
          y: pickup.y + rand(-5, 5),
          vx: rand(-18, 18),
          vy: rand(-18, 18),
          r: rand(1.4, 3.2),
          color: getUpgradePickupColor(pickup),
          life: rand(0.14, 0.26),
          alpha: 0.72,
          layer: 'front'
        });
      }
    } else {
      pickup.magnet = Math.max(0, (pickup.magnet || 0) - dt * 1.8);
    }
  }
  state.upgradePickups = state.upgradePickups.filter(pickup => isValidUpgradePickup(pickup) && !pickup.dead && pickup.life > 0);
}

function maybeDropPhaseTwoUpgrade(x, y) {
  if (devMode || state.phase < 2 || state.complete) return;
  state.upgradePickups = state.upgradePickups.filter(pickup => isValidUpgradePickup(pickup) && !pickup.dead && pickup.life > 0);
  if (state.upgradePickups.length >= PHASE_TWO_MAX_UPGRADES_ON_FIELD) {
    state.killsSinceUpgradeDrop = Math.min(state.killsSinceUpgradeDrop + 1, PHASE_TWO_UPGRADE_PITY_KILLS);
    return;
  }
  state.killsSinceUpgradeDrop++;
  const guaranteed = state.killsSinceUpgradeDrop >= PHASE_TWO_UPGRADE_PITY_KILLS;
  const chance = PHASE_TWO_UPGRADE_DROP_CHANCE + Math.min(0.18, state.killsSinceUpgradeDrop * 0.045);
  if (!guaranteed && Math.random() > chance) return;
  state.killsSinceUpgradeDrop = 0;
  spawnPhaseTwoUpgradeAt(x, y, guaranteed);
}

function spawnPhaseTwoUpgradeAt(x, y, guaranteed = false) {
  const tier = rollUpgradeTier(guaranteed);
  const upgrade = choosePhaseTwoUpgrade(tier);
  if (!upgrade) return;
  const point = getUpgradeSpawnPoint(x, y);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
  const tierDef = getUpgradeTierDef(tier);
  state.upgradeDropsSeen++;
  state.upgradePickups.push({
    x: point.x,
    y: point.y,
    r: 8,
    life: PHASE_TWO_UPGRADE_LIFETIME + tierDef.power * 2,
    maxLife: PHASE_TWO_UPGRADE_LIFETIME + tierDef.power * 2,
    pulse: Math.random() * 10,
    spin: Math.random() * Math.PI * 2,
    sparkTimer: 0,
    magnet: 0,
    tier,
    upgrade
  });
  addFloatingText(point.x, point.y - 28, `${tierDef.shortLabel} ${upgrade.shortLabel || 'UP'}`, getUpgradePickupColor({ upgrade, tier }), 0.9, -18);
  addUpgradeDropBurst(point.x, point.y, getUpgradePickupColor({ upgrade, tier }), tier);
}

function isValidUpgradePickup(pickup) {
  return Boolean(
    pickup &&
    Number.isFinite(pickup.x) &&
    Number.isFinite(pickup.y) &&
    Number.isFinite(pickup.r) &&
    Number.isFinite(pickup.life) &&
    typeof pickup.tier === 'string' &&
    pickup.upgrade &&
    typeof pickup.upgrade === 'object'
  );
}

function getUpgradeSpawnPoint(x, y) {
  const anchor = { x, y };
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = i === 0 ? 0 : rand(10, 34);
    const point = {
      x: clamp(anchor.x + Math.cos(angle) * radius, 30, WORLD.width - 30),
      y: clamp(anchor.y + Math.sin(angle) * radius, 30, WORLD.height - 30)
    };
    if (!circleHitsWalls(point.x, point.y, 14) && isUpgradePointClear(point)) return point;
  }
  return {
    x: clamp(anchor.x, 30, WORLD.width - 30),
    y: clamp(anchor.y, 30, WORLD.height - 30)
  };
}

function isUpgradePointClear(point) {
  return state.upgradePickups.every(pickup => {
    if (!isValidUpgradePickup(pickup) || pickup.dead) return true;
    return dist(point.x, point.y, pickup.x, pickup.y) >= PHASE_TWO_UPGRADE_MIN_SPACING;
  });
}

function collectUpgradePickup(pickup) {
  pickup.dead = true;
  applyUpgradePickup(pickup);
  const tierDef = getUpgradeTierDef(pickup.tier);
  const color = getUpgradePickupColor(pickup);
  addFloatingText(player.x, player.y - 50, `${tierDef.label} ${pickup.upgrade.label}`, color, 1.08, -25);
  addUpgradeBurst(pickup.x, pickup.y, color, pickup.tier);
}

function applyUpgradePickup(pickup) {
  const upgrade = pickup.upgrade;
  if (upgrade.stat) {
    const amount = getUpgradeTierPower(pickup.tier, upgrade);
    const added = addUpgradeStacks(upgrade.stat, amount, upgrade.maxStacks);
    if (upgrade.stat === 'playerBattery') syncPlayerEnergyStats();
    if (added <= 0) {
      player.hp = clamp(player.hp + 14, 0, player.maxHp);
      player.stamina = clamp(player.stamina + 22, 0, player.maxStamina);
    }
    return;
  }
  if (typeof upgrade.apply === 'function') upgrade.apply(pickup);
}

function addUpgradeStacks(stat, amount, maxStacks = 99) {
  const before = Number.isFinite(state.shootingUpgrades[stat]) ? state.shootingUpgrades[stat] : 0;
  const after = clamp(before + amount, 0, maxStacks);
  state.shootingUpgrades[stat] = after;
  return after - before;
}

function rollUpgradeTier(guaranteed = false) {
  const luck = Math.min(16, Math.floor((state.upgradeDropsSeen || 0) / 3) * 2 + (guaranteed ? 7 : 0));
  const weights = [
    ['common', Math.max(35, PHASE_TWO_UPGRADE_TIERS.common.weight - luck)],
    ['rare', PHASE_TWO_UPGRADE_TIERS.rare.weight + luck * 0.72],
    ['epic', PHASE_TWO_UPGRADE_TIERS.epic.weight + luck * 0.28]
  ];
  return weightedPick(weights) || 'common';
}

function choosePhaseTwoUpgrade(tier) {
  const weighted = PHASE_TWO_UPGRADES
    .map(upgrade => [upgrade, getUpgradeDropWeight(upgrade, tier)])
    .filter(([, weight]) => weight > 0);
  return weightedPick(weighted) || PHASE_TWO_UPGRADES[0];
}

function getUpgradeDropWeight(upgrade, tier) {
  let weight = upgrade.weight || 1;
  if (upgrade.stat) {
    const stacks = state.shootingUpgrades[upgrade.stat] || 0;
    if (Number.isFinite(upgrade.maxStacks) && stacks >= upgrade.maxStacks) return 0;
    if (Number.isFinite(upgrade.maxStacks)) {
      const remaining = upgrade.maxStacks - stacks;
      if (remaining <= 1) weight *= 0.45;
      else if (remaining <= 2) weight *= 0.72;
    }
  }
  if (upgrade.id === 'field-mender') {
    const hpNeed = clamp((player.maxHp - player.hp) / player.maxHp, 0, 1);
    const staminaNeed = clamp((player.maxStamina - player.stamina) / player.maxStamina, 0, 1);
    weight *= 0.35 + hpNeed * 2.6 + staminaNeed * 0.85;
  }
  if (upgrade.stat === 'bellaDamage' || upgrade.stat === 'bellaRate') {
    weight *= state.enemies.length >= 10 ? 1.25 : 0.88;
  }
  if (tier === 'epic' && upgrade.instant) weight *= 0.62;
  return weight;
}

function weightedPick(weightedItems) {
  const total = weightedItems.reduce((sum, item) => sum + Math.max(0, item[1] || 0), 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const [item, weight] of weightedItems) {
    roll -= Math.max(0, weight || 0);
    if (roll <= 0) return item;
  }
  return weightedItems[weightedItems.length - 1]?.[0] || null;
}

function getUpgradeTierPower(tier, upgrade = null) {
  const custom = upgrade?.tierPower?.[tier];
  if (Number.isFinite(custom)) return custom;
  return getUpgradeTierDef(tier).power;
}

function getUpgradeTierDef(tier) {
  return PHASE_TWO_UPGRADE_TIERS[tier] || PHASE_TWO_UPGRADE_TIERS.common;
}

function getUpgradePickupColor(pickup) {
  return pickup?.upgrade?.color || getUpgradeTierDef(pickup?.tier).color || '#5dd8ff';
}

function getPhaseTwoShootingStats() {
  const upgrades = state.shootingUpgrades;
  return {
    playerDamage: COMBAT.bulletDamage + upgrades.playerDamage * 7,
    playerCooldown: Math.max(0.13, COMBAT.shootCooldown - upgrades.playerRate * 0.028),
    playerPierce: upgrades.playerPierce,
    playerRadius: 4.2 + upgrades.playerSize * 0.72 + upgrades.playerSplash * 0.18,
    playerSpeed: COMBAT.bulletSpeed + upgrades.playerRate * 24 + upgrades.playerMobility * 12,
    playerShootCost: Math.max(4, COMBAT.shootCost - upgrades.playerBattery * 0.9 - upgrades.playerRate * 0.32),
    playerMoveSpeedBonus: upgrades.playerMobility * 7,
    staminaRegenBonus: upgrades.playerBattery * 2.8,
    playerChain: Math.min(4, upgrades.playerChain),
    playerSplashRadius: upgrades.playerSplash > 0 ? 38 + upgrades.playerSplash * 10 : 0,
    playerSplashDamage: upgrades.playerSplash > 0 ? 5 + upgrades.playerSplash * 3 + upgrades.playerDamage * 1.2 : 0,
    bellaDamage: 18 + upgrades.bellaDamage * 6,
    bellaCooldown: Math.max(0.32, 0.78 - upgrades.bellaRate * 0.058)
  };
}

function createEmptyShootingUpgrades() {
  return {
    playerDamage: 0,
    playerRate: 0,
    playerPierce: 0,
    playerSize: 0,
    playerSplash: 0,
    playerChain: 0,
    playerBattery: 0,
    playerMobility: 0,
    bellaDamage: 0,
    bellaRate: 0
  };
}

function syncPlayerEnergyStats() {
  player.maxStamina = COMBAT.staminaMax + state.shootingUpgrades.playerBattery * 7;
  player.stamina = clamp(player.stamina + 10, 0, player.maxStamina);
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
  while (processed < MAX_SHOCKWAVE_HITS_PER_FRAME && batch.targets.length) {
    const enemy = batch.targets.shift();
    if (!enemy || enemy.dead || enemy.remove) continue;
    batch.hitCount++;
    processed++;
    const canShowDeathEffects = batch.deathEffects < MAX_SHOCKWAVE_DEATH_EFFECTS;
    damageEnemy(enemy, batch.damage, '#b8f3ff', { quiet: batch.hitCount > 4, deathEffects: canShowDeathEffects });
    if (enemy.dead || enemy.remove) {
      if (canShowDeathEffects) batch.deathEffects++;
      continue;
    }
    const dx = enemy.x - batch.x;
    const dy = enemy.y - batch.y;
    const len = Math.hypot(dx, dy) || 1;
    moveCircleFreely(enemy, (dx / len) * 22, (dy / len) * 22);
  }
  if (!batch.targets.length) state.pendingShockwaveHits.shift();
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.08, dt);
    particle.vy *= Math.pow(0.08, dt);
    particle.life -= dt;
  }
  state.particles = state.particles.filter(particle => particle.life > 0);
  if (state.particles.length > MAX_PARTICLES) state.particles.splice(0, state.particles.length - MAX_PARTICLES);
}

function updateFloatingText(dt) {
  for (const text of state.floatingText) {
    text.y += text.vy * dt;
    text.life -= dt;
  }
  state.floatingText = state.floatingText.filter(text => text.life > 0);
  if (state.floatingText.length > MAX_FLOATING_TEXT) state.floatingText.splice(0, state.floatingText.length - MAX_FLOATING_TEXT);
}

function damageEnemy(enemy, amount, color = '#ffffff', options = {}) {
  enemy.hp -= amount;
  enemy.mode = 'chase';
  if (!options.quiet) {
    addHitBurst(enemy.x, enemy.y - enemy.h * 0.35, color);
    addFloatingText(enemy.x, enemy.y - enemy.h * 0.72, String(Math.round(amount)), color);
  }
  if (enemy.hp <= 0) {
    maybeDropPhaseTwoUpgrade(enemy.x, enemy.y);
    enemy.dead = true;
    enemy.remove = true;
    if (options.deathEffects !== false) addDefeatBurst(enemy.x, enemy.y - enemy.h * 0.32);
  }
}

function updatePathingEnemy(enemy, dt) {
  const target = enemy.path[enemy.pathIndex];
  if (!target) {
    enemy.moving = false;
    return;
  }
  const arrived = moveActorToward(enemy, target.x, target.y, enemy.speed, dt);
  if (arrived) {
    if (state.phase >= 2 && enemy.pathIndex >= enemy.path.length - 1) enemy.pathIndex = 0;
    else enemy.pathIndex = Math.min(enemy.pathIndex + 1, enemy.path.length - 1);
  }
}

function updateChasingEnemy(enemy, dt) {
  const target = enemy.target || getEnemyCombatTarget(enemy);
  if (!target) {
    updatePathingEnemy(enemy, dt);
    return;
  }
  if (isEnemyTouchingTarget(enemy, target)) {
    enemy.moving = false;
    enemy.attacking = true;
    enemy.facing = target.x >= enemy.x ? 1 : -1;
    if (enemy.attackTimer <= 0) {
      enemy.attackTimer = 0.62;
      damageFriendlyTarget(target, enemy.damage);
      if (player.hp <= 0) resetActors();
    }
    return;
  }
  enemy.attacking = false;
  moveActorToward(enemy, target.x, target.y, enemy.chaseSpeed, dt);
}

function getEnemyCombatTarget(enemy) {
  return getFriendlyTargets()
    .filter(target => dist(enemy.x, enemy.y, target.x, target.y) <= enemy.sightRange)
    .filter(target => !isLineBlocked(enemy.x, enemy.y, target.x, target.y))
    .sort((a, b) => dist(enemy.x, enemy.y, a.x, a.y) - dist(enemy.x, enemy.y, b.x, b.y))[0] || null;
}

function getFriendlyTargets() {
  const targets = [{ id: 'player', actor: player, x: player.x, y: player.y, r: player.r }];
  if (bella.active) targets.push({ id: 'bella', actor: bella, x: bella.x, y: bella.y, r: bella.r });
  targets.push({ id: 'ashtar', actor: ashtar, x: ashtar.x, y: ashtar.y, r: ashtar.r });
  return targets;
}

function isEnemyTouchingTarget(enemy, target) {
  const bodyTouchRange = enemy.r + target.r - 4;
  const touchRange = Math.max(8, Math.min(enemy.attackRange || bodyTouchRange, bodyTouchRange));
  return dist(enemy.x, enemy.y, target.x, target.y) <= touchRange;
}

function damageFriendlyTarget(target, amount) {
  if (target.actor === player) {
    damagePlayer(amount);
    return;
  }
  const actor = target.actor;
  addFloatingText(actor.x, actor.y - 42, 'HIT', target.id === 'bella' ? '#ff70a6' : '#ffd166', 0.45, -16);
}

function moveActorToward(actor, x, y, speed, dt, options = {}) {
  const dx = x - actor.x;
  const dy = y - actor.y;
  const distToTarget = Math.hypot(dx, dy);
  actor.moving = distToTarget > 5;
  if (!actor.moving) return true;
  const step = Math.min(distToTarget, speed * dt);
  const moveX = (dx / distToTarget) * step;
  const moveY = (dy / distToTarget) * step;
  if (options.ignoreWalls || actor.phasing) moveCircleFreely(actor, moveX, moveY);
  else {
    const moved = moveCircleWithWalls(actor, moveX, moveY);
    if (!moved) nudgeActorAroundWall(actor, moveX, moveY, step);
  }
  if (Math.abs(dx) > 2) actor.facing = dx >= 0 ? 1 : -1;
  return distToTarget <= step + 1;
}

function spawnEnemiesFromPaths() {
  state.enemies = [];
  state.spawnSequence = 0;
  spawnMissingEnemies(config.spawnTotal);
}

function spawnMissingEnemies(count) {
  const paths = getActiveEnemyPaths().filter(pathConfig => Array.isArray(pathConfig.points) && pathConfig.points.length >= 2);
  if (!paths.length || count <= 0) return;
  const counts = getEnemyCountsForPaths(paths, count);
  paths.forEach((pathConfig, pathIndex) => {
    if (!Array.isArray(pathConfig.points) || pathConfig.points.length < 2) return;
    const pathCount = counts[pathIndex] || 0;
    for (let i = 0; i < pathCount; i++) spawnEnemyFromPath(pathConfig, pathIndex, i, pathCount);
  });
}

function getActiveEnemyPaths() {
  if (state.phase >= 2) return config.phase2EnemyPaths;
  return config.enemyPaths;
}

function spawnEnemyFromPath(pathConfig, pathIndex, index, count) {
  const type = ENEMY_TYPES[pathConfig.type] ? pathConfig.type : 'grunt';
  const stats = ENEMY_TYPES[type];
  const spreadIndex = (index + state.spawnSequence) % Math.max(1, count);
  const spawnIndex = getSpreadPointIndex(pathConfig.points, spreadIndex, count);
  const spawn = pathConfig.points[spawnIndex];
  const nextIndex = Math.min(spawnIndex + 1, pathConfig.points.length - 1);
  const jitter = getSpawnJitter(index + state.spawnSequence, pathIndex);
  state.enemies.push({
    type,
    x: clamp(spawn.x + jitter.x, stats.r, WORLD.width - stats.r),
    y: clamp(spawn.y + jitter.y, stats.r, WORLD.height - stats.r),
    r: stats.r,
    w: stats.w,
    h: stats.h,
    hp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,
    chaseSpeed: stats.chaseSpeed,
    damage: stats.damage,
    attackRange: stats.attackRange,
    sightRange: stats.sightRange,
    path: pathConfig.points.map(point => ({ ...point })),
    pathIndex: nextIndex,
    pathId: pathIndex,
    mode: 'path',
    facing: nextIndex > spawnIndex && pathConfig.points[nextIndex].x >= spawn.x ? 1 : -1,
    moving: false,
    attacking: false,
    phasing: areZombiesPhasingThroughWalls(),
    attackTimer: 0.25 + (state.spawnSequence % 5) * 0.08,
    animTime: Math.random() * 10
  });
  state.spawnSequence++;
}

function getEnemyCountsForPaths(paths, total) {
  const explicitCounts = paths.map(path => Number.isFinite(path.count) ? Math.max(0, Math.round(path.count)) : null);
  const explicitTotal = explicitCounts.reduce((sum, count) => sum + (count || 0), 0);
  if (explicitTotal > 0) {
    const scale = total / explicitTotal;
    let remaining = total;
    return explicitCounts.map((count, index) => {
      const value = index === explicitCounts.length - 1 ? remaining : Math.max(0, Math.round((count || 0) * scale));
      remaining -= value;
      return value;
    });
  }
  const base = Math.floor(total / paths.length);
  let extra = total % paths.length;
  return paths.map(() => base + (extra-- > 0 ? 1 : 0));
}

function getSpreadPointIndex(points, index, count) {
  if (points.length <= 2 || count <= 1) return 0;
  const maxIndex = Math.max(0, points.length - 2);
  return clamp(Math.floor((index / Math.max(1, count - 1)) * maxIndex), 0, maxIndex);
}

function getSpawnJitter(index, pathIndex) {
  const angle = (index * 2.399 + pathIndex * 0.75) % (Math.PI * 2);
  const radius = 7 + (index % 4) * 5;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

function areZombiesPhasingThroughWalls() {
  if (state.zombieWallPhaseClock < ZOMBIE_WALL_PHASE_INTERVAL) return false;
  return state.zombieWallPhaseClock % ZOMBIE_WALL_PHASE_INTERVAL < ZOMBIE_WALL_PHASE_DURATION;
}

function moveCircleWithWalls(actor, dx, dy) {
  if (actor.phasing) {
    moveCircleFreely(actor, dx, dy);
    return true;
  }
  const beforeX = actor.x;
  const beforeY = actor.y;
  const nextX = clamp(actor.x + dx, actor.r, WORLD.width - actor.r);
  if (!circleHitsWalls(nextX, actor.y, actor.r)) actor.x = nextX;
  const nextY = clamp(actor.y + dy, actor.r, WORLD.height - actor.r);
  if (!circleHitsWalls(actor.x, nextY, actor.r)) actor.y = nextY;
  return dist(beforeX, beforeY, actor.x, actor.y) > 0.2;
}

function moveCircleFreely(actor, dx, dy) {
  actor.x = clamp(actor.x + dx, actor.r, WORLD.width - actor.r);
  actor.y = clamp(actor.y + dy, actor.r, WORLD.height - actor.r);
}

function nudgeActorAroundWall(actor, dx, dy, step) {
  const toPlayerX = player.x - actor.x;
  const toPlayerY = player.y - actor.y;
  const toPlayerLen = Math.hypot(toPlayerX, toPlayerY) || 1;
  const moveLen = Math.hypot(dx, dy) || 1;
  const tangentX = -dy / moveLen;
  const tangentY = dx / moveLen;
  const playerBiasX = toPlayerX / toPlayerLen;
  const playerBiasY = toPlayerY / toPlayerLen;
  const attempts = [
    { x: tangentX, y: tangentY },
    { x: -tangentX, y: -tangentY },
    { x: tangentX * 0.7 + playerBiasX * 0.6, y: tangentY * 0.7 + playerBiasY * 0.6 },
    { x: -tangentX * 0.7 + playerBiasX * 0.6, y: -tangentY * 0.7 + playerBiasY * 0.6 },
    { x: playerBiasX, y: playerBiasY }
  ];
  for (const attempt of attempts) {
    const len = Math.hypot(attempt.x, attempt.y) || 1;
    const beforeX = actor.x;
    const beforeY = actor.y;
    moveCircleWithWalls(actor, (attempt.x / len) * step, (attempt.y / len) * step);
    if (dist(beforeX, beforeY, actor.x, actor.y) > 0.2) return true;
  }
  return false;
}

function getFollowTarget() {
  const offsetX = player.facing >= 0 ? -16 : 16;
  return {
    x: clamp(player.x + offsetX, ashtar.r, WORLD.width - ashtar.r),
    y: clamp(player.y + 10, ashtar.r, WORLD.height - ashtar.r)
  };
}

function updateHud() {
  hpText.textContent = Math.round(player.hp);
  if (staminaText) staminaText.textContent = Math.round(player.stamina);
  ashtarText.textContent = state.complete ? 'Bus Fixed' : state.phase >= 2 ? 'Bella Ready' : 'Following';
  if (enemyText) enemyText.textContent = String(state.enemies.length);
  if (upgradeText) upgradeText.textContent = getUpgradeHudText();
  const nearGoal = isNearGoal();
  objectiveText.textContent = state.complete ? 'Complete' : player.hp <= 0 ? 'Regroup' : state.phase >= 2 ? 'Defend' : nearGoal ? 'Exit Ready' : 'Escort';
  interactBtn.hidden = !nearGoal;
}

function getUpgradeHudText() {
  if (state.phase < 2) return 'Locked';
  const upgrades = state.shootingUpgrades;
  const playerStacks = upgrades.playerDamage + upgrades.playerRate + upgrades.playerPierce + upgrades.playerSize + upgrades.playerSplash + upgrades.playerChain + upgrades.playerBattery + upgrades.playerMobility;
  const bellaStacks = upgrades.bellaDamage + upgrades.bellaRate;
  return `P${playerStacks} B${bellaStacks}`;
}

function areAllBusesFixed() {
  return config.buses.length > 0 && config.buses.every(bus => getBusStage(bus) >= ASSETS.bus.length);
}

function completeLevel2() {
  if (state.complete) return;
  state.complete = true;
  state.mode = 'complete';
  state.enemies = [];
  state.projectiles = [];
  state.upgradePickups = [];
  state.shockwaves = [];
  state.pendingShockwaveHits = [];
  clearPhaseResume();
  unlockLevel(3);
  addFloatingText(ashtar.x, ashtar.y - 52, 'BUS FIXED', '#ffd166', 1.2, -28);
  setTimeout(() => {
    playStoryVideo(BUS_COMPLETE_VIDEO_SRC, 'map.html');
  }, 1200);
}

function playStoryVideo(src, next) {
  window.location.href = `video.html?src=${encodeURIComponent(src)}&next=${encodeURIComponent(next)}`;
}

function damagePlayer(amount) {
  if (player.invuln > 0) return;
  player.hp = Math.max(0, player.hp - amount);
  player.invuln = 0.42;
  player.hurtTimer = 0.22;
}

function tryFinishLevel() {
  if (state.mode !== 'playing' || !isNearGoal()) return;
  clearPhaseResume();
  unlockLevel(3);
  window.location.href = 'map.html';
}

function clearPhaseResume() {
  try {
    sessionStorage.removeItem(PHASE_STORAGE_KEY);
    sessionStorage.removeItem(PHASE_RETURN_STORAGE_KEY);
  } catch (error) {
    // Ignore storage cleanup failures.
  }
}

function isNearGoal() {
  return dist(player.x, player.y, config.goal.x, config.goal.y) <= 56;
}

function hasReachedSecondPortion() {
  if (dist(player.x, player.y, config.midpoint.x, config.midpoint.y) <= 72) return true;
  const sx = config.start.x;
  const sy = config.start.y;
  const gx = config.goal.x;
  const gy = config.goal.y;
  const routeX = gx - sx;
  const routeY = gy - sy;
  const routeLenSq = routeX * routeX + routeY * routeY || 1;
  const playerProgress = ((player.x - sx) * routeX + (player.y - sy) * routeY) / routeLenSq;
  const midpointProgress = ((config.midpoint.x - sx) * routeX + (config.midpoint.y - sy) * routeY) / routeLenSq;
  return playerProgress >= midpointProgress;
}

function unlockLevel(levelNumber) {
  try {
    const saved = Number.parseInt(localStorage.getItem(PROGRESS_STORAGE_KEY), 10);
    const current = Number.isInteger(saved) ? saved : 1;
    if (levelNumber > current) localStorage.setItem(PROGRESS_STORAGE_KEY, String(levelNumber));
    window.HOLD_LINE_SAVE?.touchSlot();
  } catch (error) {
    // Progress unlocks are best-effort in private browsing modes.
  }
}

function updateCamera() {
  if (devMode) {
    const scale = Math.min(W / WORLD.width, H / WORLD.height);
    WORLD.zoom = scale;
    camera.w = W / scale;
    camera.h = H / scale;
    camera.x = 0;
    camera.y = 0;
    return;
  }
  const scale = WORLD.zoom;
  camera.w = W / scale;
  camera.h = H / scale;
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
  drawBuses();
  drawMarker(config.goal, '#70e000', 'Exit');
  drawEnemies();
  drawParticles('behind');
  drawUpgradePickups();
  drawProjectiles();
  drawShockwaves();
  drawAshtar();
  drawBella();
  drawPlayer();
  drawPlayerAttackArc();
  drawParticles('front');
  drawFloatingText();
  if (devMode) drawDevOverlays();
}

function drawArena() {
  const image = images.get(ASSETS.background);
  if (image?.complete && image.naturalWidth) {
    ctx.drawImage(image, camera.x, camera.y, camera.w, camera.h, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#10131f';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = 'rgba(2, 4, 10, 0.12)';
  ctx.fillRect(0, 0, W, H);
}

function drawBuses() {
  for (const bus of config.buses) {
    const image = images.get(getBusFramePath(bus));
    const screen = worldToScreen(bus.x, bus.y);
    const w = bus.w * WORLD.zoom;
    const h = bus.h * WORLD.zoom;
    ctx.save();
    if (image?.complete && image.naturalWidth) {
      ctx.drawImage(image, screen.x - w / 2, screen.y - h / 2, w, h);
    } else {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(screen.x - w / 2, screen.y - h / 2, w, h);
    }
    if (devMode) {
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.95)';
      ctx.lineWidth = 3;
      ctx.strokeRect(screen.x - w / 2, screen.y - h / 2, w, h);
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 11px Arial';
      ctx.fillText(`bus ${getBusStage(bus)}`, screen.x + w / 2 + 7, screen.y - h / 2 + 12);
    }
    ctx.restore();
  }
}

function getBusFramePath(bus) {
  return ASSETS.bus[getBusStage(bus) - 1] || ASSETS.bus[0];
}

function getBusStage(bus) {
  return clamp(Number.parseInt(bus.stage, 10) || 1, 1, ASSETS.bus.length);
}

function drawMarker(point, color, label) {
  const screen = worldToScreen(point.x, point.y);
  const near = label === 'Exit' && isNearGoal();
  ctx.save();
  ctx.globalAlpha = near ? 0.92 : 0.48;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, near ? 24 : 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, screen.x, screen.y - 26);
  ctx.restore();
}

function drawCharacterSprite(paths, screen, w, h, footOffset, facing, animTime, fps) {
  const scaledW = w * CHARACTER_PNG_SCALE;
  const scaledH = h * CHARACTER_PNG_SCALE;
  return drawAnimatedSprite(paths, screen.x - scaledW / 2, screen.y - scaledH + footOffset, scaledW, scaledH, facing, animTime, fps);
}

function drawPlayer() {
  const screen = worldToScreen(player.x, player.y);
  const frameSet = getPlayerFrameSet();
  ctx.save();
  ctx.globalAlpha = player.invuln > 0 && Math.floor(state.time * 24) % 2 === 0 ? 0.55 : player.hurtTimer > 0 ? 0.68 : 1;
  const drew = drawCharacterSprite(frameSet, screen, player.w, player.h, 24, player.facing, player.animTime, 9);
  if (!drew) {
    ctx.fillStyle = '#5dd8ff';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, player.r * WORLD.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function getPlayerFrameSet() {
  const movementSet = player.moving ? ASSETS.player.run : ASSETS.player.idle;
  if (player.attackKind === 'shoot') return getReadySpriteSet(ASSETS.player.shoot, movementSet);
  if (player.attackKind === 'shockwave') return getReadySpriteSet(ASSETS.player.shockwave, movementSet);
  if (player.attackKind === 'kick') return getReadySpriteSet(ASSETS.player.kick, movementSet);
  if (player.attackKind === 'punch') return getReadySpriteSet(ASSETS.player.punch, movementSet);
  return movementSet;
}

function drawAshtar() {
  const screen = worldToScreen(ashtar.x, ashtar.y);
  const frameSet = ashtar.gathering
    ? getReadySpriteSet(ASSETS.ashtar.gathering, ASSETS.ashtar.idle)
    : (ashtar.moving || state.phase >= 2)
      ? getReadySpriteSet(ASSETS.ashtar.walk, ASSETS.ashtar.idle)
      : ASSETS.ashtar.idle;
  const drew = drawCharacterSprite(frameSet, screen, ashtar.w, ashtar.h, 22, ashtar.facing, ashtar.animTime, 8);
  if (!drew) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, ashtar.r * WORLD.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBella() {
  if (!bella.active && !devMode) return;
  const screen = worldToScreen(bella.x, bella.y);
  const bellaMovementSet = bella.moving ? ASSETS.bella.walk : ASSETS.bella.idle;
  const frameSet = bella.shootTimer > 0 ? getReadySpriteSet(ASSETS.bella.shoot, bellaMovementSet) : bellaMovementSet;
  const spriteFacing = -bella.facing;
  const drew = drawCharacterSprite(frameSet, screen, bella.w, bella.h, 22, spriteFacing, bella.animTime, bella.shootTimer > 0 ? 12 : 8);
  if (!drew) {
    ctx.save();
    ctx.fillStyle = '#ff70a6';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, bella.r * WORLD.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Bella', screen.x, screen.y - 24);
    ctx.restore();
  }
}

function drawPlayerAttackArc() {
  if (player.attackTimer <= 0 || !['punch', 'kick', 'shoot'].includes(player.attackKind)) return;
  const screen = worldToScreen(player.x + player.facing * (player.attackKind === 'kick' ? 48 : 38), player.y - 18);
  const radius = (player.attackKind === 'kick' ? 54 : 40) * WORLD.zoom;
  const start = player.facing === 1 ? -0.9 : Math.PI - 0.9;
  const end = player.facing === 1 ? 0.9 : Math.PI + 0.9;
  ctx.save();
  ctx.globalAlpha = clamp(player.attackTimer * 2.4, 0, 0.82);
  ctx.strokeStyle = player.attackKind === 'kick' ? '#ffd166' : (player.attackKind === 'shoot' ? '#5dd8ff' : '#ffffff');
  ctx.lineWidth = player.attackKind === 'kick' ? 8 : 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radius, start, end);
  ctx.stroke();
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    const screen = worldToScreen(enemy.x, enemy.y);
    const set = ASSETS.enemies[enemy.type] || ASSETS.enemies.grunt;
    const movementSet = set.run || set.walk || set.idle || [];
    const frameSet = enemy.attacking ? getReadySpriteSet(set.attack, movementSet) : movementSet;
    ctx.save();
    if (enemy.phasing) ctx.globalAlpha = 0.58 + Math.sin(state.time * 18) * 0.16;
    const drew = drawCharacterSprite(frameSet, screen, enemy.w, enemy.h, 18, -enemy.facing, enemy.animTime, enemy.type === 'runner' ? 10 : 8);
    if (!drew) {
      ctx.fillStyle = enemy.type === 'runner' ? '#ff4d6d' : '#b8f3ff';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, enemy.r * WORLD.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (devMode) {
      ctx.fillStyle = enemy.mode === 'chase' ? '#ff4d6d' : '#ffd166';
      ctx.font = '800 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.mode.toUpperCase(), screen.x, screen.y - 56);
    }
  }
}

function drawUpgradePickups() {
  ctx.save();
  for (const pickup of state.upgradePickups) {
    if (!isValidUpgradePickup(pickup)) continue;
    const screen = worldToScreen(pickup.x, pickup.y);
    if (!Number.isFinite(screen.x) || !Number.isFinite(screen.y)) continue;
    const tierDef = getUpgradeTierDef(pickup.tier);
    const color = getUpgradePickupColor(pickup);
    const lifeRatio = clamp(pickup.life / (pickup.maxLife || PHASE_TWO_UPGRADE_LIFETIME), 0, 1);
    const pulse = 1 + Math.sin(pickup.pulse * 5.6) * 0.1;
    const flicker = pickup.life < 5 ? 0.66 + Math.sin(state.time * 18) * 0.28 : 1;
    const radius = pickup.r * WORLD.zoom * pulse;
    if (!Number.isFinite(radius) || radius <= 0) continue;
    ctx.save();
    try {
      ctx.globalAlpha = flicker;
      if ((pickup.magnet || 0) > 0) {
        const playerScreen = worldToScreen(player.x, player.y - 20);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.16 + pickup.magnet * 0.24;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(playerScreen.x, playerScreen.y);
        ctx.stroke();
        ctx.globalAlpha = flicker;
      }

      const glow = ctx.createRadialGradient(screen.x, screen.y, 1, screen.x, screen.y, radius * (2.9 + tierDef.power * 0.32));
      glow.addColorStop(0, 'rgba(255,255,255,0.95)');
      glow.addColorStop(0.24, color);
      glow.addColorStop(1, 'rgba(93,216,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * (2.9 + tierDef.power * 0.32), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1 + tierDef.power * 0.25;
      ctx.globalAlpha = 0.38 * flicker;
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y + radius * 2.5);
      ctx.lineTo(screen.x, screen.y - radius * 3.2);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.translate(screen.x, screen.y);
      ctx.rotate((pickup.spin || 0) * (tierDef.power % 2 === 0 ? -1 : 1));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(7, radius * 1.18), 0.2, Math.PI * 1.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(12, radius * 1.65), Math.PI * 1.12, Math.PI * 1.82);
      ctx.stroke();

      ctx.rotate(-(pickup.spin || 0) * (tierDef.power % 2 === 0 ? -1 : 1));
      ctx.fillStyle = '#f5fdff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, radius * 0.48), 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = tierDef.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-radius * 0.62, -radius * 0.62, radius * 1.24, radius * 1.24);
      ctx.rotate(-Math.PI / 4);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = pickup.life < 5 ? 0.78 * flicker : 0.78;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, Math.max(10, radius * 1.92), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
      ctx.stroke();

      const label = `${tierDef.shortLabel} ${pickup.upgrade.shortLabel || 'UP'}`;
      ctx.font = '900 9px Arial';
      const labelWidth = Math.max(44, ctx.measureText(label).width + 14);
      ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
      ctx.fillRect(screen.x - labelWidth / 2, screen.y - radius - 22, labelWidth, 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(screen.x - labelWidth / 2, screen.y - radius - 22, labelWidth, 16);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, screen.x, screen.y - radius - 11);
    } catch (error) {
      pickup.dead = true;
      window.__level2LastPickupDrawError = {
        message: error?.message || String(error),
        stack: error?.stack || ''
      };
    } finally {
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawProjectiles() {
  ctx.save();
  for (const projectile of state.projectiles) {
    const screen = worldToScreen(projectile.x, projectile.y);
    const radius = Math.max(2.6, projectile.r * WORLD.zoom);
    if (projectile.kind === 'magic') {
      const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
      const tailX = screen.x - (projectile.vx / speed) * radius * 2.9;
      const tailY = screen.y - (projectile.vy / speed) * radius * 2.9;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(93,216,255,0.28)';
      ctx.lineWidth = Math.max(2, radius * 0.9);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(screen.x, screen.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(245,253,255,0.76)';
      ctx.lineWidth = Math.max(1, radius * 0.34);
      ctx.beginPath();
      ctx.moveTo(tailX + (screen.x - tailX) * 0.34, tailY + (screen.y - tailY) * 0.34);
      ctx.lineTo(screen.x, screen.y);
      ctx.stroke();

      const glow = ctx.createRadialGradient(screen.x, screen.y, 1, screen.x, screen.y, radius * 1.9);
      glow.addColorStop(0, 'rgba(255,255,255,0.96)');
      glow.addColorStop(0.28, 'rgba(184,243,255,0.82)');
      glow.addColorStop(1, 'rgba(93,216,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5fdff';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, Math.max(1.8, radius * 0.42), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (projectile.kind === 'bella') {
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, Math.max(2, projectile.r * WORLD.zoom), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.fillStyle = '#050812';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, Math.max(2, projectile.r * WORLD.zoom), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShockwaves() {
  for (const wave of state.shockwaves) {
    const t = 1 - clamp(wave.life / wave.maxLife, 0, 1);
    const radius = wave.radius * t;
    const screen = worldToScreen(wave.x, wave.y);
    const drawRadius = Math.max(0.5, radius * WORLD.zoom);
    const outerRadius = Math.max(8, drawRadius * 1.08);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = 'rgba(245,253,255,0.92)';
    ctx.lineWidth = 2 + (1 - t) * 4;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, drawRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.44;
    ctx.strokeStyle = 'rgba(93,216,255,0.78)';
    ctx.lineWidth = 10 + (1 - t) * 8;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, drawRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.28;
    const fill = ctx.createRadialGradient(screen.x, screen.y, 0.5, screen.x, screen.y, outerRadius);
    fill.addColorStop(0, 'rgba(93,216,255,0)');
    fill.addColorStop(0.7, 'rgba(93,216,255,0.12)');
    fill.addColorStop(1, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, outerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawAnimatedSprite(paths, x, y, w, h, facing, animTime, fps = 10) {
  if (!paths?.length) return false;
  const frame = Math.floor(animTime * fps) % paths.length;
  const img = getRenderableImage(paths, frame);
  if (!img?.complete || !img.naturalWidth) return false;
  ctx.save();
  if (facing < 0) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  ctx.restore();
  return true;
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

function drawDevOverlays() {
  drawDevPoint(config.start, '#ffd166', 'Start');
  drawDevPoint(config.ashtarSpawn, '#ff9f1c', 'Ashtar');
  drawDevPoint(config.midpoint, '#5dd8ff', 'Second');
  drawDevPoint(config.phase2Trigger, '#ff70a6', 'Phase 2');
  drawDevPoint(config.bellaSpawn, '#ff70a6', 'Bella');
  drawDevPoint(config.defensePoint, '#70e000', 'Defend');
  drawDevPoint(config.goal, '#70e000', 'Goal');
  drawBusOverlays();
  drawAshtarWorkPointOverlays();
  drawEnemyPathOverlays();
}

function drawAshtarWorkPointOverlays() {
  config.ashtarWorkPoints.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    ctx.save();
    ctx.fillStyle = '#ff9f1c';
    ctx.strokeStyle = '#07101f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '800 11px Arial';
    ctx.fillText(`Work ${index + 1}`, screen.x + 11, screen.y - 9);
    ctx.restore();
  });
}

function drawBusOverlays() {
  config.buses.forEach((bus, index) => {
    const screen = worldToScreen(bus.x, bus.y);
    const selected = state.busDrag?.index === index;
    ctx.save();
    ctx.fillStyle = selected ? '#70e000' : '#ffd166';
    ctx.strokeStyle = '#07101f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '800 11px Arial';
    ctx.fillText(`Bus ${index + 1}`, screen.x + 11, screen.y - 9);
    ctx.restore();
  });
}

function drawEnemyPathOverlays() {
  config.enemyPaths.forEach((path, index) => drawPath(path.points, pathColor(path.type), `${index + 1} ${path.type}`));
  config.phase2EnemyPaths.forEach((path, index) => drawPath(path.points, '#ff70a6', `P2 ${index + 1} ${path.type}`));
  if (state.draftPath.length) drawPath(state.draftPath, '#ffffff', 'draft');
  config.walls.forEach((wall, index) => drawWall(wall.points, `${index + 1}`));
  if (state.draftWall.length) drawWall(state.draftWall, 'draft');
}

function drawPath(points, color, label) {
  if (!Array.isArray(points) || !points.length) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(label === 'draft' ? [6, 6] : []);
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.stroke();
  points.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, index === 0 ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(String(index + 1), screen.x + 10, screen.y - 8);
  });
  const first = worldToScreen(points[0].x, points[0].y);
  ctx.font = '800 11px Arial';
  ctx.fillText(label, first.x + 12, first.y + 18);
  ctx.restore();
}

function drawParticles(layer) {
  ctx.save();
  for (const particle of state.particles) {
    if ((particle.layer || 'front') !== layer) continue;
    const screen = worldToScreen(particle.x, particle.y);
    const alpha = clamp(particle.life / particle.maxLife, 0, 1) * (particle.alpha || 1);
    const radius = Math.max(1, particle.r * WORLD.zoom);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloatingText() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const text of state.floatingText) {
    const screen = worldToScreen(text.x, text.y);
    const alpha = clamp(text.life / text.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.font = '900 15px Arial';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(3,7,16,0.84)';
    ctx.strokeText(text.text, screen.x, screen.y);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, screen.x, screen.y);
  }
  ctx.restore();
}

function drawWall(points, label) {
  if (!Array.isArray(points) || points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.92)';
  ctx.fillStyle = '#ffd166';
  ctx.lineWidth = WALL_COLLISION_RADIUS * WORLD.zoom * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(label === 'draft' ? [10, 8] : []);
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.stroke();
  const first = worldToScreen(points[0].x, points[0].y);
  ctx.font = '900 11px Arial';
  ctx.fillText(`wall ${label}`, first.x + 10, first.y - 10);
  ctx.restore();
}

function drawDevPoint(point, color, label) {
  const screen = worldToScreen(point.x, point.y);
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#07101f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '800 12px Arial';
  ctx.fillText(label, screen.x + 13, screen.y - 12);
  ctx.restore();
}

function addParticle(options) {
  if (state.particles.length >= MAX_PARTICLES) state.particles.splice(0, state.particles.length - MAX_PARTICLES + 1);
  state.particles.push({
    x: options.x,
    y: options.y,
    vx: options.vx || 0,
    vy: options.vy || 0,
    r: options.r || 3,
    color: options.color || '#ffffff',
    alpha: options.alpha ?? 1,
    life: options.life || 0.35,
    maxLife: options.life || 0.35,
    layer: options.layer || 'front'
  });
}

function addFloatingText(x, y, text, color = '#ffffff', life = 0.72, vy = -34) {
  if (state.floatingText.length >= MAX_FLOATING_TEXT) state.floatingText.splice(0, state.floatingText.length - MAX_FLOATING_TEXT + 1);
  state.floatingText.push({
    x,
    y,
    text,
    color,
    life,
    maxLife: life,
    vy
  });
}

function addMagicMuzzleBurst(x, y, dx, dy) {
  for (let i = 0; i < 7; i++) {
    const spread = rand(-0.46, 0.46);
    const angle = Math.atan2(dy, dx) + spread;
    const speed = rand(42, 118);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(1.2, 3.2),
      color: i % 3 === 0 ? '#ffffff' : '#5dd8ff',
      life: rand(0.12, 0.25),
      alpha: 0.82
    });
  }
}

function addMagicTrail(x, y, lastX, lastY) {
  const steps = 1;
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / (steps + 1);
    addParticle({
      x: lastX + (x - lastX) * t + rand(-1.8, 1.8),
      y: lastY + (y - lastY) * t + rand(-1.8, 1.8),
      vx: rand(-5, 5),
      vy: rand(-5, 5),
      r: rand(1.2, 2.6),
      color: '#5dd8ff',
      life: rand(0.12, 0.24),
      alpha: 0.38,
      layer: 'behind'
    });
  }
}

function addMagicImpact(x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(26, 118);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(1.4, 4),
      color: i % 4 === 0 ? '#ffffff' : '#5dd8ff',
      life: rand(0.16, 0.34),
      alpha: 0.82
    });
  }
}

function addHitBurst(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(22, 105);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 5),
      color,
      life: rand(0.18, 0.34),
      alpha: 0.86
    });
  }
}

function addUpgradeBurst(x, y, color, tier = 'common') {
  const tierDef = getUpgradeTierDef(tier);
  for (let i = 0; i < tierDef.particles; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(50, 210 + tierDef.power * 44);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 5 + tierDef.power),
      color: i % 5 === 0 ? '#ffffff' : color,
      life: rand(0.32, 0.72 + tierDef.power * 0.08),
      alpha: 0.9,
      layer: 'front'
    });
  }
}

function addUpgradeDropBurst(x, y, color, tier = 'common') {
  const tierDef = getUpgradeTierDef(tier);
  for (let i = 0; i < 8 + tierDef.power * 4; i++) {
    const angle = (Math.PI * 2 * i) / (8 + tierDef.power * 4);
    const speed = rand(26, 82 + tierDef.power * 24);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(1.5, 3.6 + tierDef.power * 0.5),
      color: i % 3 === 0 ? '#ffffff' : color,
      life: rand(0.2, 0.46 + tierDef.power * 0.04),
      alpha: 0.74,
      layer: 'front'
    });
  }
}

function addUpgradeFizzle(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(16, 62);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(1.2, 3.4),
      color,
      life: rand(0.14, 0.28),
      alpha: 0.52,
      layer: 'front'
    });
  }
}

function addImpactBloom(x, y, radius, color) {
  const count = Math.min(18, Math.max(8, Math.round(radius / 7)));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + rand(-0.1, 0.1);
    const speed = rand(radius * 0.45, radius * 1.25);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(1.6, 4.2),
      color: i % 4 === 0 ? '#ffffff' : color,
      life: rand(0.16, 0.34),
      alpha: 0.62,
      layer: 'front'
    });
  }
}

function addChainArc(x1, y1, x2, y2) {
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = Math.sin(t * Math.PI) * 10;
    addParticle({
      x: x1 + (x2 - x1) * t + rand(-jitter, jitter),
      y: y1 + (y2 - y1) * t + rand(-jitter, jitter),
      vx: rand(-16, 16),
      vy: rand(-16, 16),
      r: rand(1.8, 4.2),
      color: i % 2 === 0 ? '#ffffff' : '#8fe9ff',
      life: rand(0.12, 0.26),
      alpha: 0.78,
      layer: 'front'
    });
  }
}

function addDefeatBurst(x, y) {
  for (let i = 0; i < 14; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(28, 130);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 6),
      color: i % 2 === 0 ? '#ff4d6d' : '#ffd166',
      life: rand(0.24, 0.48),
      alpha: 0.8
    });
  }
}

function addMeleeEffect(x, y, isKick, hitAny) {
  const color = hitAny ? (isKick ? '#ffd166' : '#ffffff') : 'rgba(184,243,255,0.7)';
  const count = isKick ? 12 : 8;
  addFloatingText(x, y - 22, isKick ? 'KICK' : 'PUNCH', color, 0.45, -22);
  for (let i = 0; i < count; i++) {
    const arc = rand(-0.8, 0.8);
    const angle = player.facing > 0 ? arc : Math.PI - arc;
    const speed = rand(32, isKick ? 128 : 96);
    addParticle({
      x: x + rand(-10, 10),
      y: y + rand(-10, 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, isKick ? 6 : 4),
      color,
      life: rand(0.13, 0.28),
      alpha: hitAny ? 0.92 : 0.42
    });
  }
}

function addDashBurst(x, y, dx, dy) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.atan2(dy, dx) + rand(-0.8, 0.8);
    const speed = rand(52, 210);
    addParticle({
      x: x + rand(-8, 8),
      y: y + rand(-8, 8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 5),
      color: i % 3 === 0 ? '#ffffff' : '#b8f3ff',
      life: rand(0.14, 0.3),
      alpha: 0.5,
      layer: 'behind'
    });
  }
}

function addShockwaveParticles(x, y) {
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const speed = rand(120, 260);
    addParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 5),
      color: i % 5 === 0 ? '#ffffff' : '#5dd8ff',
      life: rand(0.22, 0.52),
      alpha: 0.7,
      layer: 'behind'
    });
  }
}

function handleDevClick() {
  if (!devMode || state.mode !== 'playing') return;
  const point = {
    x: clamp(Math.round(mouse.worldX), 0, WORLD.width),
    y: clamp(Math.round(mouse.worldY), 0, WORLD.height)
  };
  const mode = devModeSelect?.value || 'start';
  if (mode === 'enemyPath' || mode === 'phase2EnemyPath') {
    state.draftPath.push(point);
    updateDevStatus(`Draft path ${state.draftPath.length} point${state.draftPath.length === 1 ? '' : 's'}`);
    return;
  }
  if (mode === 'wall') {
    state.draftWall.push(point);
    updateDevStatus(`Draft wall ${state.draftWall.length} point${state.draftWall.length === 1 ? '' : 's'}`);
    return;
  }
  if (mode === 'bus') {
    startBusDrag(point);
    return;
  }
  if (mode === 'ashtarWorkPoint') {
    config.ashtarWorkPoints.push(point);
    updateDevStatus(`Added Ashtar work point ${config.ashtarWorkPoints.length}`);
    return;
  }
  config[mode] = point;
  if (mode === 'start') {
    player.x = point.x;
    player.y = point.y;
  }
  if (mode === 'ashtarSpawn') {
    ashtar.x = point.x;
    ashtar.y = point.y;
  }
  if (mode === 'bellaSpawn') {
    bella.x = point.x;
    bella.y = point.y;
  }
  updateDevStatus(`Moved ${mode}`);
}

function startBusDrag(point) {
  const existingIndex = getBusAtPoint(point.x, point.y);
  if (existingIndex >= 0) {
    const bus = config.buses[existingIndex];
    state.busDrag = {
      index: existingIndex,
      offsetX: bus.x - point.x,
      offsetY: bus.y - point.y
    };
    updateDevStatus('Moving bus - click Save when set');
    return;
  }
  const bus = clampBusToWorld({ x: point.x, y: point.y, w: 170, h: 170, stage: 1 });
  config.buses.push(bus);
  state.busDrag = { index: config.buses.length - 1, offsetX: 0, offsetY: 0 };
  updateDevStatus('Placed bus - click Save when set');
}

function dragBus() {
  if (!devMode || !state.busDrag) return;
  const bus = config.buses[state.busDrag.index];
  if (!bus) {
    state.busDrag = null;
    return;
  }
  bus.x = mouse.worldX + state.busDrag.offsetX;
  bus.y = mouse.worldY + state.busDrag.offsetY;
  clampBusToWorld(bus);
}

function stopBusDrag() {
  if (!state.busDrag) return;
  state.busDrag = null;
  updateDevStatus('Bus moved - click Save');
}

function getBusAtPoint(x, y) {
  for (let i = config.buses.length - 1; i >= 0; i--) {
    if (pointInRect({ x, y }, getBusRect(config.buses[i]))) return i;
  }
  return -1;
}

function clampBusToWorld(bus) {
  bus.x = clamp(bus.x, bus.w / 2, WORLD.width - bus.w / 2);
  bus.y = clamp(bus.y, bus.h / 2, WORLD.height - bus.h / 2);
  return bus;
}

function finishDraftEnemyPath() {
  if ((devModeSelect?.value || '') === 'wall') {
    finishDraftWall({ save: true });
    return;
  }
  if (!commitDraftEnemyPath()) {
    updateDevStatus('Enemy path needs at least 2 points');
    return;
  }
  if (!devMode) spawnEnemiesFromPaths();
  saveConfig('Enemy path added');
}

function commitDraftEnemyPath() {
  if (state.draftPath.length < 2) return false;
  const targetPaths = (devModeSelect?.value || '') === 'phase2EnemyPath' ? config.phase2EnemyPaths : config.enemyPaths;
  targetPaths.push({
    type: devEnemyType?.value === 'runner' ? 'runner' : 'grunt',
    points: state.draftPath.map(point => ({ ...point }))
  });
  state.draftPath = [];
  return true;
}

function finishDraftWall(options = {}) {
  if (!commitDraftWall()) {
    updateDevStatus('Wall needs at least 2 points');
    return;
  }
  if (options.save) saveConfig('Wall added');
  else updateDevStatus('Wall added');
}

function commitDraftWall() {
  if (state.draftWall.length < 2) return false;
  config.walls.push({
    points: state.draftWall.map(point => ({ ...point }))
  });
  state.draftWall = [];
  return true;
}

function undoDraftEnemyPathPoint() {
  if (state.draftWall.length) state.draftWall.pop();
  else if (state.draftPath.length) state.draftPath.pop();
  else if ((devModeSelect?.value || '') === 'wall') config.walls.pop();
  else if ((devModeSelect?.value || '') === 'bus') config.buses.pop();
  else if ((devModeSelect?.value || '') === 'ashtarWorkPoint') config.ashtarWorkPoints.pop();
  else if ((devModeSelect?.value || '') === 'phase2EnemyPath') config.phase2EnemyPaths.pop();
  else config.enemyPaths.pop();
  if (!devMode) spawnEnemiesFromPaths();
  saveConfig('Undo saved');
}

function clearEnemyPaths() {
  state.draftPath = [];
  state.draftWall = [];
  if ((devModeSelect?.value || '') === 'wall') config.walls = [];
  else if ((devModeSelect?.value || '') === 'bus') config.buses = [];
  else if ((devModeSelect?.value || '') === 'ashtarWorkPoint') config.ashtarWorkPoints = [];
  else if ((devModeSelect?.value || '') === 'phase2EnemyPath') config.phase2EnemyPaths = [];
  else config.enemyPaths = [];
  if (!devMode) spawnEnemiesFromPaths();
  const mode = devModeSelect?.value || '';
  saveConfig(mode === 'wall' ? 'Cleared walls' : mode === 'bus' ? 'Cleared buses' : mode === 'ashtarWorkPoint' ? 'Cleared Ashtar work points' : mode === 'phase2EnemyPath' ? 'Cleared phase 2 paths' : 'Cleared enemy paths');
}

function saveConfig(prefix = 'Saved') {
  syncConfigFromDevControls();
  commitDraftEnemyPath();
  commitDraftWall();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    updateDevStatus(prefix);
  } catch (error) {
    updateDevStatus('Save failed');
  }
}

function exportConfig() {
  syncConfigFromDevControls();
  commitDraftEnemyPath();
  commitDraftWall();
  if (!devConfigExport) return;
  devConfigExport.hidden = false;
  devConfigExport.value = JSON.stringify(config, null, 2);
  devConfigExport.select();
  updateDevStatus('Exported');
}

let devPanelDrag = null;
function startDevPanelDrag(event) {
  if (!devMode || !devPanel) return;
  const rect = devPanel.getBoundingClientRect();
  devPanelDrag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  devPanel.classList.add('dragging');
}

function dragDevPanel(event) {
  if (!devPanelDrag || !devPanel) return;
  const shell = devPanel.closest('.prelevel-shell');
  const shellRect = shell.getBoundingClientRect();
  const panelRect = devPanel.getBoundingClientRect();
  const left = clamp(event.clientX - shellRect.left - devPanelDrag.x, 8, shellRect.width - panelRect.width - 8);
  const top = clamp(event.clientY - shellRect.top - devPanelDrag.y, 8, shellRect.height - panelRect.height - 8);
  devPanel.style.left = `${left}px`;
  devPanel.style.top = `${top}px`;
  devPanel.style.right = 'auto';
}

function stopDevPanelDrag() {
  devPanelDrag = null;
  devPanel?.classList.remove('dragging');
}

function importConfig() {
  if (!devConfigExport) return;
  try {
    const imported = JSON.parse(devConfigExport.value);
    config = sanitizeConfig(imported, DEFAULT_CONFIG);
    clampConfigToWorld();
    syncDevControls();
    resetActors();
    saveConfig();
    exportConfig();
    updateDevStatus('Imported');
  } catch (error) {
    updateDevStatus('Import failed');
  }
}

function resetConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage failures.
  }
  config = cloneConfig(DEFAULT_CONFIG);
  config.walls = [];
  clampConfigToWorld();
  resetActors();
  exportConfig();
  updateDevStatus('Reset');
}

function updateDevStatus(prefix = '') {
  if (!devStatus) return;
  const pathText = `${config.enemyPaths.length} enemy path${config.enemyPaths.length === 1 ? '' : 's'}`;
  const phase2PathText = `${config.phase2EnemyPaths.length} phase 2 path${config.phase2EnemyPaths.length === 1 ? '' : 's'}`;
  const draft = state.draftPath.length ? ` - Draft ${state.draftPath.length}` : '';
  const wallText = `${config.walls.length} wall${config.walls.length === 1 ? '' : 's'}`;
  const wallDraft = state.draftWall.length ? ` - Wall draft ${state.draftWall.length}` : '';
  const busText = `${config.buses.length} bus${config.buses.length === 1 ? '' : 'es'}`;
  const workText = `${config.ashtarWorkPoints.length} work point${config.ashtarWorkPoints.length === 1 ? '' : 's'}`;
  devStatus.textContent = `${prefix ? `${prefix}. ` : ''}Spawn ${round(config.start.x)},${round(config.start.y)} - Ashtar ${round(config.ashtarSpawn.x)},${round(config.ashtarSpawn.y)} - Phase2 ${round(config.phase2Trigger.x)},${round(config.phase2Trigger.y)} - Bella ${round(config.bellaSpawn.x)},${round(config.bellaSpawn.y)} - Defend ${round(config.defensePoint.x)},${round(config.defensePoint.y)} - Goal ${round(config.goal.x)},${round(config.goal.y)} - Zombies ${config.spawnTotal} - ${pathText} - ${phase2PathText} - ${wallText} - ${busText} - ${workText}${draft}${wallDraft}`;
}

function syncConfigFromDevControls() {
  if (!devEnemyTotal) return;
  config.spawnTotal = clamp(Number.parseInt(devEnemyTotal.value, 10) || 0, 0, 80);
  devEnemyTotal.value = String(config.spawnTotal);
}

function syncDevControls() {
  if (devEnemyTotal) devEnemyTotal.value = String(config.spawnTotal);
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return sanitizeConfig(saved, DEFAULT_CONFIG);
  } catch (error) {
    const loaded = cloneConfig(DEFAULT_CONFIG);
    loaded.walls = [];
    return loaded;
  }
}

function sanitizeConfig(raw, fallback) {
  const base = cloneConfig(fallback);
  base.walls = [];
  if (!raw || typeof raw !== 'object') return base;
  return {
    start: sanitizePoint(raw.start, base.start),
    ashtarSpawn: sanitizePoint(raw.ashtarSpawn || raw.agarthaSpawn, base.ashtarSpawn),
    midpoint: sanitizePoint(raw.midpoint, base.midpoint),
    phase2Trigger: sanitizePoint(raw.phase2Trigger, base.phase2Trigger),
    bellaSpawn: sanitizePoint(raw.bellaSpawn, base.bellaSpawn),
    defensePoint: sanitizePoint(raw.defensePoint, base.defensePoint),
    goal: sanitizePoint(raw.goal, base.goal),
    spawnTotal: clamp(Number.parseInt(raw.spawnTotal, 10) || base.spawnTotal, 0, 80),
    enemyPaths: Array.isArray(raw.enemyPaths)
      ? raw.enemyPaths.map(sanitizeEnemyPath).filter(Boolean)
      : base.enemyPaths,
    phase2EnemyPaths: Array.isArray(raw.phase2EnemyPaths)
      ? raw.phase2EnemyPaths.map(sanitizeEnemyPath).filter(Boolean)
      : base.phase2EnemyPaths,
    walls: Array.isArray(raw.walls)
      ? raw.walls.map(sanitizeWall).filter(Boolean)
      : [],
    buses: Array.isArray(raw.buses)
      ? raw.buses.map(sanitizeBus).filter(Boolean)
      : base.buses,
    ashtarWorkPoints: Array.isArray(raw.ashtarWorkPoints)
      ? raw.ashtarWorkPoints.map(point => sanitizePoint(point, null)).filter(Boolean)
      : base.ashtarWorkPoints
  };
}

function sanitizeEnemyPath(path) {
  if (!path || !Array.isArray(path.points)) return null;
  const points = path.points.map(point => sanitizePoint(point, null)).filter(Boolean);
  if (points.length < 2) return null;
  return {
    type: path.type === 'runner' ? 'runner' : 'grunt',
    points
  };
}

function sanitizeWall(wall) {
  if (!wall || !Array.isArray(wall.points)) return null;
  const points = wall.points.map(point => sanitizePoint(point, null)).filter(Boolean);
  return points.length >= 2 ? { points } : null;
}

function sanitizeBus(bus) {
  if (!bus || !Number.isFinite(bus.x) || !Number.isFinite(bus.y)) return null;
  return {
    x: bus.x,
    y: bus.y,
    w: clamp(Number.parseFloat(bus.w) || 170, 40, 420),
    h: clamp(Number.parseFloat(bus.h) || 170, 40, 420),
    stage: clamp(Number.parseInt(bus.stage, 10) || 1, 1, ASSETS.bus.length)
  };
}

function sanitizePoint(point, fallback) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return fallback ? { ...fallback } : null;
  return { x: point.x, y: point.y };
}

function cloneConfig(source) {
  return {
    start: { ...source.start },
    ashtarSpawn: { ...(source.ashtarSpawn || source.agarthaSpawn || { x: source.start.x - 30, y: source.start.y + 26 }) },
    midpoint: { ...source.midpoint },
    phase2Trigger: { ...(source.phase2Trigger || source.midpoint || source.goal) },
    bellaSpawn: { ...(source.bellaSpawn || source.ashtarSpawn || { x: source.start.x + 80, y: source.start.y + 26 }) },
    defensePoint: { ...(source.defensePoint || source.bellaSpawn || source.midpoint || source.goal) },
    goal: { ...source.goal },
    spawnTotal: source.spawnTotal,
    enemyPaths: source.enemyPaths.map(path => ({
      type: path.type,
      points: path.points.map(point => ({ ...point }))
    })),
    phase2EnemyPaths: (source.phase2EnemyPaths || []).map(path => ({
      type: path.type,
      points: path.points.map(point => ({ ...point }))
    })),
    walls: source.walls.map(wall => ({
      points: wall.points.map(point => ({ ...point }))
    })),
    buses: (source.buses || []).map(bus => ({ ...bus })),
    ashtarWorkPoints: (source.ashtarWorkPoints || []).map(point => ({ ...point }))
  };
}

function clampConfigToWorld() {
  ['start', 'ashtarSpawn', 'midpoint', 'phase2Trigger', 'bellaSpawn', 'defensePoint', 'goal'].forEach(key => {
    config[key].x = clamp(config[key].x, 0, WORLD.width);
    config[key].y = clamp(config[key].y, 0, WORLD.height);
  });
  config.enemyPaths.forEach(path => {
    path.points.forEach(point => {
      point.x = clamp(point.x, 0, WORLD.width);
      point.y = clamp(point.y, 0, WORLD.height);
    });
  });
  config.phase2EnemyPaths.forEach(path => {
    path.points.forEach(point => {
      point.x = clamp(point.x, 0, WORLD.width);
      point.y = clamp(point.y, 0, WORLD.height);
    });
  });
  config.ashtarWorkPoints.forEach(point => {
    point.x = clamp(point.x, 0, WORLD.width);
    point.y = clamp(point.y, 0, WORLD.height);
  });
  config.walls.forEach(wall => {
    wall.points.forEach(point => {
      point.x = clamp(point.x, 0, WORLD.width);
      point.y = clamp(point.y, 0, WORLD.height);
    });
  });
  config.buses.forEach(bus => {
    bus.x = clamp(bus.x, bus.w / 2, WORLD.width - bus.w / 2);
    bus.y = clamp(bus.y, bus.h / 2, WORLD.height - bus.h / 2);
    bus.stage = getBusStage(bus);
  });
}

function resetActors() {
  player.x = config.start.x;
  player.y = config.start.y;
  player.maxStamina = COMBAT.staminaMax;
  player.hp = player.maxHp;
  player.stamina = player.maxStamina;
  player.facing = 1;
  player.aimX = 1;
  player.aimY = 0;
  player.moving = false;
  player.hurtTimer = 0;
  player.attackKind = '';
  player.attackTimer = 0;
  player.attackCooldown = 0;
  player.shootCooldown = 0;
  player.specialCooldown = 0;
  player.dashCooldown = 0;
  player.dashTimer = 0;
  player.dashVx = 0;
  player.dashVy = 0;
  player.invuln = 0;
  player.meleeCombo = 0;
  player.meleeComboTimer = 0;
  ashtar.x = config.ashtarSpawn.x;
  ashtar.y = config.ashtarSpawn.y;
  ashtar.facing = 1;
  ashtar.moving = false;
  ashtar.gathering = false;
  ashtar.workPointIndex = 0;
  ashtar.workTimer = 0;
  ashtar.currentBusIndex = 0;
  bella.x = config.bellaSpawn.x;
  bella.y = config.bellaSpawn.y;
  bella.facing = 1;
  bella.moving = false;
  bella.active = state.phase >= 2;
  bella.shootCooldown = 0.4;
  bella.shootTimer = 0;
  bella.animTime = 0;
  state.draftPath = [];
  state.draftWall = [];
  state.projectiles = [];
  state.upgradePickups = [];
  state.shockwaves = [];
  state.pendingShockwaveHits = [];
  state.particles = [];
  state.floatingText = [];
  state.busDrag = null;
  state.enemies = [];
  state.spawnSequence = 0;
  state.spawnTopOffTimer = 0;
  state.killsSinceUpgradeDrop = 0;
  state.upgradeDropsSeen = 0;
  state.shootingUpgrades = createEmptyShootingUpgrades();
  state.zombieWallPhaseClock = 0;
  state.complete = false;
  state.secondPortionReached = false;
  if (!devMode) spawnEnemiesFromPaths();
}

function pathColor(type) {
  return type === 'runner' ? '#ff4d6d' : '#5dd8ff';
}

function circleHitsWalls(x, y, r) {
  return config.walls.some(wall => {
    for (const point of wall.points) {
      if (dist(x, y, point.x, point.y) <= r + WALL_JOINT_RADIUS) return true;
    }
    for (let i = 1; i < wall.points.length; i++) {
      if (circleHitsRoundedWallSegment(x, y, r, wall.points[i - 1], wall.points[i])) return true;
    }
    return false;
  });
}

function circleHitsRoundedWallSegment(x, y, r, a, b) {
  const hit = closestPointOnSegment(x, y, a, b);
  return hit.distance <= r + WALL_COLLISION_RADIUS;
}

function isLineBlocked(x1, y1, x2, y2) {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  return config.walls.some(wall => {
    for (let i = 1; i < wall.points.length; i++) {
      if (segmentsIntersect(a, b, wall.points[i - 1], wall.points[i])) return true;
    }
    return false;
  });
}

function getBusRect(bus) {
  return {
    x: bus.x - bus.w / 2,
    y: bus.y - bus.h / 2,
    w: bus.w,
    h: bus.h
  };
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function distPointToSegment(x, y, a, b) {
  return closestPointOnSegment(x, y, a, b).distance;
}

function closestPointOnSegment(x, y, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy || 1;
  const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / lenSq, 0, 1);
  const px = a.x + dx * t;
  const py = a.y + dy * t;
  return {
    x: px,
    y: py,
    t,
    distance: dist(x, y, px, py)
  };
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function orientation(a, b, c) {
  const value = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (Math.abs(value) < 0.0001) return 0;
  return value > 0 ? 1 : -1;
}

function worldToScreen(x, y) {
  return {
    x: (x - camera.x) * WORLD.zoom,
    y: (y - camera.y) * WORLD.zoom
  };
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}
