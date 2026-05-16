import { describe, it, expect } from 'vitest';
import { createPile, PileType } from '../src/models/Pile';
import { createCard, Rank, Suit } from '../src/models/Card';

describe('Pile', () => {
  const card1 = createCard(Rank.Ace, Suit.Spades);
  const card2 = createCard(Rank.King, Suit.Hearts);

  it('creates an empty pile', () => {
    const pile = createPile('test', PileType.PlayArea);
    expect(pile.cards).toHaveLength(0);
    expect(pile.id).toBe('test');
    expect(pile.type).toBe(PileType.PlayArea);
  });

  it('adds a card immutably', () => {
    const pile = createPile('test', PileType.Tableau);
    const pile2 = pile.addCard(card1);
    expect(pile.cards).toHaveLength(0);
    expect(pile2.cards).toHaveLength(1);
  });

  it('removes a card immutably', () => {
    const pile = createPile('test', PileType.Tableau)
      .addCard(card1)
      .addCard(card2);
    const pile2 = pile.removeCard(card1.id);
    expect(pile.cards).toHaveLength(2);
    expect(pile2.cards).toHaveLength(1);
    expect(pile2.cards[0].id).toBe(card2.id);
  });

  it('respects canAccept callback', () => {
    const pile = createPile('foundation', PileType.Foundation, {
      canAccept: (card) => card.suit === Suit.Hearts,
    });
    expect(pile.canAccept(card1)).toBe(false);
    expect(pile.canAccept(card2)).toBe(true);
  });

  it('respects maxSize', () => {
    const pile = createPile('small', PileType.PlayArea, { maxSize: 1 });
    const pile2 = pile.addCard(card1);
    expect(pile2.canAccept(card2)).toBe(false);
  });
});
