import React, { useState, useMemo, useCallback } from 'react';
import {
  createStandardDeck,
  createHand,
  createPile,
  createGameState,
  reduce,
  CardFace,
  PileType,
  type GameState,
  type Pile,
} from '@card-engine/core';
import {
  CardEngine,
  Card,
  HandView,
  PileView,
  SpreadView,
  type CardProps,
} from '@card-engine/ui';

const section: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
};
const label: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  marginBottom: '10px',
};

export default function App() {
  const deck = useMemo(() => createStandardDeck({ shuffle: true }), []);

  const initialDraw = useMemo(() => deck.draw(10), [deck]);

  // ── Hand state ──
  const [hand, setHand] = useState(() => {
    let h = createHand();
    for (const c of initialDraw.slice(0, 5)) {
      h = h.add({ ...c, face: CardFace.Up });
    }
    return h;
  });
  const [handKey, setHandKey] = useState(0);

  // ── Game state (stock/waste) ──
  const [gameState, setGameState] = useState<GameState>(() => {
    const remaining = [...initialDraw.slice(5, 10)];
    return createGameState({
      stock: createPile('stock', PileType.Stock, {
        cards: remaining.map(c => ({ ...c, face: CardFace.Down })),
      }),
      waste: createPile('waste', PileType.Waste),
    });
  });

  // ── Shuffle demo pile ──
  const [shufflePile, setShufflePile] = useState(() =>
    createPile('shuffle-demo', PileType.Stock, {
      cards: initialDraw.slice(0, 5).map(c => ({ ...c, face: CardFace.Down })),
    })
  );
  const [shuffling, setShuffling] = useState(false);

  // ── Spread cards for entrance demo ──
  const [spreadCards, setSpreadCards] = useState<typeof initialDraw>([]);
  const [spreadKey, setSpreadKey] = useState(0);

  const cardSize: CardProps['size'] = { width: 70, height: 100 };

  // ── Handlers ──
  const handleResetHand = useCallback(() => {
    let h = createHand();
    for (const c of deck.draw(5)) {
      h = h.add({ ...c, face: CardFace.Up });
    }
    setHand(h);
    setHandKey(k => k + 1);
  }, [deck]);

  const handleDraw = useCallback(() => {
    setGameState(prev => {
      const stock = prev.zones['stock'];
      if (!stock || stock.cards.length === 0) return prev;
      return reduce(prev, { type: 'DRAW', from: 'stock', to: 'waste', count: 1 });
    });
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffling(true);
    setTimeout(() => {
      setShuffling(false);
      setShufflePile(prev => {
        const cards = [...prev.cards].sort(() => Math.random() - 0.5);
        return createPile('shuffle-demo', PileType.Stock, { cards });
      });
    }, 600);
  }, []);

  const handleSpreadDemo = useCallback(() => {
    const drawn = deck.draw(5);
    setSpreadCards([]);
    setSpreadKey(k => k + 1);
    // Stagger: add cards one by one
    setTimeout(() => setSpreadCards(drawn.slice(0, 1)), 50);
    setTimeout(() => setSpreadCards(drawn.slice(0, 2)), 150);
    setTimeout(() => setSpreadCards(drawn.slice(0, 3)), 250);
    setTimeout(() => setSpreadCards(drawn.slice(0, 4)), 350);
    setTimeout(() => setSpreadCards(drawn.slice(0, 5)), 450);
  }, [deck]);

  const handleClearSpread = useCallback(() => {
    setSpreadCards([]);
    setSpreadKey(k => k + 1);
  }, []);

  return (
    <CardEngine state={gameState} config={{ size: 'md' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px', minHeight: '100vh' }}>
        {/* Header */}
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Card Engine</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>
          @card-engine/core + @card-engine/ui — 3D flip, deal, shuffle animations
        </p>

        {/* Section 1: Single Cards with 3D Flip */}
        <div style={section}>
          <div style={label}>Single Cards — Tap to 3D Flip</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {initialDraw.slice(0, 5).map(c => (
              <Card
                key={c.id}
                card={{ ...c, face: CardFace.Down }}
                size={cardSize}
                flipOnTap
              />
            ))}
          </div>
        </div>

        {/* Section 2: Hand — Fan with animateCards */}
        <div style={section}>
          <div style={label}>Hand — Fan Layout (animateCards)</div>
          <div style={{ marginBottom: '8px' }}>
            <button onClick={handleResetHand} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              Deal New Hand
            </button>
          </div>
          <HandView
            key={handKey}
            hand={hand}
            layout="fan"
            overlap={18}
            animateCards
            cardSize={cardSize}
          />
        </div>

        {/* Section 3: Hand — Linear with animateCards */}
        <div style={section}>
          <div style={label}>Hand — Linear Layout (animateCards)</div>
          <HandView
            key={handKey}
            hand={hand}
            layout="linear"
            overlap={28}
            animateCards
            cardSize={cardSize}
          />
        </div>

        {/* Section 4: Piles — Stock & Waste */}
        <div style={section}>
          <div style={label}>Piles — Tap Stock to Draw</div>
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center' }}>
              <PileView
                pile={gameState.zones['stock'] as Pile}
                layout="stack"
                animateCards
                onDraw={handleDraw}
              />
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Stock</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <PileView
                pile={gameState.zones['waste'] as Pile}
                layout="spread"
                spreadOffset={5}
                faceUp
                animateCards
              />
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Waste</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <PileView
                pile={createPile('empty', PileType.Foundation)}
                layout="stack"
              />
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Empty</div>
            </div>
          </div>
        </div>

        {/* Section 5: Pile — Shuffle */}
        <div style={section}>
          <div style={label}>Pile — Shuffle Animation</div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
            <PileView
              pile={shufflePile}
              layout="stack"
              shuffling={shuffling}
            />
            <button onClick={handleShuffle} style={{
              padding: '8px 16px', fontSize: '13px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              Shuffle
            </button>
          </div>
        </div>

        {/* Section 6: Spread — Staggered Entrance */}
        <div style={section}>
          <div style={label}>Spread — Staggered Deal Entrance</div>
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={handleSpreadDemo} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              Deal Cards
            </button>
            <button onClick={handleClearSpread} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              Clear
            </button>
          </div>
          <SpreadView
            key={spreadKey}
            cards={spreadCards}
            layout="line"
            animateCards
            cardSize={cardSize}
          />
        </div>

        {/* Section 7: Stats */}
        <div style={{ ...section, textAlign: 'center' }}>
          <div style={label}>Stats</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            <div>Deck: {deck.remaining}</div>
            <div>Hand: {hand.size}</div>
            <div>Stock: {gameState.zones['stock'].cards.length}</div>
            <div>Waste: {gameState.zones['waste'].cards.length}</div>
          </div>
        </div>
      </div>
    </CardEngine>
  );
}
