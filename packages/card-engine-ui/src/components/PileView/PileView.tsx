import React, { useRef, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import type { Pile as PileData, Card as CardData, CardId } from '@card-engine/core';
import { CardFace } from '@card-engine/core';
import { Card } from '../Card/Card';
import type { CardProps } from '../Card/Card';
import { useCardAnimation } from '../../animations/useCardAnimation';
import { shufflePreset } from '../../animations/presets/shuffle';

export type PileLayout = 'stack' | 'spread' | 'grid';

export interface PileViewProps {
  pile: PileData;
  layout?: PileLayout;
  spreadOffset?: number;
  faceUp?: boolean;
  animateCards?: boolean;
  shuffling?: boolean;
  onCardTap?: (card: CardData, index: number) => void;
  onDraw?: (pile: PileData) => void;
  renderCard?: (card: CardData, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  cardSize?: CardProps['size'];
  className?: string;
  style?: React.CSSProperties;
}

export const PileView: React.FC<PileViewProps> = ({
  pile,
  layout = 'stack',
  spreadOffset = 4,
  faceUp,
  animateCards = false,
  shuffling = false,
  onCardTap,
  onDraw,
  renderCard,
  renderEmpty,
  cardSize = 'md',
  className = '',
  style,
}) => {
  const prevCardIdsRef = useRef<CardId[]>([]);

  const newCardIds = useMemo(() => {
    if (!animateCards) return new Set<CardId>();
    const current = new Set(pile.cards.map(c => c.id));
    const prev = new Set(prevCardIdsRef.current);
    const added = new Set([...current].filter(id => !prev.has(id)));
    prevCardIdsRef.current = pile.cards.map(c => c.id);
    return added;
  }, [pile.cards, animateCards]);

  const shuffleDesc = useMemo(() => {
    if (!shuffling) return null;
    return shufflePreset(pile.id, { duration: 500 });
  }, [shuffling, pile.id]);

  const { style: shuffleStyle } = useCardAnimation(shuffleDesc);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    minWidth: '80px',
    minHeight: '120px',
    ...style,
    ...shuffleStyle,
  };

  const handleTap = () => {
    if (onDraw && pile.cards.length > 0) {
      onDraw(pile);
    }
  };

  if (pile.cards.length === 0) {
    return (
      <View
        className={`card-engine-pile card-engine-pile--empty ${className}`}
        style={containerStyle}
        onClick={handleTap}
      >
        {renderEmpty ? renderEmpty() : (
          <View style={{
            width: '80px',
            height: '112px',
            border: '2px dashed rgba(0,0,0,0.15)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: '12px', color: '#aaa' }}>Empty</Text>
          </View>
        )}
      </View>
    );
  }

  const getCardStyle = (index: number, total: number): React.CSSProperties => {
    switch (layout) {
      case 'stack':
        return {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          zIndex: index,
        };

      case 'spread':
        return {
          position: 'absolute' as const,
          top: `${index * spreadOffset}px`,
          left: 0,
          zIndex: index,
        };

      case 'grid':
        return {
          position: 'relative' as const,
        };

      default:
        return {};
    }
  };

  const displayedCards = layout === 'stack' ? [pile.cards[pile.cards.length - 1]] : pile.cards;

  return (
    <View
      className={`card-engine-pile ${className}`}
      style={{
        ...containerStyle,
        height: layout === 'spread'
          ? `${112 + (pile.cards.length - 1) * spreadOffset}px`
          : undefined,
      }}
      onClick={handleTap}
    >
      {displayedCards.map((card, index) => {
        const displayFace = faceUp !== undefined
          ? (faceUp ? CardFace.Up : CardFace.Down)
          : card.face;
        const realIndex = layout === 'stack' ? pile.cards.length - 1 : index;
        const isNew = newCardIds.has(card.id);

        return (
          <View
            key={card.id}
            style={getCardStyle(realIndex, pile.cards.length)}
            onClick={(e) => {
              e.stopPropagation();
              if (onCardTap) onCardTap(card, index);
            }}
          >
            {renderCard ? (
              renderCard(card, index)
            ) : (
              <Card
                card={{ ...card, face: displayFace }}
                size={cardSize}
                animateIn={isNew ? 'deal' : undefined}
              />
            )}
          </View>
        );
      })}

      {layout === 'stack' && pile.cards.length > 1 && (
        <View style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          zIndex: pile.cards.length + 1,
        }}>
          <Text>{pile.cards.length}</Text>
        </View>
      )}
    </View>
  );
};

PileView.displayName = 'PileView';
