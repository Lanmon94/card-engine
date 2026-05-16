import type { Card } from '../models/Card';
import { Rank, Suit } from '../models/Card';

const SUIT_ORDER: Record<Suit, number> = {
  [Suit.Clubs]: 0,
  [Suit.Diamonds]: 1,
  [Suit.Hearts]: 2,
  [Suit.Spades]: 3,
};

export function sortByRank(cards: readonly Card[], ascending = true): Card[] {
  return [...cards].sort((a, b) => {
    const ra = a.rank ?? 0;
    const rb = b.rank ?? 0;
    return ascending ? ra - rb : rb - ra;
  });
}

export function sortBySuit(cards: readonly Card[], suitOrder?: Suit[]): Card[] {
  const order = suitOrder ?? [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
  const index = new Map(order.map((s, i) => [s, i]));
  return [...cards].sort((a, b) => {
    const ia = a.suit ? (index.get(a.suit) ?? 99) : 99;
    const ib = b.suit ? (index.get(b.suit) ?? 99) : 99;
    return ia - ib;
  });
}
