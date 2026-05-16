import { describe, it, expect } from 'vitest';
import { createGameState, reduce, GamePhase } from '../src/models/GameState';
import { createPile, PileType } from '../src/models/Pile';
import { createHand } from '../src/models/Hand';
import { createCard, Rank, Suit, CardFace } from '../src/models/Card';
import type { Zone } from '../src/models/GameState';

describe('GameState', () => {
  function setup() {
    const card1 = createCard(Rank.Ace, Suit.Spades, { face: CardFace.Down });
    const card2 = createCard(Rank.King, Suit.Hearts, { face: CardFace.Down });
    const card3 = createCard(Rank.Two, Suit.Clubs, { face: CardFace.Down });

    const stock = createPile('stock', PileType.Stock, { cards: [card1, card2, card3] });
    const waste = createPile('waste', PileType.Waste);
    const hand = createHand();

    const zones: Record<string, Zone> = { stock, waste, hand };
    return { state: createGameState(zones), card1, card2, card3 };
  }

  it('creates with Setup phase', () => {
    const state = createGameState();
    expect(state.phase).toBe(GamePhase.Setup);
    expect(state.turn).toBe(0);
  });

  it('DRAW moves cards between zones', () => {
    const { state } = setup();
    const next = reduce(state, { type: 'DRAW', from: 'stock', to: 'waste', count: 1 });
    expect(next.zones.stock.cards).toHaveLength(2);
    expect(next.zones.waste.cards).toHaveLength(1);
    expect(next.zones.waste.cards[0].face).toBe(CardFace.Up);
    expect(next.turn).toBe(1);
  });

  it('MOVE transfers a card between zones', () => {
    const { state, card3 } = setup();
    // DRAW takes from the end: card3 is drawn
    const s1 = reduce(state, { type: 'DRAW', from: 'stock', to: 'waste', count: 1 });
    const drawnId = s1.zones.waste.cards[0].id;
    expect(drawnId).toBe(card3.id);
    const s2 = reduce(s1, { type: 'MOVE', cardId: card3.id, from: 'waste', to: 'hand' });
    expect(s2.zones.waste.cards).toHaveLength(0);
    expect(s2.zones.hand.cards).toHaveLength(1);
    expect(s2.zones.hand.cards[0].id).toBe(card3.id);
  });

  it('FLIP changes card face', () => {
    const { state, card1 } = setup();
    const next = reduce(state, { type: 'FLIP', cardIds: [card1.id], face: CardFace.Up });
    expect(next.zones.stock.cards[0].face).toBe(CardFace.Up);
  });

  it('SHUFFLE reorders cards', () => {
    const { state } = setup();
    const next = reduce(state, { type: 'SHUFFLE', pileId: 'stock' });
    expect(next.zones.stock.cards).toHaveLength(3);
    // Cards should still be the same set (just reordered)
    const ids = next.zones.stock.cards.map(c => c.id).sort();
    const origIds = state.zones.stock.cards.map(c => c.id).sort();
    expect(ids).toEqual(origIds);
  });

  it('SORT_HAND sorts by suit then rank', () => {
    const state = createGameState({
      hand: createHand([
        createCard(Rank.King, Suit.Hearts),
        createCard(Rank.Ace, Suit.Hearts),
        createCard(Rank.Two, Suit.Clubs),
      ]),
    });
    const next = reduce(state, { type: 'SORT_HAND', handId: 'hand' });
    const cards = next.zones.hand.cards;
    expect(cards[0].rank).toBe(Rank.Two);
    expect(cards[1].rank).toBe(Rank.Ace);
    expect(cards[2].rank).toBe(Rank.King);
  });

  it('records action history', () => {
    const { state } = setup();
    const next = reduce(state, { type: 'DRAW', from: 'stock', to: 'waste', count: 1 });
    expect(next.history).toHaveLength(1);
    expect(next.history[0].type).toBe('DRAW');
  });

  it('RESET clears turn counter while keeping zones', () => {
    const { state } = setup();
    const s1 = reduce(state, { type: 'DRAW', from: 'stock', to: 'waste', count: 2 });
    expect(s1.turn).toBe(1);
    const s2 = reduce(s1, { type: 'RESET' });
    expect(s2.turn).toBe(0);
    // After draw 2 from 3-card stock, stock has 1 card — RESET preserves zone state
    expect(s2.zones.stock.cards).toHaveLength(1);
  });
});
