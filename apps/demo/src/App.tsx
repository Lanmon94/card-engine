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
  useCardAnimation,
  movePreset,
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

  // ── Move demo ──
  const [moveSide, setMoveSide] = useState(false);
  const [moveTrigger, setMoveTrigger] = useState(0);

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

  const handleMove = useCallback(() => {
    setMoveSide(prev => !prev);
    setMoveTrigger(t => t + 1);
  }, []);

  const moveDesc = useMemo(() => {
    if (moveTrigger === 0) return null;
    const fromX = moveSide ? -120 : 120;
    const toX = moveSide ? 120 : -120;
    return movePreset('move-card', {
      from: { x: fromX, y: 0 },
      to: { x: toX, y: 0 },
      duration: 400,
    });
  }, [moveTrigger, moveSide]);

  const { style: animStyle, isAnimating: isMoving } = useCardAnimation(moveDesc);

  const moveWrapperStyle: React.CSSProperties = (() => {
    if (moveTrigger === 0) return { transform: 'translate(-120px, 0px)' };
    if (isMoving) return animStyle as React.CSSProperties;
    const x = moveSide ? 120 : -120;
    return { transform: `translate(${x}px, 0px)` };
  })();

  return (
    <CardEngine state={gameState} config={{ size: 'md' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px', minHeight: '100vh' }}>
        {/* Header */}
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Card Engine</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>
          @card-engine/core + @card-engine/ui — 3D 翻牌、发牌、洗牌、移动动画效果演示
        </p>

        {/* Section 1: Single Cards with 3D Flip */}
        <div style={section}>
          <div style={label}>单张卡牌 — 点击触发 3D 翻牌</div>
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
          <div style={label}>手牌 — 扇形布局（发牌入场）</div>
          <div style={{ marginBottom: '8px' }}>
            <button onClick={handleResetHand} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              发新牌
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
          <div style={label}>手牌 — 线性布局（发牌入场）</div>
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
          <div style={label}>牌堆 — 点击牌库摸牌</div>
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
          <div style={label}>牌堆 — 洗牌动画</div>
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
              洗牌
            </button>
          </div>
        </div>

        {/* Section 6: Spread — Staggered Entrance */}
        <div style={section}>
          <div style={label}>展牌 — 逐张延迟入场</div>
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={handleSpreadDemo} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              发牌
            </button>
            <button onClick={handleClearSpread} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              清空
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

        {/* Section 7: Move — Card translation between two points */}
        <div style={section}>
          <div style={label}>卡牌移动 — 两点之间平移</div>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleMove} style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}>
              移动
            </button>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              {moveSide ? '→ 右侧' : '← 左侧'}
            </span>
          </div>
          <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ position: 'absolute', left: '8px', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>◀ 左侧</span>
            <span style={{ position: 'absolute', right: '8px', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>右侧 ▶</span>
            <div style={{
              ...moveWrapperStyle,
              willChange: moveTrigger > 0 ? 'transform' : undefined,
            }}>
              <Card
                card={{ ...initialDraw[0], face: CardFace.Up }}
                size={cardSize}
              />
            </div>
          </div>
        </div>

        {/* Section 8: Stats */}
        <div style={{ ...section, textAlign: 'center' }}>
          <div style={label}>统计</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            <div>牌组: {deck.remaining}</div>
            <div>手牌: {hand.size}</div>
            <div>牌库: {gameState.zones['stock'].cards.length}</div>
            <div>弃牌堆: {gameState.zones['waste'].cards.length}</div>
          </div>
        </div>
      </div>
    </CardEngine>
  );
}
