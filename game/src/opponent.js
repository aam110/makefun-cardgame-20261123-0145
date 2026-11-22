// opponent.js — the 5 campaign rivals and the AI that plays them.
// Each rival has a name, faction, portrait palette, personality tweak and a taunt line.
// The AI is deliberately readable: play affordable creatures, cast spells at value,
// use the hero power when it is lethal or good value, then attack with everything.

export const RIVALS = [
  {
    id: 'pip', name: 'Pip Sproutling', title: 'Thorn Novice', faction: 'THORN',
    life: 30, deckBias: 'THORN', portrait: ['#2fae4e', '#9be15d', '#0f5c24'],
    taunt: 'I grew up in the grove. You will not pass!',
    medal: 'Sprout Medal', reward: 'Unlock Captain Brine',
  },
  {
    id: 'brine', name: 'Captain Brine', title: 'Tide Captain', faction: 'TIDE',
    life: 30, deckBias: 'TIDE', portrait: ['#1d7fe8', '#7fd4ff', '#0a3d7a'],
    taunt: 'The tide takes what it is owed, Warden.',
    medal: 'Brine Medal', reward: 'Unlock Duchess Cinder',
  },
  {
    id: 'cinder', name: 'Duchess Cinder', title: 'Flame Duchess', faction: 'FLAME',
    life: 30, deckBias: 'FLAME', portrait: ['#e8491d', '#ffb347', '#8f1d05'],
    taunt: 'Every ember in this court answers to me.',
    medal: 'Cinder Medal', reward: 'Unlock The Gilded Broker',
  },
  {
    id: 'broker', name: 'The Gilded Broker', title: 'Coin Trader', faction: 'FLAME',
    life: 30, deckBias: 'FLAME', portrait: ['#d4a017', '#ffe27a', '#6b4e00'],
    taunt: 'Everything has a price. Even your crown.',
    medal: 'Gilded Medal', reward: 'Unlock The Hollow King',
  },
  {
    id: 'hollow', name: 'The Hollow King', title: 'Final Rival', faction: 'THORN',
    life: 34, deckBias: 'THORN', portrait: ['#6b21a8', '#c084fc', '#2e1065'],
    taunt: 'The court is mine. Kneel, little Warden.',
    medal: 'Hollow Crown', reward: 'Champion of Ember Court',
  },
];

export function rivalById(id) { return RIVALS.find((r) => r.id === id); }
export function rivalByIndex(i) { return RIVALS[Math.max(0, Math.min(RIVALS.length - 1, i))]; }

// AI turn: state is the live game state object owned by main.js.
// The AI plays cards from its hand, uses its hero power, then attacks with all creatures.
// Returns a list of log strings describing what happened.
export function runAiTurn(state, log) {
  const ai = state.ai;
  const me = state.player;
  const out = [];
  const push = (s) => { out.push(s); if (log) log(s); };

  ai.manaMax = Math.min(10, ai.manaMax + 1);
  ai.mana = ai.manaMax;
  ai.heroUsed = false;
  // Burn ticks at the start of the AI's turn.
  for (const c of ai.board) {
    if (c.burn > 0) { c.hp -= c.burn; push(`${c.name} burns for ${c.burn}!`); }
  }
  state.cleanupBoard(ai);
  if (state.isOver()) return out;
  // Draw 1.
  if (ai.deck.length > 0 && ai.hand.length < 7) {
    const d = ai.deck.pop(); ai.hand.push(d);
  }
  // Relic regen for AI.
  if (ai.relics.some((r) => r.effect === 'regen2')) { ai.life = Math.min(ai.maxLife, ai.life + 2); push('Tide Pearl heals the rival +2.'); }

  const rival = state.rival;
  const bias = rival.deckBias;
  // Play cards: biased faction first, cheapest first, creatures before spells.
  let played = 0;
  const handOrder = [...ai.hand].sort((a, b) => {
    const ba = a.faction === bias ? 0 : 1, bb = b.faction === bias ? 0 : 1;
    if (ba !== bb) return ba - bb;
    if (a.type !== b.type) return a.type === 'creature' ? -1 : 1;
    return a.cost - b.cost;
  });
  for (const card of handOrder) {
    if (played >= 4) break;
    if (card.cost > ai.mana) continue;
    if (card.type === 'creature' && ai.board.length >= 5) continue;
    // Cinder loves Burn spells; Brine loves healing/draw; Broker loves bargains.
    if (card.type === 'spell' && card.effect === 'heal6' && ai.life > 26) continue;
    if (card.type === 'spell' && card.effect === 'draw2' && ai.hand.length > 5) continue;
    ai.hand = ai.hand.filter((h) => h.uid !== card.uid);
    ai.mana -= card.cost;
    state.playCardOnBoard(ai, card, true);
    push(`${rival.name} plays ${card.name}.`);
    played++;
    if (state.isOver()) return out;
  }
  // Hero power: Kindle (2 ember, 1 damage) when lethal or a good target exists.
  if (!ai.heroUsed && ai.mana >= 2) {
    const target = me.board.find((c) => c.hp <= 1) || (me.life <= 1 ? 'hero' : null);
    if (target) {
      ai.mana -= 2; ai.heroUsed = true;
      if (target === 'hero') { me.life -= 1; push(`${rival.name} Kindles you for 1!`); }
      else { target.hp -= 1; push(`${rival.name} Kindles ${target.name} for 1!`); }
      state.cleanupBoard(me);
      if (state.isOver()) return out;
    }
  }
  // Attack with every creature that can attack.
  for (const c of [...ai.board]) {
    if (state.isOver()) break;
    if (me.board.length > 0) {
      // Attack the weakest player creature (readable, counterable).
      const victim = [...me.board].sort((a, b) => a.hp - b.hp)[0];
      victim.hp -= c.atk;
      push(`${c.name} strikes ${victim.name} for ${c.atk}.`);
      state.cleanupBoard(me);
    } else {
      me.life -= c.atk;
      push(`${c.name} hits the Warden for ${c.atk}!`);
    }
    if (state.isOver()) return out;
  }
  return out;
}
