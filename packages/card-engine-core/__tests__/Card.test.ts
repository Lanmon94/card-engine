import { describe, it, expect } from 'vitest';
import { createCard, Rank, Suit, CardFace } from '../src/models/Card';

describe('Card', () => {
  it('creates a card with rank and suit', () => {
    const card = createCard(Rank.Ace, Suit.Spades);
    expect(card.rank).toBe(Rank.Ace);
    expect(card.suit).toBe(Suit.Spades);
    expect(card.face).toBe(CardFace.Down);
    expect(card.id).toBeDefined();
  });

  it('creates unique ids', () => {
    const a = createCard(Rank.Two, Suit.Hearts);
    const b = createCard(Rank.Two, Suit.Hearts);
    expect(a.id).not.toBe(b.id);
  });

  it('respects face option', () => {
    const card = createCard(Rank.King, Suit.Diamonds, { face: CardFace.Up });
    expect(card.face).toBe(CardFace.Up);
  });
});
