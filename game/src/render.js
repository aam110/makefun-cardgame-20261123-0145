// render.js — ALL Canvas 2D drawing for Ember Court: felt table, cards, HUD, screens.
// Faction identity is colour + glyph shape (flame / wave / leaf), never text alone.
// Layout: play area x 0..980, full side HUD panel x 990..1270, canvas 1280x720.

import { FACTIONS } from './cards.js';

export const W = 1280, H = 720;
export const HUD_X = 990;
export const HAND_CARD_W = 112, HAND_CARD_H = 152;
export const BOARD_CARD_W = 104, BOARD_CARD_H = 132;

// Precomputed felt speckles so the table texture is stable frame to frame.
const SPECKLES = [];
{
  let s = 1234567;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < 900; i++) SPECKLES.push([rnd() * W, rnd() * H, rnd() * 2.2 + 0.4, rnd()]);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glyph(ctx, kind, x, y, size, color) {
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath();
  if (kind === 'flame') {
    ctx.moveTo(x, y - size);
    ctx.bezierCurveTo(x + size * 0.9, y - size * 0.2, x + size * 0.6, y + size * 0.4, x, y + size * 0.7);
    ctx.bezierCurveTo(x - size * 0.6, y + size * 0.4, x - size * 0.9, y - size * 0.2, x, y - size);
  } else if (kind === 'wave') {
    ctx.moveTo(x - size, y);
    ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.9, x, y);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.9, x + size, y);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.2, x, y + size * 0.5);
    ctx.quadraticCurveTo(x - size * 0.5, y + size * 0.8, x - size, y);
  } else { // leaf
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x + size, y - size * 0.2, x, y + size);
    ctx.quadraticCurveTo(x - size, y - size * 0.2, x, y - size);
    ctx.moveTo(x, y - size * 0.7); ctx.lineTo(x, y + size * 0.7);
  }
  ctx.fill(); ctx.restore();
}

function drawFelt(ctx) {
  const g = ctx.createRadialGradient(640, 300, 60, 640, 360, 760);
  g.addColorStop(0, '#2c6b3f'); g.addColorStop(0.55, '#1d4d2c'); g.addColorStop(1, '#0d2b16');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, a] of SPECKLES) {
    ctx.fillStyle = a > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  // Lamp glow pools.
  for (const [lx, ly, lr, col] of [[240, 120, 260, 'rgba(255,190,90,0.16)'], [880, 560, 280, 'rgba(255,170,60,0.12)'], [640, 60, 220, 'rgba(255,220,140,0.10)']]) {
    const lg = ctx.createRadialGradient(lx, ly, 10, lx, ly, lr);
    lg.addColorStop(0, col); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg; ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  }
  // Table border + centre emblem.
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 4; rr(ctx, 8, 8, 972, 704, 18); ctx.stroke();
  ctx.strokeStyle = 'rgba(201,162,39,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(490, 360, 150, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,120,0.10)';
  ctx.font = 'bold 26px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('EMBER COURT', 490, 368);
}

function drawChips(ctx, x, y, n) {
  const cols = ['#d4a017', '#c0392b', '#2e86c1', '#f5f5f5'];
  for (let i = 0; i < n; i++) {
    const cx = x + (i % 4) * 16 - 8, cy = y - Math.floor(i / 4) * 7;
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath(); ctx.ellipse(cx, cy, 15, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy, 15, 5, 0, 0.2, 2.9); ctx.fill();
  }
}

function drawCard(ctx, card, x, y, w, h, opts) {
  opts = opts || {};
  const f = FACTIONS[card.faction] || FACTIONS.FLAME;
  const sel = opts.selected, dim = opts.dim, faceDown = opts.faceDown;
  ctx.save();
  if (dim) ctx.globalAlpha = 0.45;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x + 3, y + 5, w, h, 10); ctx.fill();
  // Card body.
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#fdf6e3'); body.addColorStop(1, '#e8d9b0');
  ctx.fillStyle = faceDown ? '#5b2d8e' : body;
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = sel ? '#ffd700' : '#8a6d3b'; ctx.lineWidth = sel ? 4 : 2; rr(ctx, x, y, w, h, 10); ctx.stroke();
  if (faceDown) {
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; rr(ctx, x + 8, y + 8, w - 16, h - 16, 7); ctx.stroke();
    glyph(ctx, 'flame', x + w / 2, y + h / 2, 22, '#ffd700');
    ctx.restore(); return;
  }
  // Faction band + glyph.
  ctx.fillStyle = f.color; rr(ctx, x + 2, y + 2, w - 4, 26, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(11, w * 0.11)}px Georgia, serif`; ctx.textAlign = 'left';
  ctx.fillText(f.name.toUpperCase(), x + 26, y + 20);
  glyph(ctx, f.glyph, x + 15, y + 15, 8, '#fff');
  // Cost gem (top right).
  ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(x + w - 16, y + 15, 13, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + w - 16, y + 21);
  // Art panel: big glyph on faction tint.
  ctx.fillStyle = f.light; rr(ctx, x + 8, y + 32, w - 16, 52, 6); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; rr(ctx, x + 8, y + 32, w - 16, 52, 6); ctx.fill();
  glyph(ctx, f.glyph, x + w / 2, y + 58, 20, f.dark);
  // Name.
  ctx.fillStyle = '#221a08'; ctx.font = `bold ${Math.max(12, w * 0.115)}px Georgia, serif`;
  ctx.fillText(card.name, x + w / 2, y + 100);
  // Effect text.
  ctx.fillStyle = '#4a3f28'; ctx.font = `${Math.max(10, w * 0.09)}px Georgia, serif`;
  wrapText(ctx, card.text || '', x + w / 2, y + 116, w - 14, 13);
  // ATK / DEF pips for creatures.
  if (card.type === 'creature') {
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x + 18, y + h - 16, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(String(card.atk), x + 18, y + h - 11);
    ctx.fillStyle = '#2e86c1'; ctx.beginPath(); ctx.arc(x + w - 18, y + h - 16, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(String(card.hp !== undefined ? card.hp : card.def), x + w - 18, y + h - 11);
  } else {
    ctx.fillStyle = f.dark; ctx.font = `bold ${Math.max(11, w * 0.1)}px Georgia, serif`;
    ctx.fillText(card.type === 'spell' ? 'SPELL' : 'RELIC', x + w / 2, y + h - 14);
  }
  // Burn counter.
  if (card.burn > 0) {
    ctx.fillStyle = '#e8491d'; ctx.beginPath(); ctx.arc(x + w - 14, y + 46, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('B' + card.burn, x + w - 14, y + 51);
  }
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '', yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, cx, yy); line = word; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}

export function handRects(state) {
  const n = state.player.hand.length;
  const total = n * (HAND_CARD_W + 6);
  const x0 = Math.max(20, 490 - total / 2);
  return state.player.hand.map((c, i) => ({ card: c, index: i, x: x0 + i * (HAND_CARD_W + 6), y: 548, w: HAND_CARD_W, h: HAND_CARD_H }));
}

export function boardRects(side, state) {
  const board = side === 'player' ? state.player.board : state.ai.board;
  const y = side === 'player' ? 350 : 128;
  return board.map((c, i) => ({ card: c, x: 120 + i * (BOARD_CARD_W + 14), y, w: BOARD_CARD_W, h: BOARD_CARD_H }));
}

function drawLifeBar(ctx, x, y, w, label, life, maxLife, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(ctx, x, y, w, 22, 6); ctx.fill();
  ctx.fillStyle = color; rr(ctx, x + 2, y + 2, Math.max(4, (w - 4) * life / maxLife), 18, 5); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`${label}  ${life}/${maxLife}`, x + 6, y + 16);
}

function drawManaGems(ctx, x, y, mana, max) {
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('EMBER', x, y - 6);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i < mana ? '#ff8c1a' : 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(x + i * 20 + 8, y + 12, 8, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`${mana}/${max}`, x + 208, y + 17);
}

function drawButton(ctx, x, y, w, h, label, enabled, accent) {
  ctx.fillStyle = enabled ? (accent || '#c9a227') : '#555';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 10); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
}

function drawAnnotation(ctx, x, y, tx, ty, text) {
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  ctx.font = 'bold 13px Georgia, serif';
  const w = ctx.measureText(text).width + 18;
  ctx.fillStyle = 'rgba(20,16,4,0.92)'; rr(ctx, tx - w / 2, ty - 14, w, 28, 8); ctx.fill();
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5; rr(ctx, tx - w / 2, ty - 14, w, 28, 8); ctx.stroke();
  ctx.fillStyle = '#ffe27a'; ctx.textAlign = 'center';
  ctx.fillText(text, tx, ty + 5);
}

function drawHud(ctx, state) {
  const p = state.player, a = state.ai;
  ctx.fillStyle = '#14100a'; ctx.fillRect(HUD_X, 0, 290, H);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(HUD_X, 0, 3, H);
  let y = 18;
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('EMBER COURT', HUD_X + 16, y + 8); y += 30;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`Rival: ${state.rival.name}`, HUD_X + 16, y); y += 20;
  ctx.fillStyle = '#bbb'; ctx.font = '13px Georgia, serif';
  ctx.fillText(state.rival.title + '  •  ' + state.rival.faction, HUD_X + 16, y); y += 24;
  drawLifeBar(ctx, HUD_X + 16, y, 258, 'YOU', p.life, p.maxLife, '#2fae4e'); y += 32;
  drawLifeBar(ctx, HUD_X + 16, y, 258, 'RIVAL', a.life, a.maxLife, '#c0392b'); y += 36;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`Turn ${state.turn}  •  ${state.phase === 'player' ? 'YOUR TURN' : 'RIVAL TURN…'}`, HUD_X + 16, y); y += 22;
  ctx.fillStyle = '#ffd700'; ctx.font = '13px Georgia, serif';
  ctx.fillText(`Combo ×${p.comboCount}  ${p.comboCount >= 2 ? '— +1 ATK this turn!' : ''}`, HUD_X + 16, y); y += 8;
  // Combo meter bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; rr(ctx, HUD_X + 16, y, 258, 12, 6); ctx.fill();
  ctx.fillStyle = '#ff8c1a'; rr(ctx, HUD_X + 16, y, Math.min(258, p.comboCount * 86), 12, 6); ctx.fill(); y += 30;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('Decks & Discards', HUD_X + 16, y); y += 20;
  ctx.fillStyle = '#ccc'; ctx.font = '13px Georgia, serif';
  ctx.fillText(`Your deck ${p.deck.length}  •  discard ${p.discard.length}`, HUD_X + 16, y); y += 18;
  ctx.fillText(`Rival deck ${a.deck.length}  •  discard ${a.discard.length}`, HUD_X + 16, y); y += 18;
  ctx.fillText(`Your relics: ${p.relics.map((r) => r.name).join(', ') || 'none'}`, HUD_X + 16, y); y += 18;
  ctx.fillText(`Rival relics: ${a.relics.map((r) => r.name).join(', ') || 'none'}`, HUD_X + 16, y); y += 28;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('Game Log', HUD_X + 16, y); y += 6;
  ctx.strokeStyle = '#c9a227'; ctx.beginPath(); ctx.moveTo(HUD_X + 16, y); ctx.lineTo(HUD_X + 274, y); ctx.stroke(); y += 16;
  ctx.fillStyle = '#ddd'; ctx.font = '12px Georgia, serif';
  const lines = state.log.slice(-9);
  for (const line of lines) {
    wrapText(ctx, '• ' + line, HUD_X + 16, y, 258, 15);
    y += 15;
  }
  y = Math.max(y + 8, 560);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('Legend — 3 Factions', HUD_X + 16, y); y += 22;
  for (const key of ['FLAME', 'TIDE', 'THORN']) {
    const f = FACTIONS[key];
    ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(HUD_X + 26, y - 4, 8, 0, 7); ctx.fill();
    glyph(ctx, f.glyph, HUD_X + 26, y - 4, 5, '#fff');
    ctx.fillStyle = '#ddd'; ctx.font = '13px Georgia, serif';
    ctx.fillText(`${f.name} — ${key === 'FLAME' ? 'burn & burst' : key === 'TIDE' ? 'heal & draw' : 'tough & buff'}`, HUD_X + 42, y);
    y += 20;
  }
  ctx.fillStyle = '#999'; ctx.font = '12px Georgia, serif';
  ctx.fillText('Click card to play • click creature', HUD_X + 16, y + 6);
  ctx.fillText('then enemy to attack • Space: end turn', HUD_X + 16, y + 22);
}

function drawDuel(ctx, state) {
  drawFelt(ctx);
  const p = state.player, a = state.ai;
  // Opponent portrait + life.
  ctx.fillStyle = state.rival.portrait[2]; ctx.beginPath(); ctx.arc(90, 60, 38, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.stroke();
  glyph(ctx, 'flame', 90, 58, 16, state.rival.portrait[1]);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(state.rival.name, 140, 52);
  ctx.fillStyle = '#ffb347'; ctx.font = '13px Georgia, serif';
  ctx.fillText(state.rival.taunt, 140, 72);
  drawLifeBar(ctx, 140, 84, 200, 'RIVAL', a.life, a.maxLife, '#c0392b');
  // Opponent hand face-down (5 cards).
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`Rival hand ×${a.hand.length}`, 400, 100);
  a.hand.slice(0, 6).forEach((c, i) => drawCard(ctx, c, 400 + i * 44, 8, 56, 76, { faceDown: true }));
  // Deck + discard piles with counts.
  drawCard(ctx, { faction: 'FLAME', name: 'Deck', text: '', cost: 0 }, 900, 8, 56, 76, { faceDown: true });
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(`Deck ${a.deck.length}`, 928, 100);
  drawChips(ctx, 60, 700, 8); drawChips(ctx, 940, 700, 6);
  // Board zone labels.
  ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('RIVAL BOARD — ' + state.rival.name, 120, 120);
  ctx.fillText('YOUR BOARD — Warden of Embers', 20, 342);
  // Rival board.
  for (const r of boardRects('ai', state)) drawCard(ctx, r.card, r.x, r.y, r.w, r.h, {});
  // Player board.
  for (const r of boardRects('player', state)) {
    const sel = state.attackerUid === r.card.uid;
    drawCard(ctx, r.card, r.x, r.y, r.w, r.h, { selected: sel });
  }
  // Player portrait + life + mana (below the board row, clear of the cards).
  ctx.fillStyle = '#0f5c24'; ctx.beginPath(); ctx.arc(70, 503, 28, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.stroke();
  glyph(ctx, 'flame', 70, 501, 12, '#ffb347');
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('Warden of Embers', 108, 498);
  drawLifeBar(ctx, 108, 510, 200, 'YOU', p.life, p.maxLife, '#2fae4e');
  drawManaGems(ctx, 380, 492, p.mana, p.manaMax);
  // Hero power + End Turn buttons.
  drawButton(ctx, 620, 470, 150, 40, p.heroUsed ? 'Kindle (used)' : 'Kindle — 2 ember', !p.heroUsed && p.mana >= 2 && state.phase === 'player', '#e8491d');
  drawButton(ctx, 790, 470, 150, 40, 'END TURN (Space)', state.phase === 'player', '#2fae4e');
  ctx.fillStyle = '#fff'; ctx.font = '13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('Hero Power: deal 1 damage to any enemy creature or the rival.', 620, 530);
  // Player hand.
  ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`YOUR HAND ×${p.hand.length}  (max 7) — click a card to play it`, 20, 540);
  for (const r of handRects(state)) {
    const afford = r.card.cost <= p.mana && state.phase === 'player';
    drawCard(ctx, r.card, r.x, r.y, r.w, r.h, { selected: state.selectedHand === r.index, dim: !afford });
  }
  // Relics on the table edge (mid-table gap, clear of portraits and cards).
  ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('Your relics: ' + (p.relics.map((r) => '◆ ' + r.name).join('  ') || 'none'), 20, 290);
  // Particles / embers drifting.
  for (const pt of state.particles || []) {
    ctx.fillStyle = pt.color || 'rgba(255,140,26,0.8)';
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r || 3, 0, 7); ctx.fill();
  }
  // Annotations (cover shot density + readability).
  if (state.showAnnotations) {
    drawAnnotation(ctx, 172, 416, 330, 305, 'Cinder Imp — 3 ATK');
    drawAnnotation(ctx, 290, 426, 470, 340, 'Combo ×3 — same faction!');
    drawAnnotation(ctx, 290, 194, 560, 100, 'Burn: 2 damage next turn');
  }
  // Turn banner.
  if (state.phase === 'ai') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 330, 980, 44);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(`${state.rival.name} is thinking…`, 490, 358);
  }
  drawHud(ctx, state);
  // Mute toggle.
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Georgia, serif'; ctx.textAlign = 'right';
  ctx.fillText(state.muted ? 'Sound: OFF (M)' : 'Sound: ON (M)', 1270, 700);
}

function drawTitle(ctx, state) {
  drawFelt(ctx);
  // Scattered decorative cards.
  const deco = [
    { faction: 'FLAME', name: 'Cinder Imp', cost: 1, atk: 2, def: 1, text: 'A spark with teeth.', type: 'creature' },
    { faction: 'TIDE', name: 'Tidecaller', cost: 2, atk: 2, def: 3, text: 'Calls the deep.', type: 'creature' },
    { faction: 'THORN', name: 'Thornwall', cost: 2, atk: 1, def: 5, text: 'A wall that bites.', type: 'creature' },
  ];
  deco.forEach((c, i) => {
    ctx.save(); ctx.translate(420 + i * 140, 655); ctx.rotate((i - 1) * 0.1);
    drawCard(ctx, c, -42, -57, 84, 114, {}); ctx.restore();
  });
  drawChips(ctx, 900, 640, 10); drawChips(ctx, 120, 640, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, 190, 60, 900, 300, 18); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3; rr(ctx, 190, 60, 900, 300, 18); ctx.stroke();
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 72px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('EMBER COURT', 640, 160);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('5 rivals  •  40 cards  •  3 factions', 640, 205);
  ctx.fillStyle = '#ffb347'; ctx.font = '17px Georgia, serif';
  ctx.fillText('A turn-based duel card battler — outwit the court, one ember at a time.', 640, 240);
  // Campaign list (spaced rows drawn by drawTitleCampaign).
  drawTitleCampaign(ctx, state);
  drawButton(ctx, 540, 500, 200, 52, '▶  PLAY', true, '#e8491d');
  ctx.fillStyle = '#ddd'; ctx.font = '14px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('Mouse: click cards & buttons  •  Keys: 1–7, Space end turn, Esc title  •  Flame burns, Tide heals, Thorn endures', 640, 580);
  drawHudTitle(ctx, state);
}

function drawTitleCampaign(ctx, state) {
  // Clear the placeholder rows area and draw spaced campaign rows.
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(ctx, 220, 300, 760, 190, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 17px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('CAMPAIGN — 5 RIVALS', 240, 326);
  state.campaign.forEach((r, i) => {
    const unlocked = i <= state.unlocked;
    const y = 356 + i * 28;
    ctx.fillStyle = r.portrait[0]; ctx.beginPath(); ctx.arc(258, y - 5, 10, 0, 7); ctx.fill();
    ctx.fillStyle = unlocked ? '#fff' : '#888'; ctx.font = '15px Georgia, serif';
    const medal = state.stars[r.id] ? '★'.repeat(state.stars[r.id]) : '';
    ctx.fillText(`${i + 1}. ${r.name} — ${r.title}`, 276, y);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(unlocked ? (medal || 'unlocked') : 'locked', 640, y);
    ctx.fillStyle = '#bbb'; ctx.font = '13px Georgia, serif';
    ctx.fillText(r.reward, 780, y);
  });
}

function drawHudTitle(ctx, state) {
  ctx.fillStyle = '#14100a'; ctx.fillRect(HUD_X, 0, 290, H);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(HUD_X, 0, 3, H);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('EMBER COURT', HUD_X + 16, 26);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('How to play', HUD_X + 16, 60);
  const lines = [
    '• Spend ember to play cards.',
    '• Creatures fight on the board.',
    '• Spells strike instantly.',
    '• Relics change the rules.',
    '• Combo: 2+ same-faction cards',
    '  in one turn = +1 ATK.',
    '• Hero Power Kindle: 2 ember,',
    '  deal 1 damage anywhere.',
    '• Burn: 1 damage at turn start.',
    '• First to 0 life loses.',
    '',
    'Deck: 40 cards',
    'Life: 30 each • Ember to 10',
  ];
  ctx.fillStyle = '#ddd'; ctx.font = '13px Georgia, serif';
  lines.forEach((l, i) => ctx.fillText(l, HUD_X + 16, 84 + i * 20));
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('Factions', HUD_X + 16, 400);
  for (const key of ['FLAME', 'TIDE', 'THORN']) {
    const f = FACTIONS[key];
    ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(HUD_X + 26, 424 + ['FLAME', 'TIDE', 'THORN'].indexOf(key) * 24 - 4, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#ddd'; ctx.font = '13px Georgia, serif';
    ctx.fillText(f.name, HUD_X + 42, 424 + ['FLAME', 'TIDE', 'THORN'].indexOf(key) * 24);
  }
}

function drawEnd(ctx, state, won) {
  drawFelt(ctx);
  drawChips(ctx, 120, 640, 10); drawChips(ctx, 900, 640, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, 240, 90, 800, 480, 20); ctx.fill();
  ctx.strokeStyle = won ? '#ffd700' : '#c0392b'; ctx.lineWidth = 4; rr(ctx, 240, 90, 800, 480, 20); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd700' : '#ff6b6b'; ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', 640, 190);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Georgia, serif';
  if (won) {
    ctx.fillText(`${state.rival.name} is defeated!`, 640, 235);
    ctx.fillStyle = '#ffb347'; ctx.font = '18px Georgia, serif';
    ctx.fillText(`Medal earned: ${state.rival.medal}  ★★★`, 640, 268);
    ctx.fillStyle = '#ddd';
    ctx.fillText(`Reward: ${state.rival.reward}`, 640, 296);
    ctx.fillText(`Final life: you ${state.player.life} — ${state.rival.name} ${Math.max(0, state.ai.life)}`, 640, 324);
    ctx.fillText(`Turns played: ${state.turn}  •  Cards played: ${state.cardsPlayed}`, 640, 352);
  } else {
    ctx.fillText(`${state.rival.name} prevails…`, 640, 235);
    ctx.fillStyle = '#ffb347'; ctx.font = '18px Georgia, serif';
    ctx.fillText('The Hollow King laughs. The court is silent.', 640, 268);
    ctx.fillStyle = '#ddd';
    ctx.fillText('Your life reached 0. The embers fade — but the court remains.', 640, 296);
    ctx.fillText(`Final life: you 0 — ${state.rival.name} ${Math.max(0, state.ai.life)}`, 640, 324);
    ctx.fillText(`You lasted ${state.turn} turns. Study the rival, then strike back.`, 640, 352);
  }
  ctx.fillStyle = '#fff'; ctx.font = '15px Georgia, serif';
  ctx.fillText('Campaign progress: ' + state.campaign.map((r, i) => (i <= state.unlocked ? '★' : '☆')).join(' '), 640, 396);
  drawButton(ctx, 480, 430, 320, 52, won ? 'NEXT RIVAL  ▶' : '↻  TRY AGAIN', true, won ? '#2fae4e' : '#e8491d');
  drawButton(ctx, 480, 496, 320, 44, 'BACK TO TITLE', true, '#555');
  drawHud(ctx, state);
}

export function draw(ctx, state) {
  ctx.clearRect(0, 0, W, H);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'win') drawEnd(ctx, state, true);
  else if (state.screen === 'loss') drawEnd(ctx, state, false);
  else drawDuel(ctx, state);
}
