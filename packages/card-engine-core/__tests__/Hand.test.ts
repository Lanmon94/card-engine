import { describe, it, expect } from 'vitest';
import { createHand } from '../src/models/Hand';
import { createCard, Rank, Suit } from '../src/models/Card';

describe('Hand', () => {
  const card1 = createCard(Rank.Ace, Suit.Spades);
  const card2 = createCard(Rank.King, Suit.Hearts);
  const card3 = createCard(Rank.Two, Suit.Clubs);

  it('starts empty', () => {
    const hand = createHand();
    expect(hand.size).toBe(0);
    expect(hand.cards).toHaveLength(0);
  });

  it('adds a card immutably', () => {
    const hand = createHand();
    const hand2 = hand.add(card1);
    expect(hand.size).toBe(0);
    expect(hand2.size).toBe(1);
    expect(hand2.cards[0].id).toBe(card1.id);
  });

  it('removes a card immutably', () => {
    const hand = createHand().add(card1).add(card2);
    const hand2 = hand.remove(card1.id);
    expect(hand.size).toBe(2);
    expect(hand2.size).toBe(1);
    expect(hand2.cards[0].id).toBe(card2.id);
  });

  it('hasCard checks existence', () => {
    const hand = createHand().add(card1);
    expect(hand.hasCard(card1.id)).toBe(true);
    expect(hand.hasCard(card2.id)).toBe(false);
  });

  it('sorts by comparator', () => {
    const hand = createHand().add(card3).add(card1).add(card2);
    const sorted = hand.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    expect(sorted.cards[0].rank).toBe(Rank.Ace);
    expect(sorted.cards[1].rank).toBe(Rank.Two);
    expect(sorted.cards[2].rank).toBe(Rank.King);
  });
});
