import type { Hand } from './Hand';
import type { Pile } from './Pile';
import type { Card } from './Card';
import type { GameAction } from '../actions/actions';
import { CardFace } from './Card';

export type Zone = Pile | Hand;

export enum GamePhase {
  Setup    = 'setup',
  Playing  = 'playing',
  RoundEnd = 'roundEnd',
  GameOver = 'gameOver',
}

export interface GameState {
  readonly zones: Record<string, Zone>;
  readonly phase: GamePhase;
  readonly turn: number;
  readonly history: GameAction[];
}

export function createGameState(zones?: Record<string, Zone>): GameState {
  return {
    zones: zones ?? {},
    phase: GamePhase.Setup,
    turn: 0,
    history: [],
  };
}

function replaceCards(zone: Zone, cards: readonly Card[]): Zone {
  // Both Hand and Pile have 'cards', so spread with cards replaced works for both.
  // The consumer-visible methods (.add, .removeCard) are not re-applied here —
  // the reducer operates at the data level.
  return { ...zone, cards } as Zone;
}

function flipCardInZone(zone: Zone, cardId: string, face: CardFace): Zone {
  const idx = zone.cards.findIndex(c => c.id === cardId);
  if (idx < 0) return zone;
  const newCards = [...zone.cards];
  newCards[idx] = { ...newCards[idx], face };
  return replaceCards(zone, newCards);
}

function findCardInZones(zones: Record<string, Zone>, cardId: string): { zoneKey: string; card: Card } | undefined {
  for (const key of Object.keys(zones)) {
    const found = zones[key].cards.find(c => c.id === cardId);
    if (found) return { zoneKey: key, card: found };
  }
  return undefined;
}

function moveCard(zones: Record<string, Zone>, cardId: string, fromKey: string, toKey: string): Record<string, Zone> {
  const result = { ...zones };
  const fromZone = result[fromKey];
  const toZone = result[toKey];
  if (!fromZone || !toZone) return zones;

  const idx = fromZone.cards.findIndex(c => c.id === cardId);
  if (idx < 0) return zones;

  const card = fromZone.cards[idx];
  const fromCards = [...fromZone.cards];
  fromCards.splice(idx, 1);

  result[fromKey] = replaceCards(fromZone, fromCards);
  result[toKey] = replaceCards(toZone, [...toZone.cards, { ...card }]);
  return result;
}

export function reduce(state: GameState, action: GameAction): GameState {
  let nextZones = { ...state.zones };

  switch (action.type) {
    case 'DEAL': {
      const toZone = nextZones[action.to];
      if (!toZone) return state;

      const dealtCards: Card[] = [];
      for (const cardId of action.cards) {
        const found = findCardInZones(nextZones, cardId);
        if (found) {
          dealtCards.push(found.card);
          const fromZone = nextZones[found.zoneKey];
          nextZones[found.zoneKey] = replaceCards(
            fromZone,
            fromZone.cards.filter(c => c.id !== cardId)
          );
        }
      }

      const toCards = [...toZone.cards, ...dealtCards.map(c => ({ ...c, face: CardFace.Up }))];
      nextZones[action.to] = replaceCards(toZone, toCards);
      break;
    }

    case 'DRAW': {
      const fromZone = nextZones[action.from];
      const toZone = nextZones[action.to];
      if (!fromZone || !toZone) return state;
      const count = action.count ?? 1;

      const fromCards = [...fromZone.cards];
      const drawn: Card[] = [];
      for (let i = 0; i < count && fromCards.length > 0; i++) {
        const c = fromCards.pop()!;
        drawn.unshift({ ...c, face: CardFace.Up });
      }

      nextZones[action.from] = replaceCards(fromZone, fromCards);
      nextZones[action.to] = replaceCards(toZone, [...toZone.cards, ...drawn]);
      break;
    }

    case 'DISCARD':
    case 'MOVE': {
      nextZones = moveCard(nextZones, action.cardId, action.from, action.to);
      break;
    }

    case 'FLIP': {
      for (const cardId of action.cardIds) {
        for (const key of Object.keys(nextZones)) {
          const zone = nextZones[key];
          if (zone.cards.some(c => c.id === cardId)) {
            nextZones[key] = flipCardInZone(zone, cardId, action.face);
            break;
          }
        }
      }
      break;
    }

    case 'SHUFFLE': {
      const zone = nextZones[action.pileId];
      if (!zone) return state;
      const shuffled = [...zone.cards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      nextZones[action.pileId] = replaceCards(zone, shuffled);
      break;
    }

    case 'SORT_HAND': {
      const hand = nextZones[action.handId];
      if (!hand) return state;
      const sorted = [...hand.cards].sort((a, b) => {
        const sa = a.suit ?? '';
        const sb = b.suit ?? '';
        if (sa !== sb) return sa < sb ? -1 : 1;
        return (a.rank ?? 0) - (b.rank ?? 0);
      });
      nextZones[action.handId] = replaceCards(hand, sorted);
      break;
    }

    case 'RESET': {
      return createGameState(nextZones);
    }
  }

  return {
    zones: nextZones,
    phase: state.phase,
    turn: state.turn + 1,
    history: [...state.history, action],
  };
}
