# Ember Court

[![Make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/aam110/makefun-cardgame-20261123-0145/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/aam110/makefun-cardgame-20261123-0145/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**5 rivals • 40 cards • 3 factions** — an original turn-based duel card battler that runs
offline in a desktop browser from static files. No network, no images, no audio files:
all art is procedural Canvas 2D and all sound is WebAudio oscillators.

## The game

You are the **Warden of Embers**, duelling for the Ember Court. Each side has **30 life**.
Ember mana starts at 1, grows by 1 each turn (up to 10) and refills every turn.
Draw 1 card per turn; hand max 7. First to 0 life loses.

Three factions, told apart by **colour and glyph shape**, never text alone:

- **Flame** (red, flame glyph) — burn and burst damage.
- **Tide** (blue, wave glyph) — healing and card draw.
- **Thorn** (green, leaf glyph) — tough creatures and buffs.

## Mechanics beyond basic cards

1. **Combo** — play 2+ cards of the same faction in one turn and your creatures
   gain +1 ATK that turn. A visible Combo Meter tracks it.
2. **Hero Power: Kindle** — once per turn, 2 ember: deal 1 damage to any enemy
   creature or the rival directly.
3. **Burn** — a burning creature takes damage at the start of its owner's turn,
   shown as a flame badge with a counter on the card.
4. **Relics** — persistent board effects (Ember Heart, Tide Pearl, Thorn Crown,
   Gilded Coin) that change the rules while they sit on the table.

## Campaign — 5 named rivals

1. **Pip Sproutling** — Thorn Novice
2. **Captain Brine** — Tide Captain
3. **Duchess Cinder** — Flame Duchess
4. **The Gilded Broker** — Coin Trader
5. **The Hollow King** — Final Rival

Beating a rival unlocks the next and earns a medal (★). The AI reads its hand
and plays affordable creatures, casts spells at value, uses Kindle when lethal,
then attacks with everything — each rival with its own personality tweak
(Brine favours Tide spells, Cinder favours Burn).

## How to play

- **Click a hand card** to play it (if you can afford its ember cost).
- **Click one of your creatures, then an enemy creature or the rival portrait** to attack.
- **Kindle button** (2 ember) then click a target to deal 1 damage.
- **End Turn button** to pass to the rival.

## Controls

| Input | Action |
| --- | --- |
| Mouse click | Select / play cards, attack, press buttons |
| `1`–`7` | Play hand card 1–7 |
| `Space` | End turn |
| `M` | Mute / unmute sound |
| `Esc` | Back to title screen |

## Run it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome,
or run `node main.ts` with `MAKEFUN_OUTPUT_DIR` set to build the submission dossier.

## Files

- `main.ts` — Node 22 program that hands the entry in (copies `game/` + `screenshots/`, writes `dossier.json`).
- `game/index.html`, `game/style.css` — page chrome.
- `game/src/main.js` — game state, turn loop, input, screenshot staging.
- `game/src/cards.js` — all 40 card definitions, deck build, seeded shuffle.
- `game/src/opponent.js` — the 5 rivals and the AI turn logic.
- `game/src/render.js` — all Canvas 2D drawing (felt table, cards, HUD, screens).
- `game/src/audio.js` — WebAudio oscillator sounds.
