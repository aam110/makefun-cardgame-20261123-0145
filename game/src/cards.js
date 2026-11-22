// cards.js — every card in Ember Court: 40 named cards across 3 factions.
// Factions: FLAME (red, flame glyph), TIDE (blue, wave glyph), THORN (green, leaf glyph).
// Types: creature (cost, ATK, DEF=health), spell (instant effect), relic (persistent board effect).
// Effect keys are resolved by main.js applySpellEffect / relic hooks.

export const FACTIONS = {
  FLAME: { key: 'FLAME', name: 'Flame', color: '#e8491d', dark: '#8f1d05', light: '#ffb347', glyph: 'flame' },
  TIDE: { key: 'TIDE', name: 'Tide', color: '#1d7fe8', dark: '#0a3d7a', light: '#7fd4ff', glyph: 'wave' },
  THORN: { key: 'THORN', name: 'Thorn', color: '#2fae4e', dark: '#0f5c24', light: '#9be15d', glyph: 'leaf' },
};

export const CARDS = [
  // ---- FLAME creatures (10) ----
  { id: 'cinder-imp', name: 'Cinder Imp', faction: 'FLAME', type: 'creature', cost: 1, atk: 2, def: 1, text: 'A spark with teeth.' },
  { id: 'ember-whelp', name: 'Ember Whelp', faction: 'FLAME', type: 'creature', cost: 2, atk: 3, def: 2, text: 'It sneezes fire.' },
  { id: 'flame-hound', name: 'Flame Hound', faction: 'FLAME', type: 'creature', cost: 3, atk: 4, def: 3, text: 'Its bark is a bonfire.' },
  { id: 'cinder-knight', name: 'Cinder Knight', faction: 'FLAME', type: 'creature', cost: 4, atk: 5, def: 4, text: 'Armour forged in ash.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', faction: 'FLAME', type: 'creature', cost: 6, atk: 7, def: 5, text: 'Burn 2: scorches its foe.', effect: 'burn2' },
  { id: 'spark-squire', name: 'Spark Squire', faction: 'FLAME', type: 'creature', cost: 1, atk: 1, def: 2, text: 'Carries the torch.' },
  { id: 'magma-bear', name: 'Magma Bear', faction: 'FLAME', type: 'creature', cost: 5, atk: 6, def: 6, text: 'A mountain that walks.' },
  { id: 'coal-raven', name: 'Coal Raven', faction: 'FLAME', type: 'creature', cost: 2, atk: 2, def: 3, text: 'Draw 1 card when played.', effect: 'draw1' },
  { id: 'pyre-priest', name: 'Pyre Priest', faction: 'FLAME', type: 'creature', cost: 3, atk: 2, def: 4, text: 'Heal your Warden 3.', effect: 'heal3' },
  { id: 'inferno-drake', name: 'Inferno Drake', faction: 'FLAME', type: 'creature', cost: 7, atk: 8, def: 7, text: 'Burn 2 on every enemy.', effect: 'burnAll2' },
  // ---- TIDE creatures (9) ----
  { id: 'tidecaller', name: 'Tidecaller', faction: 'TIDE', type: 'creature', cost: 2, atk: 2, def: 3, text: 'Calls the deep.' },
  { id: 'brine-squire', name: 'Brine Squire', faction: 'TIDE', type: 'creature', cost: 1, atk: 1, def: 2, text: 'Salty and loyal.' },
  { id: 'coral-guard', name: 'Coral Guard', faction: 'TIDE', type: 'creature', cost: 3, atk: 3, def: 5, text: 'A living reef wall.' },
  { id: 'wave-serpent', name: 'Wave Serpent', faction: 'TIDE', type: 'creature', cost: 4, atk: 5, def: 4, text: 'Strikes from the foam.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', faction: 'TIDE', type: 'creature', cost: 8, atk: 9, def: 9, text: 'The tide itself, angry.' },
  { id: 'mist-eel', name: 'Mist Eel', faction: 'TIDE', type: 'creature', cost: 2, atk: 3, def: 1, text: 'Slips past every guard.' },
  { id: 'pearl-diver', name: 'Pearl Diver', faction: 'TIDE', type: 'creature', cost: 3, atk: 2, def: 3, text: 'Draw 1 card when played.', effect: 'draw1' },
  { id: 'storm-heron', name: 'Storm Heron', faction: 'TIDE', type: 'creature', cost: 5, atk: 6, def: 5, text: 'Deal 2 to all enemies.', effect: 'zapAll2' },
  { id: 'kelp-witch', name: 'Kelp Witch', faction: 'TIDE', type: 'creature', cost: 3, atk: 3, def: 3, text: 'Heal your Warden 4.', effect: 'heal4' },
  // ---- THORN creatures (9) ----
  { id: 'thornwall', name: 'Thornwall', faction: 'THORN', type: 'creature', cost: 2, atk: 1, def: 5, text: 'A wall that bites back.' },
  { id: 'briar-fox', name: 'Briar Fox', faction: 'THORN', type: 'creature', cost: 1, atk: 2, def: 1, text: 'Quick as a thorn prick.' },
  { id: 'root-golem', name: 'Root Golem', faction: 'THORN', type: 'creature', cost: 4, atk: 4, def: 6, text: 'Older than the court.' },
  { id: 'vine-stalker', name: 'Vine Stalker', faction: 'THORN', type: 'creature', cost: 3, atk: 4, def: 2, text: 'Strikes from the leaves.' },
  { id: 'ancient-oak', name: 'Ancient Oak', faction: 'THORN', type: 'creature', cost: 6, atk: 5, def: 8, text: 'Heal your Warden 5.', effect: 'heal5' },
  { id: 'spore-sprite', name: 'Spore Sprite', faction: 'THORN', type: 'creature', cost: 1, atk: 1, def: 1, text: 'Draw 1 card when played.', effect: 'draw1' },
  { id: 'nettle-knight', name: 'Nettle Knight', faction: 'THORN', type: 'creature', cost: 4, atk: 5, def: 5, text: 'Every hit stings twice.' },
  { id: 'grove-warden', name: 'Grove Warden', faction: 'THORN', type: 'creature', cost: 5, atk: 6, def: 6, text: 'The grove fights back.' },
  { id: 'seedling-scout', name: 'Seedling Scout', faction: 'THORN', type: 'creature', cost: 2, atk: 2, def: 2, text: 'Small, swift, stubborn.' },
  // ---- Spells (8) ----
  { id: 'ember-volley', name: 'Ember Volley', faction: 'FLAME', type: 'spell', cost: 2, text: 'Deal 3 damage to any target.', effect: 'dmg3' },
  { id: 'brine-shield', name: 'Brine Shield', faction: 'TIDE', type: 'spell', cost: 2, text: 'Heal your Warden 6.', effect: 'heal6' },
  { id: 'thorn-snare', name: 'Thorn Snare', faction: 'THORN', type: 'spell', cost: 2, text: 'Deal 2 + Burn 2 to a creature.', effect: 'dmg2burn2' },
  { id: 'wildfire', name: 'Wildfire', faction: 'FLAME', type: 'spell', cost: 4, text: 'Deal 2 to ALL enemy creatures.', effect: 'dmgAll2' },
  { id: 'tidal-surge', name: 'Tidal Surge', faction: 'TIDE', type: 'spell', cost: 3, text: 'Draw 2 cards.', effect: 'draw2' },
  { id: 'gilded-bargain', name: 'Gilded Bargain', faction: 'FLAME', type: 'spell', cost: 3, text: 'Draw 2, then deal 2 to your Warden.', effect: 'draw2self2' },
  { id: 'overgrowth', name: 'Overgrowth', faction: 'THORN', type: 'spell', cost: 3, text: 'Give your creatures +2 ATK.', effect: 'buffAll2' },
  { id: 'ember-blast', name: 'Ember Blast', faction: 'FLAME', type: 'spell', cost: 5, text: 'Deal 5 damage to any target.', effect: 'dmg5' },
  // ---- Relics (4) ----
  { id: 'ember-heart', name: 'Ember Heart', faction: 'FLAME', type: 'relic', cost: 3, text: 'Your Flame creatures get +1 ATK.', effect: 'flameAtk1' },
  { id: 'tide-pearl', name: 'Tide Pearl', faction: 'TIDE', type: 'relic', cost: 3, text: 'Heal 2 at the start of your turn.', effect: 'regen2' },
  { id: 'thorn-crown', name: 'Thorn Crown', faction: 'THORN', type: 'relic', cost: 3, text: 'Your Thorn creatures get +1 DEF.', effect: 'thornDef1' },
  { id: 'gilded-coin', name: 'Gilded Coin', faction: 'FLAME', type: 'relic', cost: 2, text: 'Gain +1 max ember each turn.', effect: 'emberPlus1' },
];

export function cardById(id) { return CARDS.find((c) => c.id === id); }

// Seeded RNG (mulberry32) so staged shots are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  return deck;
}

// Build a fresh 40-card deck: one of each card, shuffled. Deck list is the full CARDS table.
export function buildDeck(seed) {
  const rng = makeRng(seed);
  return shuffle(CARDS.map((c) => ({ ...c, uid: 0 })), rng);
}

let uidCounter = 1;
export function freshCardInstance(def) {
  return { ...def, uid: uidCounter++, hp: def.def || 0, maxHp: def.def || 0, burn: 0, canAttack: false, justPlayed: true };
}

export function deckCounts(deck) {
  const counts = { FLAME: 0, TIDE: 0, THORN: 0 };
  for (const c of deck) counts[c.faction]++;
  return counts;
}
