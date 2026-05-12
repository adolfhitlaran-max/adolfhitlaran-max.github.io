// =============================================================
// UPGRADE SYSTEM MODULE
// Between-wave choices are intentionally build-defining:
// melee, energy, shockwave, escort, economy, and mobility.
// =============================================================

(function (global) {
  const BASE_STATS = Object.freeze({
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
  });

  const upgrades = [
    {
      id: 'iron-fist',
      name: 'Iron Fist',
      tag: 'Melee',
      rarity: 'common',
      maxLevel: 5,
      description: level => `Punches and kicks gain +${7 * level} base damage.`,
      apply(stats, level) {
        stats.attackDamage += 7 * level;
      }
    },
    {
      id: 'combo-engine',
      name: 'Combo Engine',
      tag: 'Melee',
      rarity: 'rare',
      maxLevel: 4,
      description: level => `Melee gains up to +${Math.round(level * 1.8 * 10)}% damage from your active combo.`,
      apply(stats, level) {
        stats.comboDamageBonus += 0.018 * level;
      }
    },
    {
      id: 'golden-roundhouse',
      name: 'Golden Roundhouse',
      tag: 'Kick',
      rarity: 'rare',
      maxLevel: 3,
      description: level => `Every third punch kick hits ${Math.round((1.45 + 0.2 * level) * 100)}% as hard and shoves harder.`,
      apply(stats, level) {
        stats.kickDamageMultiplier += 0.2 * level;
        stats.kickStun += 0.12 * level;
      }
    },
    {
      id: 'pressure-points',
      name: 'Pressure Points',
      tag: 'Crit',
      rarity: 'epic',
      maxLevel: 3,
      description: level => `${8 * level}% melee crit chance, with harder crits at higher levels.`,
      apply(stats, level) {
        stats.meleeCritChance += 0.08 * level;
        stats.meleeCritMultiplier += 0.14 * level;
      }
    },
    {
      id: 'quick-hands',
      name: 'Quick Hands',
      tag: 'Speed',
      rarity: 'common',
      maxLevel: 4,
      description: level => `Punch recovery is ${Math.round((1 - Math.pow(0.88, level)) * 100)}% faster.`,
      apply(stats, level) {
        stats.attackCooldown *= Math.pow(0.88, level);
      }
    },
    {
      id: 'blue-core',
      name: 'Blue Core',
      tag: 'Energy',
      rarity: 'common',
      maxLevel: 5,
      description: level => `Energy shots deal +${18 * level}% damage and grow brighter.`,
      apply(stats, level) {
        stats.energyDamageMultiplier += 0.18 * level;
        stats.energySizeBonus += 1.5 * level;
      }
    },
    {
      id: 'rail-spark',
      name: 'Rail Spark',
      tag: 'Energy',
      rarity: 'rare',
      maxLevel: 3,
      description: level => `Energy shots fly faster and pierce ${level} extra target${level === 1 ? '' : 's'}.`,
      apply(stats, level) {
        stats.energySpeedBonus += 120 * level;
        stats.energyPierce += level;
      }
    },
    {
      id: 'capacitor-belt',
      name: 'Capacitor Belt',
      tag: 'Stamina',
      rarity: 'common',
      maxLevel: 4,
      description: level => `+${22 * level} stamina, faster regen, and cheaper energy shots.`,
      apply(stats, level) {
        stats.staminaMax += 22 * level;
        stats.staminaRegen += 8 * level;
        stats.dashCost = Math.max(9, stats.dashCost - 2 * level);
      }
    },
    {
      id: 'shockwave-core',
      name: 'Shockwave Core',
      tag: 'Shockwave',
      rarity: 'common',
      maxLevel: 4,
      description: level => `Shockwave gains +${18 * level} damage, bigger radius, and lower cost.`,
      apply(stats, level) {
        stats.specialDamage += 18 * level;
        stats.specialRadius += 24 * level;
        stats.specialCost = Math.max(16, stats.specialCost - 4 * level);
      }
    },
    {
      id: 'frozen-ring',
      name: 'Frozen Ring',
      tag: 'Shockwave',
      rarity: 'rare',
      maxLevel: 3,
      description: level => `Shockwave chills enemies for ${level.toFixed(1)}s and recovers faster.`,
      apply(stats, level) {
        stats.shockwaveSlow += 1.0 * level;
        stats.specialCooldown *= Math.pow(0.86, level);
      }
    },
    {
      id: 'resonant-refund',
      name: 'Resonant Refund',
      tag: 'Shockwave',
      rarity: 'epic',
      maxLevel: 3,
      description: level => `Shockwave refunds ${10 * level}% stamina cost for each enemy caught, capped at full refund.`,
      apply(stats, level) {
        stats.shockwaveRefund += 0.1 * level;
      }
    },
    {
      id: 'ashtar-ward',
      name: 'Ashtar Ward',
      tag: 'Escort',
      rarity: 'common',
      maxLevel: 5,
      description: level => `Ashtar gains +${30 * level} max health and repairs between waves.`,
      apply(stats, level) {
        stats.baseMaxHpBonus += 30 * level;
        stats.baseRepairPerWave += 8 * level;
      }
    },
    {
      id: 'guardian-aura',
      name: 'Guardian Aura',
      tag: 'Escort',
      rarity: 'rare',
      maxLevel: 4,
      description: level => `Ashtar takes ${Math.min(48, 12 * level)}% less damage and shocks attackers.`,
      apply(stats, level) {
        stats.ashtarDamageReduction += 0.12 * level;
        stats.barricadeThorns += 5 * level;
      }
    },
    {
      id: 'field-medic',
      name: 'Field Medic',
      tag: 'Survival',
      rarity: 'common',
      maxLevel: 4,
      description: level => `+${18 * level} max health and +${10 * level} healing between waves.`,
      apply(stats, level) {
        stats.playerMaxHp += 18 * level;
        stats.waveHeal += 10 * level;
        stats.pickupHealBonus += 0.08 * level;
      }
    },
    {
      id: 'phase-dash',
      name: 'Phase Dash',
      tag: 'Mobility',
      rarity: 'rare',
      maxLevel: 3,
      description: level => `Dash travels farther, recovers faster, and grants longer invulnerability.`,
      apply(stats, level) {
        stats.dashVelocity += 95 * level;
        stats.dashCooldown *= Math.pow(0.86, level);
        stats.dashInvulnBonus += 0.05 * level;
      }
    },
    {
      id: 'sprinter-boots',
      name: 'Sprinter Boots',
      tag: 'Mobility',
      rarity: 'common',
      maxLevel: 3,
      description: level => `Movement speed increases by +${28 * level} and jump power rises slightly.`,
      apply(stats, level) {
        stats.playerSpeed += 28 * level;
        stats.jumpPower += 24 * level;
      }
    },
    {
      id: 'field-salvage',
      name: 'Field Salvage',
      tag: 'Pickups',
      rarity: 'common',
      maxLevel: 3,
      description: level => `Pickups magnetize from +${40 * level} farther away and heal more.`,
      apply(stats, level) {
        stats.pickupMagnet += 40 * level;
        stats.pickupHealBonus += 0.1 * level;
      }
    },
    {
      id: 'scrapper-king',
      name: 'Scrapper King',
      tag: 'Economy',
      rarity: 'rare',
      maxLevel: 3,
      description: level => `Enemies drop ${Math.round((1 + 0.3 * level) * 100)}% coin value and better choices appear more often.`,
      apply(stats, level) {
        stats.coinMultiplier += 0.3 * level;
        stats.bonusChoiceChance += 0.08 * level;
      }
    },
    {
      id: 'agartha-signal',
      name: 'Agartha Signal',
      tag: 'Legendary',
      rarity: 'legendary',
      maxLevel: 2,
      description: level => `A rare route blessing: +${12 * level}% damage, +${10 * level}% escort defense, and stronger drops.`,
      apply(stats, level) {
        stats.attackDamage += 8 * level;
        stats.energyDamageMultiplier += 0.12 * level;
        stats.specialDamage += 12 * level;
        stats.ashtarDamageReduction += 0.1 * level;
        stats.coinMultiplier += 0.15 * level;
      }
    }
  ];

  const rarityRank = { common: 1, rare: 2, epic: 3, legendary: 4 };
  const levels = Object.create(null);
  upgrades.forEach(upgrade => { levels[upgrade.id] = 0; });

  function cloneBaseStats() {
    return JSON.parse(JSON.stringify(BASE_STATS));
  }

  function getUpgradeById(id) {
    return upgrades.find(upgrade => upgrade.id === id);
  }

  function getLevel(id) {
    return levels[id] || 0;
  }

  function reset() {
    upgrades.forEach(upgrade => { levels[upgrade.id] = 0; });
  }

  function getStats() {
    const stats = cloneBaseStats();
    for (const upgrade of upgrades) {
      const level = getLevel(upgrade.id);
      if (level > 0) upgrade.apply(stats, level);
    }
    stats.ashtarDamageReduction = Math.min(0.72, stats.ashtarDamageReduction);
    stats.meleeCritChance = Math.min(0.55, stats.meleeCritChance);
    return stats;
  }

  function getChoices(count = 4) {
    const stats = getStats();
    const taken = getTakenCount();
    const available = upgrades.filter(upgrade => getLevel(upgrade.id) < upgrade.maxLevel);
    const pool = available
      .filter(upgrade => upgrade.rarity !== 'legendary' || taken >= 5)
      .slice();
    const choices = [];
    const tagSeen = new Set();

    while (choices.length < Math.min(count, pool.length)) {
      const weighted = pickWeighted(pool, stats, taken, tagSeen);
      if (!weighted) break;
      choices.push(weighted);
      tagSeen.add(weighted.tag);
      pool.splice(pool.indexOf(weighted), 1);
    }

    return choices
      .sort((a, b) => rarityRank[b.rarity] - rarityRank[a.rarity])
      .map(upgrade => choiceView(upgrade));
  }

  function choiceView(upgrade) {
    const nextLevel = getLevel(upgrade.id) + 1;
    return {
      id: upgrade.id,
      name: upgrade.name,
      tag: upgrade.tag,
      rarity: upgrade.rarity,
      currentLevel: getLevel(upgrade.id),
      nextLevel,
      maxLevel: upgrade.maxLevel,
      description: upgrade.description(nextLevel)
    };
  }

  function pickWeighted(pool, stats, taken, tagSeen) {
    if (!pool.length) return null;
    const weighted = pool.map(upgrade => {
      let weight = 1;
      if (upgrade.rarity === 'common') weight = 8;
      if (upgrade.rarity === 'rare') weight = 4 + taken * 0.12 + stats.bonusChoiceChance * 8;
      if (upgrade.rarity === 'epic') weight = 1.25 + Math.max(0, taken - 3) * 0.18 + stats.bonusChoiceChance * 7;
      if (upgrade.rarity === 'legendary') weight = 0.28 + Math.max(0, taken - 7) * 0.12 + stats.bonusChoiceChance * 4;
      if (tagSeen.has(upgrade.tag)) weight *= 0.3;
      if (getLevel(upgrade.id) > 0) weight *= 1.35;
      return { upgrade, weight };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.upgrade;
    }
    return weighted[weighted.length - 1].upgrade;
  }

  function applyUpgrade(id) {
    const upgrade = getUpgradeById(id);
    if (!upgrade) return null;
    if (getLevel(id) >= upgrade.maxLevel) return null;
    levels[id]++;
    return {
      id: upgrade.id,
      name: upgrade.name,
      rarity: upgrade.rarity,
      level: levels[id],
      maxLevel: upgrade.maxLevel,
      stats: getStats()
    };
  }

  function getTakenCount() {
    return Object.values(levels).reduce((total, level) => total + level, 0);
  }

  function getSummary() {
    const taken = upgrades
      .filter(upgrade => getLevel(upgrade.id) > 0)
      .map(upgrade => `${upgrade.name} ${getLevel(upgrade.id)}`);
    return taken.length ? taken.join(' - ') : 'No upgrades yet';
  }

  global.UPGRADE_SYSTEM = {
    BASE_STATS,
    upgrades,
    levels,
    reset,
    getStats,
    getChoices,
    applyUpgrade,
    getTakenCount,
    getSummary
  };
})(window);
