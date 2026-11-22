// main.js — Ember Court entry point: game state, turn loop, input, ?shot= staging.
// Title -> duel -> win/loss -> next rival. Mouse + keyboard. No network, no assets.

import { CARDS, FACTIONS, buildDeck, freshCardInstance, makeRng, shuffle } from './cards.js';
import { RIVALS, rivalByIndex, runAiTurn } from './opponent.js';
import { draw, W, H, HUD_X, handRects, boardRects } from './render.js';
import * as audio from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;

const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') || '7', 10) || 7;

function newSide(life, deckSeed) {
  return {
    life, maxLife: life, mana: 1, manaMax: 1, heroUsed: false,
    deck: buildDeck(deckSeed), hand: [], board: [], relics: [], discard: [],
    comboCount: 0, comboFaction: null,
  };
}

function makeState() {
  return {
    screen: 'title', turn: 1, phase: 'player', rivalIndex: 2, rival: RIVALS[2],
    campaign: RIVALS, unlocked: 2, stars: { pip: 3, brine: 2 },
    player: newSide(30, seed), ai: newSide(30, seed + 101),
    log: [], selectedHand: -1, attackerUid: null, heroTargeting: false,
    cardsPlayed: 0, particles: [], showAnnotations: false, muted: false,
    message: '',
  };
}

const state = makeState();
window.__game = state; // test hook for CDP play-testing

function log(s) { state.log.push(s); if (state.log.length > 40) state.log.shift(); }

function drawCards(side, n) {
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0) break;
    if (side.hand.length >= 7) break;
    side.hand.push(freshCardInstance(side.deck.pop()));
  }
}

function cleanupBoard(side) {
  const dead = side.board.filter((c) => c.hp <= 0);
  for (const d of dead) { side.discard.push(d); log(`${d.name} falls.`); }
  side.board = side.board.filter((c) => c.hp > 0);
}
state.cleanupBoard = cleanupBoard;

function isOver() { return state.player.life <= 0 || state.ai.life <= 0; }
state.isOver = isOver;

function checkEnd() {
  if (state.ai.life <= 0) {
    state.screen = 'win';
    state.stars[state.rival.id] = 3;
    state.unlocked = Math.max(state.unlocked, Math.min(RIVALS.length - 1, state.rivalIndex + 1));
    audio.playWin();
    log(`Victory over ${state.rival.name}!`);
  } else if (state.player.life <= 0) {
    state.screen = 'loss';
    audio.playLoss();
    log(`${state.rival.name} prevails…`);
  }
}

function applyRelicBonus(side, card) {
  if (card.effect === 'flameAtk1') for (const c of side.board) if (c.faction === 'FLAME') c.atk += 1;
  if (card.effect === 'thornDef1') for (const c of side.board) if (c.faction === 'THORN') { c.hp += 1; c.maxHp += 1; }
}

function applySpell(side, foe, card, target) {
  const eff = card.effect;
  if (eff === 'dmg3' || eff === 'dmg5') {
    const dmg = eff === 'dmg3' ? 3 : 5;
    if (target === 'hero') { foe.life -= dmg; log(`${card.name} hits the rival for ${dmg}!`); }
    else if (target) { target.hp -= dmg; log(`${card.name} hits ${target.name} for ${dmg}.`); }
  } else if (eff === 'dmg2burn2') {
    if (target) { target.hp -= 2; target.burn += 2; log(`${card.name}: ${target.name} takes 2 and burns 2.`); }
  } else if (eff === 'dmgAll2') {
    for (const c of foe.board) c.hp -= 2;
    log(`${card.name} scorches every enemy creature for 2.`);
  } else if (eff === 'heal6') { side.life = Math.min(side.maxLife, side.life + 6); audio.playHeal(); log(`${card.name} heals ${side === state.player ? 'you' : 'the rival'} +6.`); }
  else if (eff === 'draw2') { drawCards(side, 2); log(`${card.name}: draw 2 cards.`); }
  else if (eff === 'draw2self2') { drawCards(side, 2); side.life -= 2; log(`${card.name}: draw 2, pay 2 life.`); }
  else if (eff === 'buffAll2') { for (const c of side.board) c.atk += 2; log(`${card.name}: your creatures gain +2 ATK.`); }
  cleanupBoard(foe);
}

function onPlayCreatureEffects(side, foe, card) {
  if (card.effect === 'draw1') { drawCards(side, 1); log(`${card.name}: draw 1 card.`); }
  if (card.effect === 'heal3') { side.life = Math.min(side.maxLife, side.life + 3); audio.playHeal(); }
  if (card.effect === 'heal4') { side.life = Math.min(side.maxLife, side.life + 4); audio.playHeal(); }
  if (card.effect === 'heal5') { side.life = Math.min(side.maxLife, side.life + 5); audio.playHeal(); }
  if (card.effect === 'burn2' && foe.board.length) { const t = foe.board[0]; t.burn += 2; log(`${card.name} sets ${t.name} burning (2).`); }
  if (card.effect === 'burnAll2') { for (const c of foe.board) c.burn += 2; log(`${card.name} sets every enemy burning (2).`); }
  if (card.effect === 'zapAll2') { for (const c of foe.board) c.hp -= 2; cleanupBoard(foe); log(`${card.name} zaps every enemy for 2.`); }
}

// Shared by player + AI: put a card onto a side's board / relic row / spell resolution.
function playCardOnBoard(side, card, isAi) {
  const foe = side === state.player ? state.ai : state.player;
  if (card.type === 'creature') {
    const inst = freshCardInstance(card);
    if (side.relics.some((r) => r.effect === 'flameAtk1') && inst.faction === 'FLAME') inst.atk += 1;
    if (side.relics.some((r) => r.effect === 'thornDef1') && inst.faction === 'THORN') { inst.hp += 1; inst.maxHp += 1; }
    inst.canAttack = false; // summoning sickness: attacks next turn
    side.board.push(inst);
    onPlayCreatureEffects(side, foe, inst);
  } else if (card.type === 'relic') {
    side.relics.push({ ...card, uid: Date.now() + Math.random() });
    applyRelicBonus(side, card);
    log(`${card.name} relic takes its place on the table.`);
  } else {
    // Spell: pick a sensible default target (weakest enemy creature, else hero).
    let target = foe.board.length ? [...foe.board].sort((a, b) => a.hp - b.hp)[0] : 'hero';
    if (card.effect === 'dmg2burn2' && !foe.board.length) target = 'hero';
    applySpell(side, foe, card, target);
  }
  if (!isAi) { state.cardsPlayed++; audio.playCard(); }
}
state.playCardOnBoard = playCardOnBoard;

function startDuel(index) {
  state.rivalIndex = index;
  state.rival = rivalByIndex(index);
  state.player = newSide(30, seed + index * 13);
  state.ai = newSide(state.rival.life, seed + 101 + index * 29);
  state.turn = 1; state.phase = 'player'; state.screen = 'duel';
  state.log = [`Duel ${index + 1}: ${state.rival.name} — "${state.rival.taunt}"`];
  state.selectedHand = -1; state.attackerUid = null; state.heroTargeting = false;
  state.cardsPlayed = 0; state.showAnnotations = false;
  drawCards(state.player, 4); drawCards(state.ai, 4);
  // Player starts with a small board presence so the mid-game shot is dense.
  spawnParticles();
}

function spawnParticles() {
  state.particles = [];
  const rng = makeRng(seed * 31 + 5);
  for (let i = 0; i < 26; i++) {
    state.particles.push({ x: rng() * 980, y: rng() * 720, r: 1 + rng() * 2.5, color: ['rgba(255,140,26,0.8)', 'rgba(255,210,100,0.7)', 'rgba(255,80,40,0.6)'][i % 3], vy: 0.2 + rng() * 0.4 });
  }
}

function startPlayerTurn() {
  const p = state.player;
  p.manaMax = Math.min(10, p.manaMax + 1);
  if (p.relics.some((r) => r.effect === 'emberPlus1')) p.manaMax = Math.min(10, p.manaMax + 1);
  p.mana = p.manaMax; p.heroUsed = false; p.comboCount = 0; p.comboFaction = null;
  for (const c of p.board) { c.canAttack = true; if (c.burn > 0) { c.hp -= c.burn; log(`${c.name} burns for ${c.burn}!`); audio.playBurn(); } }
  cleanupBoard(p);
  if (p.relics.some((r) => r.effect === 'regen2')) { p.life = Math.min(p.maxLife, p.life + 2); log('Tide Pearl heals you +2.'); }
  drawCards(p, 1);
  state.turn++;
  state.phase = 'player';
  audio.playTurn();
  log(`Turn ${state.turn} — your move.`);
  checkEnd();
}

function endTurn() {
  if (state.screen !== 'duel' || state.phase !== 'player') return;
  state.phase = 'ai';
  state.selectedHand = -1; state.attackerUid = null;
  log('You end your turn.');
  setTimeout(() => {
    if (state.screen !== 'duel') return;
    runAiTurn(state, log);
    checkEnd();
    if (state.screen === 'duel') startPlayerTurn();
    draw(ctx, state);
  }, 650);
}

function playHandCard(index) {
  const p = state.player;
  const card = p.hand[index];
  if (!card || state.phase !== 'player') { audio.playError(); return; }
  if (card.cost > p.mana) { log(`Not enough ember for ${card.name}.`); audio.playError(); return; }
  if (card.type === 'creature' && p.board.length >= 5) { log('Your board is full (5 creatures).'); audio.playError(); return; }
  p.hand.splice(index, 1);
  p.mana -= card.cost;
  // Combo: same faction as the previous card this turn.
  if (p.comboFaction === card.faction) {
    p.comboCount++;
    if (p.comboCount >= 2) { for (const c of p.board) c.atk += 0; /* buff applied at attack time via combo flag */ }
  } else { p.comboFaction = card.faction; p.comboCount = 1; }
  if (p.comboCount >= 2) log(`Combo ×${p.comboCount}! Same faction — your creatures strike harder.`);
  p.discard.push(card);
  playCardOnBoard(p, card, false);
  state.selectedHand = -1;
  checkEnd();
}

function attackWith(attackerUid, target) {
  const p = state.player;
  const atk = p.board.find((c) => c.uid === attackerUid);
  if (!atk || !atk.canAttack || state.phase !== 'player') { audio.playError(); return; }
  const bonus = p.comboCount >= 2 ? 1 : 0;
  const dmg = atk.atk + bonus;
  audio.playAttack();
  if (target === 'hero') {
    state.ai.life -= dmg;
    log(`${atk.name} hits ${state.rival.name} for ${dmg}${bonus ? ' (combo +1)' : ''}!`);
  } else {
    target.hp -= dmg;
    log(`${atk.name} strikes ${target.name} for ${dmg}${bonus ? ' (combo +1)' : ''}.`);
    cleanupBoard(state.ai);
  }
  atk.canAttack = false;
  state.attackerUid = null;
  checkEnd();
}

function heroPower(target) {
  const p = state.player;
  if (p.heroUsed || p.mana < 2 || state.phase !== 'player') { audio.playError(); return; }
  p.mana -= 2; p.heroUsed = true;
  if (target === 'hero') { state.ai.life -= 1; log('Kindle scorches the rival for 1!'); }
  else if (target) { target.hp -= 1; log(`Kindle scorches ${target.name} for 1!`); cleanupBoard(state.ai); }
  state.heroTargeting = false;
  audio.playBurn();
  checkEnd();
}

// ---- Input ----
function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);
  const y = (e.clientY - rect.top) * (H / rect.height);
  handleClick(x, y);
});

function handleClick(x, y) {
  if (state.screen === 'title') {
    if (x >= 540 && x <= 740 && y >= 500 && y <= 552) { audio.playClick(); startDuel(state.unlocked); }
    // Click a campaign row to challenge that rival directly.
    state.campaign.forEach((r, i) => {
      if (i <= state.unlocked && x >= 220 && x <= 1060 && y >= 340 + i * 28 && y <= 360 + i * 28) { audio.playClick(); startDuel(i); }
    });
    return;
  }
  if (state.screen === 'win' || state.screen === 'loss') {
    if (x >= 480 && x <= 800 && y >= 430 && y <= 482) {
      audio.playClick();
      if (state.screen === 'win') startDuel(Math.min(RIVALS.length - 1, state.rivalIndex + 1));
      else startDuel(state.rivalIndex);
    }
    if (x >= 480 && x <= 800 && y >= 496 && y <= 540) { audio.playClick(); state.screen = 'title'; }
    return;
  }
  // Duel screen.
  if (state.phase !== 'player') return;
  // Hero power button.
  if (x >= 620 && x <= 770 && y >= 470 && y <= 510) {
    if (!state.player.heroUsed && state.player.mana >= 2) { state.heroTargeting = true; log('Kindle ready — click an enemy creature or the rival portrait.'); audio.playClick(); }
    else audio.playError();
    return;
  }
  // End turn button.
  if (x >= 790 && x <= 940 && y >= 470 && y <= 510) { endTurn(); return; }
  // Rival portrait = hero target for Kindle / attack.
  if (x >= 50 && x <= 340 && y >= 20 && y <= 110) {
    if (state.heroTargeting) { heroPower('hero'); return; }
    if (state.attackerUid) { attackWith(state.attackerUid, 'hero'); return; }
  }
  // Rival board creatures.
  for (const r of boardRects('ai', state)) {
    if (inRect(x, y, r)) {
      if (state.heroTargeting) { heroPower(r.card); return; }
      if (state.attackerUid) { attackWith(state.attackerUid, r.card); return; }
    }
  }
  // Player board: select attacker.
  for (const r of boardRects('player', state)) {
    if (inRect(x, y, r)) {
      if (r.card.canAttack) { state.attackerUid = r.card.uid; log(`${r.card.name} ready — click an enemy to attack.`); audio.playClick(); }
      else { log(`${r.card.name} cannot attack yet (summoning sickness).`); }
      return;
    }
  }
  // Hand cards.
  for (const r of handRects(state)) {
    if (inRect(x, y, r)) { state.selectedHand = r.index; playHandCard(r.index); return; }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { state.screen = 'title'; state.selectedHand = -1; return; }
  if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); endTurn(); return; }
  if (e.key === 'm' || e.key === 'M') { state.muted = audio.toggleMute(); return; }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 7 && state.screen === 'duel') playHandCard(n - 1);
});

// ---- Shot staging: real renders of this code for the 4 screenshots ----
function stageCover() {
  startDuel(2); // Duchess Cinder
  state.turn = 7;
  const p = state.player, a = state.ai;
  p.life = 30; a.life = 22;
  p.mana = 6; p.manaMax = 7; a.mana = 5; a.manaMax = 7;
  p.comboCount = 3; p.comboFaction = 'FLAME';
  // Player board: 3 creatures.
  p.board = [
    freshCardInstance(CARDS.find((c) => c.id === 'cinder-imp')), // 2/1
    freshCardInstance(CARDS.find((c) => c.id === 'flame-hound')),
    freshCardInstance(CARDS.find((c) => c.id === 'cinder-knight')),
  ];
  p.board[0].atk = 3; p.board[0].canAttack = true;
  p.board[1].canAttack = true; p.board[2].canAttack = true;
  // Rival board: 3 creatures, one burning.
  a.board = [
    freshCardInstance(CARDS.find((c) => c.id === 'tidecaller')),
    freshCardInstance(CARDS.find((c) => c.id === 'coral-guard')),
    freshCardInstance(CARDS.find((c) => c.id === 'ash-phoenix')),
  ];
  a.board[1].burn = 2; a.board[2].hp = 4;
  a.board.forEach((c) => { c.canAttack = true; });
  // Player hand: 6 readable cards.
  const handIds = ['ember-volley', 'cinder-imp', 'brine-shield', 'flame-hound', 'thornwall', 'gilded-bargain'];
  p.hand = handIds.map((id) => freshCardInstance(CARDS.find((c) => c.id === id)));
  // Rival hand face-down: 5.
  a.hand = [0, 1, 2, 3, 4].map(() => freshCardInstance(CARDS[0]));
  p.relics = [freshCardInstance(CARDS.find((c) => c.id === 'ember-heart'))];
  a.relics = [freshCardInstance(CARDS.find((c) => c.id === 'tide-pearl'))];
  p.deck = p.deck.slice(0, 18); a.deck = a.deck.slice(0, 21);
  p.discard = [freshCardInstance(CARDS[0]), freshCardInstance(CARDS[1])];
  a.discard = [freshCardInstance(CARDS[2])];
  state.log = [
    'Turn 7 — your move.',
    'Duchess Cinder plays Ash Phoenix.',
    'Cinder Imp strikes Coral Guard for 3!',
    'Combo ×3! Same faction — +1 ATK.',
    'Coral Guard burns for 2 next turn.',
    'Ember Volley ready in hand.',
  ];
  state.showAnnotations = true;
  state.phase = 'player';
  spawnParticles();
}

function stageShot() {
  const shot = params.get('shot');
  if (shot === 'cover') stageCover();
  else if (shot === 'title') { state.screen = 'title'; spawnParticles(); }
  else if (shot === 'win') {
    startDuel(2); state.ai.life = 0; state.player.life = 18; state.turn = 9; state.cardsPlayed = 14;
    state.screen = 'win'; state.stars.cinder = 3;
  } else if (shot === 'loss') {
    startDuel(4); state.player.life = 0; state.ai.life = 14; state.turn = 11; state.cardsPlayed = 12;
    state.screen = 'loss';
  }
}

stageShot();

function loop() {
  // Drift particles upward for a living table.
  for (const pt of state.particles) { pt.y -= pt.vy || 0.3; if (pt.y < 0) pt.y = 720; }
  draw(ctx, state);
  requestAnimationFrame(loop);
}
loop();
