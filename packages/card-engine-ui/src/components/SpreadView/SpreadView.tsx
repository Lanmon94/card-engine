import React, { useRef, useMemo } from 'react';
import { View } from '@tarojs/components';
import type { Card as CardData, CardId } from '@card-engine/core';
import { Card } from '../Card/Card';
import type { CardProps } from '../Card/Card';

export type SpreadLayout = 'fan' | 'grid' | 'line';

export interface SpreadViewProps {
  cards: readonly CardData[];
  layout?: SpreadLayout;
  fanAngle?: number;
  rows?: number;
  columns?: number;
  animateCards?: boolean;
  onCardTap?: (card: CardData, index: number) => void;
  renderCard?: (card: CardData, index: number) => React.ReactNode;
  cardSize?: CardProps['size'];
  className?: string;
  style?: React.CSSProperties;
}

export const SpreadView: React.FC<SpreadViewProps> = ({
  cards,
  layout = 'line',
  fanAngle = 30,
  rows = 1,
  columns,
  animateCards = false,
  onCardTap,
  renderCard,
  cardSize = 'md',
  className = '',
  style,
}) => {
  const cols = columns ?? Math.ceil(cards.length / rows);
  const prevCardIdsRef = useRef<CardId[]>([]);

  const newCardIds = useMemo(() => {
    if (!animateCards) return new Set<CardId>();
    const current = new Set(cards.map(c => c.id));
    const prev = new Set(prevCardIdsRef.current);
    const added = new Set([...current].filter(id => !prev.has(id)));
    prevCardIdsRef.current = cards.map(c => c.id);
    return added;
  }, [cards, animateCards]);

  const containerStyle: React.CSSProperties = {
    display: layout === 'grid' ? 'grid' : 'flex',
    flexDirection: layout === 'fan' ? 'row' : layout === 'line' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: layout === 'fan' ? '0' : '8px',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: layout === 'fan' ? '20px 0' : '0',
    ...style,
  };

  if (layout === 'grid' && columns) {
    (containerStyle as Record<string, string>).gridTemplateColumns = `repeat(${cols}, 1fr)`;
  }

  const getCardStyle = (index: number, total: number): React.CSSProperties => {
    if (layout === 'fan') {
      const mid = (total - 1) / 2;
      const offset = index - mid;
      const angle = offset * (fanAngle / total);
      return {
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'bottom center',
        marginLeft: total > 1 ? '-20px' : '0',
        marginRight: total > 1 ? '-20px' : '0',
        zIndex: index,
      };
    }
    return {};
  };

  return (
    <View className={`card-engine-spread ${className}`} style={containerStyle}>
      {cards.map((card, index) => {
        const isNew = newCardIds.has(card.id);
        return (
          <View
            key={card.id}
            style={getCardStyle(index, cards.length)}
            onClick={() => onCardTap?.(card, index)}
          >
            {renderCard ? (
              renderCard(card, index)
            ) : (
              <Card
                card={card}
                size={cardSize}
                animateIn={isNew ? 'deal' : undefined}
                onTap={() => onCardTap?.(card, index)}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

SpreadView.displayName = 'SpreadView';
