import type { CardId } from '../models/Card';
import type { CardFace } from '../models/Card';

export type GameAction =
  | { type: 'DEAL'; cards: CardId[]; to: string }
  | { type: 'DRAW'; from: string; to: string; count?: number }
  | { type: 'DISCARD'; cardId: CardId; from: string; to: string }
  | { type: 'MOVE'; cardId: CardId; from: string; to: string }
  | { type: 'FLIP'; cardIds: CardId[]; face: CardFace }
  | { type: 'SHUFFLE'; pileId: string }
  | { type: 'SORT_HAND'; handId: string }
  | { type: 'RESET' };
