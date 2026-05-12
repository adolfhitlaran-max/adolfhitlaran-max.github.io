HOLD THE LINE UPGRADE BASE
==========================

Open launcher.html in your browser to start from the new launcher.

Page flow:
- launcher.html is the front door with campaign, map, and practice options.
- map.html is the level/map selection screen.
- index.html is the actual gameplay page.
- index.html?start=campaign starts level 1 immediately.
- index.html?level=2 starts directly on level 2.
- index.html?level=1&dev=1 starts level 1 with the temporary floor-height editor.

This is a left-side defense / wave survival prototype:
- Player protects Ashtar on the left.
- All enemies spawn from the right side.
- Clear a wave, then choose one upgrade before the next wave starts.
- Each level has five normal waves, then a separate boss-only fight.
- The upgrade system is separated into its own JS file so you can rebalance it later.

Important files
---------------
index.html
  Main gameplay page and HUD layout.

launcher.html
  Front-end launcher screen that routes into the intro video, map, or practice.

video.html
  Reusable MP4 transition player. It plays the requested video, then follows the next URL.

prelevel.html
  Top-down pistol-only pre-level. Clear 50 grunt/runner enemies on the zoomed pregame map to enter the main game.
  Open prelevel.html?dev=1 for full-map dev editing. The default layout starts with no sections. Set the player spawn and meet-character point, then click points to draw section polygons and invisible wall polygons. Finish Shape connects the edges. Each section dot is one enemy, and entering that section during play spawns those enemies. Reach the meet character and press E or Talk to continue.

map.html
  Level map screen with deploy buttons for each level.
  Level icons unlock one at a time as levels are cleared.

styles/style.css
  Visual styling for the 16:9 game frame, HUD, menus, and upgrade cards.

styles/menu.css
  Styling for launcher.html and map.html.

scripts/game.js
  Main game loop, player movement, enemy waves, combat, pickups, level flow, and drawing.
  Saves campaign unlock progress in browser localStorage.
  Level 1 uses assets/backgrounds/level1map.png as its gameplay background.

scripts/map-progress.js
  Applies map locks/unlocks based on saved campaign progress.

scripts/upgrades.js
  Upgrade definitions and balance.
  Edit this file to add new upgrades, change max levels, increase damage, change Ashtar defense bonuses, etc.
  Upgrade choices now include rarities and build paths for melee, kicks, energy shots, shockwave, escort defense, mobility, pickups, and economy.

BOSS_ABILITY_PLAN.md
  Magical boss identities, implemented attacks, and matching PNG ability folders.

Asset folders
-------------
assets/backgrounds/
assets/backgrounds/pregameclip.png
assets/foregrounds/
assets/foregrounds/lootfromcraft/
assets/videos/1.mp4
assets/videos/2.mp4
assets/base/barricade/
assets/base/flag/
assets/player/genz/idle/
assets/player/genz/run/
assets/player/genz/jump/
assets/player/genz/punch/
assets/player/genz/kick/
assets/player/genz/shoot/
assets/player/genz/shockwave/
assets/player/uncensored/
assets/ashtar/idle/
assets/ashtar/walking/
assets/ashtar/gathering/
assets/ashtar/carrying/
assets/enemies/grunt/
assets/enemies/grunt/run/
assets/enemies/grunt/attack/
assets/enemies/runner/
assets/enemies/runner/run/
assets/enemies/runner/attack/
assets/enemies/brute/
assets/enemies/brute/walk/
assets/enemies/brute/attack/
assets/enemies/shooter/
assets/enemies/shooter/walk/
assets/enemies/shooter/attack/
assets/enemies/bosses/level1/
assets/enemies/bosses/level2/
assets/enemies/bosses/level3/
assets/enemies/bosses/level4/
assets/pickups/
assets/effects/
assets/music/

PNG hooks
---------
At the top of scripts/game.js, replace empty paths in the ASSETS object with your PNG paths.

Example:
background: 'assets/backgrounds/level1.png'

players: {
  genz: {
    idle: ['assets/player/genz/idle/1.png'],
    run: ['assets/player/genz/run/1.png', 'assets/player/genz/run/2.png', 'assets/player/genz/run/3.png'],
    jump: ['assets/player/genz/jump/1.png', 'assets/player/genz/jump/2.png', 'assets/player/genz/jump/3.png'],
    attack: ['assets/player/genz/punch/1.png', 'assets/player/genz/punch/2.png', 'assets/player/genz/punch/3.png'],
    punch: ['assets/player/genz/punch/1.png', 'assets/player/genz/punch/2.png', 'assets/player/genz/punch/3.png'],
    kick: ['assets/player/genz/kick/1.png', 'assets/player/genz/kick/2.png', 'assets/player/genz/kick/3.png'],
    shoot: ['assets/player/genz/shoot/1.png', 'assets/player/genz/shoot/2.png', 'assets/player/genz/shoot/3.png'],
    shockwave: ['assets/player/genz/shockwave/1.png', 'assets/player/genz/shockwave/2.png'],
    hurt: []
  },
  uncensored: {
    idle: ['assets/player/uncensored/idle/1.png'],
    run: ['assets/player/uncensored/run/1.png', 'assets/player/uncensored/run/2.png', 'assets/player/uncensored/run/3.png'],
    jump: ['assets/player/uncensored/jump/1.png', 'assets/player/uncensored/jump/2.png', 'assets/player/uncensored/jump/3.png'],
    attack: ['assets/player/uncensored/attack/1.png', 'assets/player/uncensored/attack/2.png'],
    punch: ['assets/player/uncensored/punch/1.png', 'assets/player/uncensored/punch/2.png', 'assets/player/uncensored/punch/3.png'],
    kick: ['assets/player/uncensored/kick/1.png', 'assets/player/uncensored/kick/2.png', 'assets/player/uncensored/kick/3.png'],
    shoot: ['assets/player/uncensored/shoot/1.png'],
    shockwave: ['assets/player/uncensored/shockwave/1.png'],
    hurt: ['assets/player/uncensored/hurt/1.png']
  }
}

ashtar: {
  idle: ['assets/ashtar/idle/1.png'],
  walking: ['assets/ashtar/walking/1.png', 'assets/ashtar/walking/2.png', 'assets/ashtar/walking/3.png'],
  gathering: ['assets/ashtar/gathering/1.png', 'assets/ashtar/gathering/2.png', 'assets/ashtar/gathering/3.png'],
  carrying: ['assets/ashtar/carrying/1.png', 'assets/ashtar/carrying/2.png', 'assets/ashtar/carrying/3.png']
}

grunt enemy:
run: ['assets/enemies/grunt/run/1.png', 'assets/enemies/grunt/run/2.png', 'assets/enemies/grunt/run/3.png']
attack: ['assets/enemies/grunt/attack/1.png', 'assets/enemies/grunt/attack/2.png', 'assets/enemies/grunt/attack/3.png']

shooter enemy:
walk: ['assets/enemies/shooter/walk/1.png', 'assets/enemies/shooter/walk/2.png', 'assets/enemies/shooter/walk/3.png']
attack: ['assets/enemies/shooter/attack/1.png', 'assets/enemies/shooter/attack/2.png', 'assets/enemies/shooter/attack/3.png']

runner enemy:
run: ['assets/enemies/runner/run/1.png', 'assets/enemies/runner/run/2.png', 'assets/enemies/runner/run/3.png']
attack: ['assets/enemies/runner/attack/1.png', 'assets/enemies/runner/attack/2.png', 'assets/enemies/runner/attack/3.png']

brute enemy:
walk: ['assets/enemies/brute/walk/1.png', 'assets/enemies/brute/walk/2.png', 'assets/enemies/brute/walk/3.png']
attack: ['assets/enemies/brute/attack/1.png', 'assets/enemies/brute/attack/2.png', 'assets/enemies/brute/attack/3.png']

Bosses are wired per level in scripts/game.js:
bosses: {
  level1: { idle: [], walk: [], basic: [], riftLance: [], gravityBloom: [], starfallShards: [], phaseBreak: [], ultimate: [] },
  level2: { idle: [], walk: [], basic: [], magnetHex: [], scrapSwarm: [], batteryDrain: [], salvageTotem: [], ultimate: [] },
  level3: { idle: [], walk: [], basic: [], mirrorHalo: [], emberRing: [], rootSnare: [], recallCurse: [], ultimate: [] },
  level4: { idle: [], walk: [], basic: [], leylineDash: [], blueComet: [], roadSplit: [], timeMile: [], ultimate: [] }
}

Drop each boss image sequence into its matching folder, then add those PNG paths to the matching array.
Until those arrays are filled, boss waves use a separate drawn placeholder enemy, not the brute zombie.
See BOSS_ABILITY_PLAN.md for the full boss attack list and folder map.
Boss gameplay logic is implemented with drawn magic telegraphs and hazards until PNGs are added.

Temporary floor dev mode
------------------------
Open a level with &dev=1 in the URL, for example:
index.html?level=1&dev=1

Use the Floor Dev slider to move the walking/floor line up or down.
Click Save to store that floor height for the current level in browser localStorage.
Click Reset to remove the saved height for the current level and return it to the default.

Saved floor heights are per level, so level 1 can use a different walking line than level 2.

Use Ashtar Path dev mode to draw Ashtar's route directly on the map.
Click the canvas to add path points. The point is where Ashtar's feet will land, so you can draw ramps, raised spots, and lower spots.
Click Undo Point to remove the last point, or Clear Path to start drawing again.
Click Save Path to store that patrol path for the current level.
Click Reset Path to return Ashtar's path to the default.
Path point 4 starts the distance shrink, point 8 is the halfway point where Ashtar waits 7 seconds at 50% size, and points 8 through 12 grow Ashtar back to full size.
Ashtar walks from points 1 through 8, loops the gathering animation while waiting at point 8, then uses the carrying animation from point 8 until the final point before restarting at point 1.

Upgrade editing
---------------
Open scripts/upgrades.js.
Each upgrade has:
- id
- name
- tag
- maxLevel
- description
- apply(stats, level)

To add a new upgrade, copy one upgrade object and change the stats it modifies.
The main game automatically asks UPGRADE_SYSTEM for current stats during combat.

Upgrade system notes
--------------------
Between waves, the game offers four upgrade cards.
Cards have rarity tiers: common, rare, epic, and legendary.
Higher rarity cards become more likely as a run develops, and economy upgrades can improve future choice quality.
Several upgrades now add real mechanics, including melee crits, combo damage scaling, kick stun, piercing energy shots, shockwave slow/refund, dash invulnerability, stronger pickup healing, and Ashtar damage reduction.

Controls
--------
A/D or Arrow Keys: Move
W / Arrow Up: Jump
Left Click or J: Punch
Every third punch: Kick
Q: Energy shot
Space: Special shockwave
Shift: Dash
P or Esc: Pause
R: Restart current level

Notes
-----
This project intentionally works with placeholder shapes until you add PNGs.
The folder is set up so it can later become a bigger game without cramming every system into one JS file.
