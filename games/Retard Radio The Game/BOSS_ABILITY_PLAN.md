# Boss Ability Plan

Each level has five normal waves, then a unique magical boss fight. Boss PNGs live under:

`assets/enemies/bosses/level1/` through `assets/enemies/bosses/level4/`

Shared animation folders for every boss:

- `idle/`
- `walk/`
- `basic/`
- `cast/`
- `ultimate/`
- `hurt/`
- `death/`
- `projectiles/`

## Level 1: Crash Site - The Rift Warden

Theme: unstable blue-white space magic from the crash wreckage.
Visual language: white-hot cores, cyan rift light, violet gravity edges, rotating runes, diamond shards, and torn phase trails.

- Basic: Rift Claw. Short melee slash with a blue crescent trail.
- Ability 1: Rift Lance. Fires a straight piercing beam across the lane.
- Ability 2: Gravity Bloom. Creates a circular field that pulls the player toward the center before bursting.
- Ability 3: Starfall Shards. Marks 3-5 spots on the ground, then drops crystal bolts.
- Ultimate: Phase Break. The boss vanishes, reappears closer to Ashtar, and releases a shock ring.

PNG folders:

- `level1/rift-lance/`
- `level1/gravity-bloom/`
- `level1/starfall-shards/`
- `level1/phase-break/`

Current Level 1 boss PNGs wired in `scripts/game.js`:

- `idle/`: 1 frame
- `walk/`: 3 frames
- `basic/`: 4 frames
- `cast/`: 4 frames
- `gravity-bloom/`: 6 frames
- `phase-break/`: 1 frame
- `hurt/`: 3 frames
- `death/`: 8 frames

Rift Lance and Starfall Shards currently use the drawn projectile animation system until their folders receive PNGs.

## Level 2: Salvage - The Scrap Oracle

Theme: magnetic junk magic, copper sparks, cursed salvage.

- Basic: Hexed Hook. A close swipe with metal fragments orbiting the hand.
- Ability 1: Magnet Hex. Pulls loose scrap across the screen in a horizontal hazard line.
- Ability 2: Scrap Swarm. Summons small spinning scrap wisps that drift toward Ashtar.
- Ability 3: Battery Drain. Locks onto the player and drains stamina unless interrupted.
- Ultimate: Salvage Totem. Plants a glowing junk totem that shields the boss until destroyed.

PNG folders:

- `level2/magnet-hex/`
- `level2/scrap-swarm/`
- `level2/battery-drain/`
- `level2/salvage-totem/`

## Level 3: Home Run - The Hearthbinder

Theme: warm gold fire, memory magic, roots, and protective curses turned hostile.

- Basic: Cinder Palm. A fiery palm strike that leaves a small burn zone.
- Ability 1: Mirror Halo. Creates rotating mirror copies; only one is real.
- Ability 2: Ember Ring. Expanding fire ring that must be jumped or dashed through.
- Ability 3: Root Snare. Roots burst from the ground and briefly pin the player.
- Ultimate: Recall Curse. Rewinds the player to where they stood a few seconds earlier, then detonates that spot.

PNG folders:

- `level3/mirror-halo/`
- `level3/ember-ring/`
- `level3/root-snare/`
- `level3/recall-curse/`

## Level 4: On The Road - The Leyline Marauder

Theme: road magic, speed, blue comets, cracked leyline asphalt.

- Basic: Road Cleaver. Heavy magical cleave with blue sparks.
- Ability 1: Leyline Dash. Boss blinks forward in a straight line, leaving damaging blue road cracks.
- Ability 2: Blue Comet. Launches arcing comet shots that land near Ashtar and the player.
- Ability 3: Road Split. Splits the ground into several glowing lanes; unsafe lanes erupt.
- Ultimate: Time Mile. Slows the player, speeds enemies, and creates afterimages of the boss for a short burst.

PNG folders:

- `level4/leyline-dash/`
- `level4/blue-comet/`
- `level4/road-split/`
- `level4/time-mile/`

## Implementation Notes

- The current game code has structured animation hooks ready under `ASSETS.bosses.level1` through `level4`.
- Bosses use drawn placeholders and magic telegraphs until PNG arrays are filled.
- Gameplay logic is implemented in `scripts/game.js` with boss cast timers, hazards, projectiles, shields, roots, stamina drain, and time slow.
- PNG ability folders are ready for later art; the empty arrays can be filled when the final sprites are available.
