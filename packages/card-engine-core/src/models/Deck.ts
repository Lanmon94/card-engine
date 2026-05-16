import type { Card } from './Card';
import { Rank, Suit, CardFace, createCard } from './Card';
import { fisherYatesShuffle } from '../utils/shuffle';
import { generateId } from '../utils/id';

export interface Deck {
  readonly cards: readonly Card[];
  readonly remaining: number;
  shuffle(): Deck;
  draw(count?: number): Card[];
  drawOne(): Card | undefined;
  addToTop(cards: Card[]): Deck;
  addToBottom(cards: Card[]): Deck;
  peek(count?: number): Card[];
  reset(): Deck;
}

interface DeckState {
  cards: Card[];
  original: Card[];
}

function createDeckImpl(cards: Card[], shuffled: boolean): Deck {
  const original = [...cards];
  const state: DeckState = { cards: [...cards], original };

  if (shuffled) fisherYatesShuffle(state.cards);

  const api: Deck = {
    get cards() { return state.cards; },
    get remaining() { return state.cards.length; },

    shuffle() {
      fisherYatesShuffle(state.cards);
      return api;
    },

    draw(count = 1): Card[] {
      return state.cards.splice(-count, count).reverse();
    },

    drawOne(): Card | undefined {
      return state.cards.pop();
    },

    addToTop(cards: Card[]): Deck {
      state.cards.push(...cards);
      return api;
    },

    addToBottom(cards: Card[]): Deck {
      state.cards.unshift(...cards);
      return api;
    },

    peek(count = 1): Card[] {
      return state.cards.slice(-count).reverse();
    },

    reset(): Deck {
      state.cards = [...state.original];
      return api;
    },
  };

  return api;
}

export function createDeck(cards: Card[], opts?: { shuffle?: boolean }): Deck {
  return createDeckImpl(cards, opts?.shuffle ?? false);
}

export function createStandardDeck(opts?: { shuffle?: boolean; jokers?: number }): Deck {
  const cards: Card[] = [];
  const suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
  const ranks = [
    Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five,
    Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
    Rank.Jack, Rank.Queen, Rank.King,
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(createCard(rank, suit, { face: CardFace.Down }));
    }
  }

  const jokerCount = opts?.jokers ?? 0;
  for (let i = 0; i < jokerCount; i++) {
    cards.push({
      id: generateId(),
      face: CardFace.Down,
      meta: { joker: true, index: i },
    });
  }

  return createDeckImpl(cards, opts?.shuffle ?? false);
}
