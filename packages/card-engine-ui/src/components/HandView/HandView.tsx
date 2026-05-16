import React, { useRef, useMemo } from 'react';
import { View } from '@tarojs/components';
import type { Hand as HandData, CardId } from '@card-engine/core';
import { Card } from '../Card/Card';
import type { CardProps } from '../Card/Card';

export interface HandViewProps {
  hand: HandData;
  layout?: 'fan' | 'linear' | 'stacked';
  overlap?: number;
  maxVisible?: number;
  selectedIds?: CardId[];
  selectable?: boolean;
  animateCards?: boolean;
  onSelect?: (cardId: CardId) => void;
  onCardTap?: (cardId: CardId) => void;
  renderCard?: (cardId: CardId, index: number) => React.ReactNode;
  cardSize?: CardProps['size'];
  className?: string;
  style?: React.CSSProperties;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  layout = 'linear',
  overlap = 30,
  maxVisible,
  selectedIds = [],
  selectable = false,
  animateCards = false,
  onSelect,
  onCardTap,
  renderCard,
  cardSize,
  className = '',
  style,
}) => {
  const visibleCards = maxVisible ? hand.cards.slice(0, maxVisible) : hand.cards;
  const prevCardIdsRef = useRef<CardId[]>([]);

  const newCardIds = useMemo(() => {
    if (!animateCards) return new Set<CardId>();
    const current = new Set(hand.cards.map(c => c.id));
    const prev = new Set(prevCardIdsRef.current);
    const added = new Set([...current].filter(id => !prev.has(id)));
    prevCardIdsRef.current = hand.cards.map(c => c.id);
    return added;
  }, [hand.cards, animateCards]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: layout === 'fan' ? 'center' : 'flex-start',
    position: 'relative',
    minHeight: '130px',
    paddingLeft: layout === 'fan' ? '20px' : '0',
    ...style,
  };

  const getCardStyle = (index: number, total: number): React.CSSProperties => {
    switch (layout) {
      case 'linear':
        return {
          marginLeft: index > 0 ? `-${overlap}px` : '0',
          zIndex: index,
          position: 'relative' as const,
        };

      case 'fan': {
        const mid = (total - 1) / 2;
        const offset = index - mid;
        const angle = offset * (overlap * 0.5);
        const yOffset = Math.abs(offset) * (overlap * 0.3);
        return {
          position: 'relative' as const,
          transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
          transformOrigin: 'bottom center',
          marginLeft: total > 1 ? `-${overlap}px` : '0',
          zIndex: index,
        };
      }

      case 'stacked':
        return {
          position: 'absolute' as const,
          left: `${index * (overlap * 0.1)}px`,
          top: `${index * 2}px`,
          zIndex: index,
        };

      default:
        return {};
    }
  };

  return (
    <View className={`card-engine-hand ${className}`} style={containerStyle}>
      {visibleCards.map((card, index) => {
        const isSelected = selectedIds.includes(card.id);
        const cardStyle = getCardStyle(index, visibleCards.length);
        const isNew = newCardIds.has(card.id);

        return (
          <View
            key={card.id}
            style={cardStyle}
            onClick={() => {
              if (selectable && onSelect) onSelect(card.id);
              if (onCardTap) onCardTap(card.id);
            }}
          >
            {renderCard ? (
              renderCard(card.id, index)
            ) : (
              <Card
                card={card}
                size={cardSize ?? 'md'}
                selected={isSelected}
                animateIn={isNew ? 'deal' : undefined}
                onTap={() => onCardTap?.(card.id)}
              />
            )}
          </View>
        );
      })}

      {maxVisible && hand.cards.length > maxVisible && (
        <View style={{
          marginLeft: layout === 'linear' ? `-${overlap}px` : '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '56px',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#999',
        }}>
          +{hand.cards.length - maxVisible}
        </View>
      )}
    </View>
  );
};

HandView.displayName = 'HandView';
