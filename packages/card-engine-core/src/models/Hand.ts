import type { Card, CardId } from './Card';

export interface Hand {
  readonly cards: readonly Card[];
  readonly size: number;
  add(card: Card): Hand;
  remove(cardId: CardId): Hand;
  sort(comparator: (a: Card, b: Card) => number): Hand;
  hasCard(cardId: CardId): boolean;
}

function clone(hand: Hand, cards: readonly Card[]): Hand {
  return createHand(cards);
}

function createHandImpl(cards: readonly Card[]): Hand {
  return {
    get cards() { return cards; },
    get size() { return cards.length; },

    add(card: Card): Hand {
      return clone(this, [...cards, card]);
    },

    remove(cardId: CardId): Hand {
      return clone(this, cards.filter(c => c.id !== cardId));
    },

    sort(comparator: (a: Card, b: Card) => number): Hand {
      return clone(this, [...cards].sort(comparator));
    },

    hasCard(cardId: CardId): boolean {
      return cards.some(c => c.id === cardId);
    },
  };
}

export function createHand(cards?: readonly Card[]): Hand {
  return createHandImpl(cards ?? []);
}
