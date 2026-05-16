import type { Card, CardId } from './Card';
import { CardFace } from './Card';

export enum PileType {
  Stock      = 'stock',
  Waste      = 'waste',
  Tableau    = 'tableau',
  Foundation = 'foundation',
  PlayArea   = 'playArea',
  Custom     = 'custom',
}

export interface Pile {
  readonly id: string;
  readonly type: PileType;
  readonly cards: readonly Card[];
  readonly faceDirection: CardFace;
  readonly maxSize?: number;
  canAccept(card: Card): boolean;
  addCard(card: Card): Pile;
  removeCard(cardId: CardId): Pile;
}

export interface CreatePileOptions {
  cards?: Card[];
  faceDirection?: CardFace;
  maxSize?: number;
  canAccept?: (card: Card, pile: Pile) => boolean;
}

function clone(pile: Pile, cards: readonly Card[], canAcceptFn?: (card: Card, pile: Pile) => boolean): Pile {
  return createPileImpl(pile.id, pile.type, {
    cards: [...cards],
    faceDirection: pile.faceDirection,
    maxSize: pile.maxSize,
    canAccept: canAcceptFn,
  });
}

function createPileImpl(id: string, type: PileType, opts?: CreatePileOptions): Pile {
  const cards: readonly Card[] = opts?.cards ?? [];
  const faceDirection = opts?.faceDirection ?? CardFace.Down;
  const maxSize = opts?.maxSize;
  const canAcceptFn = opts?.canAccept ?? (() => true);

  const api: Pile = {
    id,
    type,
    get cards() { return cards; },
    faceDirection,
    maxSize,

    canAccept(card: Card): boolean {
      if (maxSize !== undefined && cards.length >= maxSize) return false;
      return canAcceptFn(card, api);
    },

    addCard(card: Card): Pile {
      return clone(api, [...cards, card], canAcceptFn);
    },

    removeCard(cardId: CardId): Pile {
      return clone(api, cards.filter(c => c.id !== cardId), canAcceptFn);
    },
  };

  return api;
}

export function createPile(id: string, type: PileType, opts?: CreatePileOptions): Pile {
  return createPileImpl(id, type, opts);
}
