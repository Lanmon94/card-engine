import { generateId } from '../utils/id';

export enum Rank {
  Ace = 1,
  Two = 2, Three = 3, Four = 4, Five = 5,
  Six = 6, Seven = 7, Eight = 8, Nine = 9,
  Ten = 10,
  Jack = 11, Queen = 12, King = 13,
}

export enum Suit {
  Clubs    = 'clubs',
  Diamonds = 'diamonds',
  Hearts   = 'hearts',
  Spades   = 'spades',
}

export enum CardFace {
  Up   = 'up',
  Down = 'down',
}

export type CardId = string;

export interface Card {
  readonly id: CardId;
  readonly face: CardFace;
  readonly rank?: Rank;
  readonly suit?: Suit;
  readonly meta?: Record<string, unknown>;
}

export interface CreateCardOptions {
  id?: CardId;
  face?: CardFace;
  meta?: Record<string, unknown>;
}

export function createCard(rank: Rank, suit: Suit, opts?: CreateCardOptions): Card {
  return {
    id: opts?.id ?? generateId(),
    face: opts?.face ?? CardFace.Down,
    rank,
    suit,
    meta: opts?.meta,
  };
}
